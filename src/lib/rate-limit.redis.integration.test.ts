import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

import { MinimalRedisClient, RedisUnavailableError } from "@/lib/redis-client";
import {
  createRedisRateLimitStore,
  rateLimit,
  resetRateLimitStoreForTests,
  setRateLimitStore,
} from "@/lib/rate-limit";

/**
 * The Redis rate-limit store, against a **real Redis server**.
 *
 * The unit suite already covers this store against a fake, including the
 * crash-between-INCR-and-PEXPIRE case. What a fake cannot tell you is
 * whether real Redis agrees: whether `PTTL` returns -1 or -2 in the
 * cases the code branches on, whether `INCR` on a key with a TTL keeps
 * it, whether the expiry actually fires. Those are the assumptions the
 * store is built on, and they are only worth anything if the server
 * confirms them.
 *
 * The server is started by this file and shut down afterwards, on a port
 * of its own, with persistence off so it leaves nothing behind. If the
 * binary is not present the suite **skips loudly** rather than passing
 * quietly — a Redis test that silently becomes a no-op is worse than no
 * test, because the README would go on claiming it runs.
 *
 * Point `REDIS_TEST_SERVER` at a `redis-server` binary, or
 * `REDIS_TEST_URL` at a server that is already running.
 */

const PORT = Number(process.env.REDIS_TEST_PORT ?? 6399);
const HOST = "127.0.0.1";
const BINARY = process.env.REDIS_TEST_SERVER;

let server: ChildProcess | null = null;
let client: MinimalRedisClient | null = null;
/** Why the suite is not running, when it is not. */
let unavailable: string | null = null;

async function waitForPort(attempts = 40): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    const probe = new MinimalRedisClient(HOST, PORT);
    try {
      await probe.connect(500);
      await probe.quit();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new RedisUnavailableError("Redis did not become reachable.");
}

beforeAll(async () => {
  // An already-running server wins: nothing should start a second one.
  const probe = new MinimalRedisClient(HOST, PORT);
  try {
    await probe.connect(400);
    await probe.quit();
  } catch {
    if (!BINARY || !existsSync(BINARY)) {
      unavailable =
        "no redis-server binary (set REDIS_TEST_SERVER) and nothing listening";
      return;
    }
    server = spawn(
      BINARY,
      [
        "--port",
        String(PORT),
        // Nothing written to disk, nothing left behind.
        "--save",
        "",
        "--appendonly",
        "no",
      ],
      { stdio: "ignore" }
    );
    try {
      await waitForPort();
    } catch (error) {
      unavailable = `redis-server did not start: ${(error as Error).message}`;
      server.kill("SIGKILL");
      server = null;
      return;
    }
  }

  client = new MinimalRedisClient(HOST, PORT);
  await client.connect();
}, 30_000);

afterAll(async () => {
  await client?.quit();
  if (server) {
    server.kill("SIGTERM");
    // Give it a moment, then insist.
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (!server.killed) server.kill("SIGKILL");
  }
  resetRateLimitStoreForTests();
});

beforeEach(async () => {
  await client?.flushall();
  resetRateLimitStoreForTests();
});

/**
 * Fails rather than skips when Redis is missing *and* the caller asked
 * for it explicitly, so a CI job that means to run these cannot lose
 * them to a silent skip.
 */
function requireRedis(): MinimalRedisClient {
  if (!client) {
    if (process.env.REDIS_TEST_REQUIRED === "true") {
      throw new Error(`Redis was required but unavailable: ${unavailable}`);
    }
    throw new Error("unreachable");
  }
  return client;
}

describe.skipIf(!process.env.REDIS_TEST_SERVER && !process.env.REDIS_TEST_URL)(
  "the Redis store against a real server",
  () => {
    it("connected to an actual Redis", () => {
      expect(unavailable, `Redis unavailable: ${unavailable}`).toBeNull();
      expect(requireRedis()).toBeTruthy();
    });

    it("INCR counts up from nothing", async () => {
      const redis = requireRedis();
      expect(await redis.incr("counter")).toBe(1);
      expect(await redis.incr("counter")).toBe(2);
      expect(await redis.incr("counter")).toBe(3);
    });

    it("PTTL reports -2 for a missing key and -1 for one with no expiry", async () => {
      // The store branches on `ttl < 0`, and these are the two negative
      // values real Redis actually returns. A fake could have returned
      // anything.
      const redis = requireRedis();
      expect(await redis.pttl("never-existed")).toBe(-2);

      await redis.incr("no-expiry");
      expect(await redis.pttl("no-expiry")).toBe(-1);
    });

    it("PEXPIRE sets a TTL that PTTL then reports", async () => {
      const redis = requireRedis();
      await redis.incr("with-expiry");
      await redis.pexpire("with-expiry", 5_000);

      const ttl = await redis.pttl("with-expiry");
      expect(ttl).toBeGreaterThan(4_000);
      expect(ttl).toBeLessThanOrEqual(5_000);
    });

    it("INCR on a key with a TTL keeps the TTL", async () => {
      // The store depends on this: it sets the expiry once, on the first
      // hit, and assumes later increments do not extend the window. If
      // Redis reset it, a fixed window would silently become a sliding
      // one that never expires under sustained load.
      const redis = requireRedis();
      await redis.incr("window");
      await redis.pexpire("window", 3_000);
      await new Promise((resolve) => setTimeout(resolve, 300));

      await redis.incr("window");
      const ttl = await redis.pttl("window");

      expect(ttl).toBeLessThan(2_900);
      expect(ttl).toBeGreaterThan(0);
    });

    it("a key actually disappears when its TTL elapses", async () => {
      const redis = requireRedis();
      await redis.incr("short");
      await redis.pexpire("short", 250);

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(await redis.pttl("short")).toBe(-2);
      // And the counter starts again, which is what makes the next
      // window a fresh one.
      expect(await redis.incr("short")).toBe(1);
    });

    // --- the store itself -------------------------------------------------

    it("counts hits and reports the real reset time", async () => {
      const store = createRedisRateLimitStore(requireRedis());

      const first = await store.hit("user:1", 60_000);
      expect(first.count).toBe(1);
      expect(first.resetAt).toBeGreaterThan(Date.now());

      const second = await store.hit("user:1", 60_000);
      expect(second.count).toBe(2);
      // Same window: the reset time did not move forward.
      expect(second.resetAt).toBeLessThanOrEqual(first.resetAt + 50);
    });

    it("namespaces its keys", async () => {
      const redis = requireRedis();
      await createRedisRateLimitStore(redis, "cf:").hit("user:1", 60_000);
      expect(await redis.pttl("cf:user:1")).toBeGreaterThan(0);
      expect(await redis.pttl("user:1")).toBe(-2);
    });

    it("repairs a key that lost its expiry, against real Redis", async () => {
      // The crash-between-INCR-and-PEXPIRE case, reproduced for real
      // rather than simulated: a counter with no TTL would otherwise
      // lock that key out permanently.
      const redis = requireRedis();
      await redis.incr("rl:orphan");
      expect(await redis.pttl("rl:orphan")).toBe(-1);

      const result = await createRedisRateLimitStore(redis).hit("orphan", 60_000);

      expect(result.count).toBe(2);
      expect(await redis.pttl("rl:orphan")).toBeGreaterThan(0);
    });

    it("starts a fresh window after the old one expires", async () => {
      const store = createRedisRateLimitStore(requireRedis());

      expect((await store.hit("expiring", 300)).count).toBe(1);
      expect((await store.hit("expiring", 300)).count).toBe(2);

      await new Promise((resolve) => setTimeout(resolve, 500));

      expect((await store.hit("expiring", 300)).count).toBe(1);
    });

    it("counts concurrent hits exactly once each", async () => {
      // The reason to use Redis at all. Twenty simultaneous requests
      // must produce twenty increments, not a lost update.
      const store = createRedisRateLimitStore(requireRedis());

      const results = await Promise.all(
        Array.from({ length: 20 }, () => store.hit("burst", 60_000))
      );

      const counts = results.map((r) => r.count).sort((a, b) => a - b);
      expect(counts).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    });

    it("two store instances share one counter", async () => {
      // Two instances of the app, one limit — which is the whole point,
      // and exactly what the in-memory store cannot do.
      const redis = requireRedis();
      const instanceA = createRedisRateLimitStore(redis);
      const instanceB = createRedisRateLimitStore(redis);

      await instanceA.hit("shared", 60_000);
      await instanceB.hit("shared", 60_000);
      const third = await instanceA.hit("shared", 60_000);

      expect(third.count).toBe(3);
    });

    // --- through the public API ------------------------------------------

    it("enforces a policy end to end through rateLimit()", async () => {
      setRateLimitStore(createRedisRateLimitStore(requireRedis()));

      const policy = { limit: 3, windowMs: 60_000 };
      const outcomes = [];
      for (let i = 0; i < 5; i += 1) {
        outcomes.push(await rateLimit("policy-key", policy));
      }

      expect(outcomes.map((o) => o.success)).toEqual([
        true,
        true,
        true,
        false,
        false,
      ]);
      expect(outcomes[2]!.remaining).toBe(0);
      expect(outcomes[4]!.remaining).toBe(0);
    });

    it("satisfies REQUIRE_DISTRIBUTED_RATE_LIMIT", async () => {
      const original = process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT;
      process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT = "true";
      try {
        setRateLimitStore(createRedisRateLimitStore(requireRedis()));
        const result = await rateLimit("distributed", {
          limit: 10,
          windowMs: 60_000,
        });
        expect(result.success).toBe(true);
      } finally {
        if (original === undefined) {
          delete process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT;
        } else {
          process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT = original;
        }
      }
    });

    // --- failure ----------------------------------------------------------

    it("surfaces an unreachable Redis rather than silently allowing", async () => {
      // Fail closed. A limiter that returns "allowed" when its backing
      // store is down is not a limiter.
      const dead = new MinimalRedisClient(HOST, 1);
      await expect(dead.connect(300)).rejects.toBeInstanceOf(
        RedisUnavailableError
      );

      const store = createRedisRateLimitStore(dead);
      await expect(store.hit("anything", 60_000)).rejects.toThrow();
    });

    it("surfaces a connection that drops mid-use", async () => {
      const dropped = new MinimalRedisClient(HOST, PORT);
      await dropped.connect();
      await dropped.quit();

      const store = createRedisRateLimitStore(dropped);
      await expect(store.hit("anything", 60_000)).rejects.toThrow();
    });
  }
);
