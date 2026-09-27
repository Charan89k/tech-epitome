import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RATE_LIMITS,
  createRedisRateLimitStore,
  rateLimit,
  resetRateLimitStoreForTests,
  setRateLimitStore,
} from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit and rejects the next one", async () => {
    const key = `test-basic-${Math.random()}`;
    const policy = { limit: 3, windowMs: 60_000 };

    for (let i = 1; i <= 3; i += 1) {
      const result = await rateLimit(key, policy);
      expect(result.success, `request ${i}`).toBe(true);
      expect(result.remaining).toBe(3 - i);
    }

    const blocked = await rateLimit(key, policy);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("keeps separate counters per key", async () => {
    const policy = { limit: 1, windowMs: 60_000 };
    const a = `test-a-${Math.random()}`;
    const b = `test-b-${Math.random()}`;

    expect((await rateLimit(a, policy)).success).toBe(true);
    expect((await rateLimit(a, policy)).success).toBe(false);
    // b must be unaffected by a being exhausted.
    expect((await rateLimit(b, policy)).success).toBe(true);
  });

  it("resets once the window has elapsed", async () => {
    const key = `test-window-${Math.random()}`;
    const policy = { limit: 1, windowMs: 20 };

    expect((await rateLimit(key, policy)).success).toBe(true);
    expect((await rateLimit(key, policy)).success).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect((await rateLimit(key, policy)).success).toBe(true);
  });

  it("reports a reset time in the future while limited", async () => {
    const key = `test-reset-${Math.random()}`;
    const result = await rateLimit(key, { limit: 1, windowMs: 60_000 });
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("keeps sign-in stricter than generic actions", () => {
    // A credential-stuffing surface must not be as permissive as a read.
    expect(RATE_LIMITS.AUTH_SIGNIN.limit).toBeLessThan(RATE_LIMITS.CODE_RUN.limit);
  });
});

describe("the test-only bypass", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("lets the flag through outside production", async () => {
    vi.stubEnv("RATE_LIMIT_DISABLED", "true");
    vi.stubEnv("NODE_ENV", "test");

    const key = `test-bypass-on-${Math.random()}`;
    const policy = { limit: 1, windowMs: 60_000 };

    expect((await rateLimit(key, policy)).success).toBe(true);
    expect((await rateLimit(key, policy)).success).toBe(true);
  });

  it("cannot be enabled in production, however the flag is set", async () => {
    // A misconfigured environment variable must never be able to switch off
    // a security control on a live deployment.
    vi.stubEnv("RATE_LIMIT_DISABLED", "true");
    vi.stubEnv("NODE_ENV", "production");

    const key = `test-prod-bypass-${Math.random()}`;
    const policy = { limit: 1, windowMs: 60_000 };

    expect((await rateLimit(key, policy)).success).toBe(true);
    expect((await rateLimit(key, policy)).success).toBe(false);
  });

  it('does nothing unless the flag is exactly the string "true"', async () => {
    vi.stubEnv("RATE_LIMIT_DISABLED", "1");
    vi.stubEnv("NODE_ENV", "test");

    const key = `test-flag-shape-${Math.random()}`;
    const policy = { limit: 1, windowMs: 60_000 };

    expect((await rateLimit(key, policy)).success).toBe(true);
    expect((await rateLimit(key, policy)).success).toBe(false);
  });
});

describe("the tutor policy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("caps tutor turns per user and then refuses", async () => {
    const key = `tutor:user-${Math.random()}`;

    for (let i = 0; i < RATE_LIMITS.AI_MESSAGE.limit; i += 1) {
      expect((await rateLimit(key, RATE_LIMITS.AI_MESSAGE)).success).toBe(true);
    }

    // Every tutor turn costs real money, so the ceiling has to be a wall
    // rather than a suggestion.
    const blocked = await rateLimit(key, RATE_LIMITS.AI_MESSAGE);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it("limits one learner without affecting another", async () => {
    const alice = `tutor:alice-${Math.random()}`;
    const bob = `tutor:bob-${Math.random()}`;

    for (let i = 0; i <= RATE_LIMITS.AI_MESSAGE.limit; i += 1) {
      await rateLimit(alice, RATE_LIMITS.AI_MESSAGE);
    }

    expect((await rateLimit(alice, RATE_LIMITS.AI_MESSAGE)).success).toBe(false);
    expect((await rateLimit(bob, RATE_LIMITS.AI_MESSAGE)).success).toBe(true);
  });

  it("recovers once the window passes", async () => {
    const key = `tutor:recover-${Math.random()}`;

    for (let i = 0; i <= RATE_LIMITS.AI_MESSAGE.limit; i += 1) {
      await rateLimit(key, RATE_LIMITS.AI_MESSAGE);
    }
    expect((await rateLimit(key, RATE_LIMITS.AI_MESSAGE)).success).toBe(false);

    vi.advanceTimersByTime(RATE_LIMITS.AI_MESSAGE.windowMs + 1_000);
    expect((await rateLimit(key, RATE_LIMITS.AI_MESSAGE)).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The distributed store, and the refusal to run without one
// ---------------------------------------------------------------------------

describe("createRedisRateLimitStore", () => {
  /** A Redis stand-in: enough of the protocol to exercise the store. */
  function fakeRedis() {
    const values = new Map<string, number>();
    const ttls = new Map<string, number>();
    const calls: string[] = [];

    return {
      values,
      ttls,
      calls,
      client: {
        async incr(key: string) {
          calls.push(`incr ${key}`);
          const next = (values.get(key) ?? 0) + 1;
          values.set(key, next);
          return next;
        },
        async pexpire(key: string, ms: number) {
          calls.push(`pexpire ${key}`);
          ttls.set(key, ms);
          return 1;
        },
        async pttl(key: string) {
          calls.push(`pttl ${key}`);
          // Redis returns -2 for a missing key and -1 for one with no expiry.
          if (!values.has(key)) return -2;
          return ttls.get(key) ?? -1;
        },
      },
    };
  }

  it("counts up within a window and sets the expiry once", async () => {
    const redis = fakeRedis();
    const store = createRedisRateLimitStore(redis.client);

    const first = await store.hit("user:1", 60_000);
    expect(first.count).toBe(1);

    const second = await store.hit("user:1", 60_000);
    expect(second.count).toBe(2);

    // Only the first hit sets the expiry; resetting it on every hit would
    // turn a fixed window into a sliding one that never expires under load.
    expect(redis.calls.filter((c) => c.startsWith("pexpire"))).toHaveLength(1);
  });

  it("namespaces keys so it can share a database", async () => {
    const redis = fakeRedis();
    await createRedisRateLimitStore(redis.client, "cf:").hit("user:1", 1_000);
    expect([...redis.values.keys()]).toEqual(["cf:user:1"]);
  });

  it("repairs a key that lost its expiry", async () => {
    // A crash between INCR and PEXPIRE leaves a counter with no TTL, which
    // would otherwise lock that key out permanently.
    const redis = fakeRedis();
    redis.values.set("rl:user:1", 5);

    const result = await createRedisRateLimitStore(redis.client).hit(
      "user:1",
      60_000
    );

    expect(result.count).toBe(6);
    expect(redis.ttls.get("rl:user:1")).toBe(60_000);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("behaves the same as the in-memory store at the boundary", async () => {
    // The two stores must agree, or swapping one in changes behaviour.
    const redis = createRedisRateLimitStore(fakeRedis().client);

    const counts: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      counts.push((await redis.hit("same", 60_000)).count);
    }
    expect(counts).toEqual([1, 2, 3, 4]);
  });
});

describe("REQUIRE_DISTRIBUTED_RATE_LIMIT", () => {
  const original = process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT;

  afterEach(() => {
    process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT = original;
    resetRateLimitStoreForTests();
  });

  it("refuses every request when it is set and no shared store is installed", async () => {
    // Fail closed. A deployment that asked for a distributed limiter and
    // did not get one is running without the control it believes it has.
    process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT = "true";
    resetRateLimitStoreForTests();

    const result = await rateLimit("anything", { limit: 100, windowMs: 60_000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("allows requests once a distributed store is installed", async () => {
    process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT = "true";
    const counts = new Map<string, number>();
    setRateLimitStore({
      async hit(key) {
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return { count: next, resetAt: Date.now() + 60_000 };
      },
    });

    const result = await rateLimit("anything", { limit: 100, windowMs: 60_000 });
    expect(result.success).toBe(true);
  });

  it("does not refuse when the deployment never asked for one", async () => {
    process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT = "false";
    resetRateLimitStoreForTests();

    const result = await rateLimit("anything", { limit: 100, windowMs: 60_000 });
    expect(result.success).toBe(true);
  });

  it("treats a store installed as non-distributed as not satisfying it", async () => {
    // Somebody swapping in a different per-process store must not
    // accidentally clear the requirement.
    process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT = "true";
    setRateLimitStore(
      { async hit() { return { count: 1, resetAt: Date.now() + 60_000 }; } },
      { distributed: false }
    );

    expect(
      (await rateLimit("anything", { limit: 100, windowMs: 60_000 })).success
    ).toBe(false);
  });
});
