import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import {
  createPostgresRateLimitStore,
  rateLimit,
  resetRateLimitStoreForTests,
  setRateLimitStore,
} from "@/lib/rate-limit";

/**
 * The PostgreSQL store, against the real database.
 *
 * This is the store production runs on, so what matters is the property
 * the in-memory store cannot have: one counter shared by every caller,
 * with the reset and the increment atomic, so a burst cannot slip extra
 * requests through a race.
 */

const PREFIX = `test-pg-rl-${Date.now()}-`;

afterEach(() => {
  vi.unstubAllEnvs();
  resetRateLimitStoreForTests();
});

afterAll(async () => {
  await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: PREFIX } } });
});

describe("createPostgresRateLimitStore", () => {
  it("counts hits on one key and reports the window end", async () => {
    const store = createPostgresRateLimitStore();
    const key = `${PREFIX}count`;

    const first = await store.hit(key, 60_000);
    const second = await store.hit(key, 60_000);

    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
    // The window is fixed at the first hit, not pushed out by later ones.
    expect(second.resetAt).toBe(first.resetAt);
    expect(first.resetAt).toBeGreaterThan(Date.now() + 50_000);
  });

  it("starts a fresh window once the old one has expired", async () => {
    const store = createPostgresRateLimitStore();
    const key = `${PREFIX}expiry`;

    await store.hit(key, 50);
    await store.hit(key, 50);
    await new Promise((resolve) => setTimeout(resolve, 120));

    const after = await store.hit(key, 60_000);
    expect(after.count).toBe(1);
  });

  it("keeps keys independent", async () => {
    const store = createPostgresRateLimitStore();
    await store.hit(`${PREFIX}a`, 60_000);
    await store.hit(`${PREFIX}a`, 60_000);

    expect((await store.hit(`${PREFIX}b`, 60_000)).count).toBe(1);
  });

  it("loses no hits to a concurrent burst", async () => {
    const store = createPostgresRateLimitStore();
    const key = `${PREFIX}burst`;

    const results = await Promise.all(
      Array.from({ length: 20 }, () => store.hit(key, 60_000))
    );

    // Every caller saw a distinct count: no two increments read the same row.
    expect(results.map((r) => r.count).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1)
    );
  });

  it("enforces a policy through rateLimit", async () => {
    setRateLimitStore(createPostgresRateLimitStore());
    const key = `${PREFIX}policy`;
    const policy = { limit: 2, windowMs: 60_000 };

    expect((await rateLimit(key, policy)).success).toBe(true);
    expect((await rateLimit(key, policy)).success).toBe(true);
    expect((await rateLimit(key, policy)).success).toBe(false);
  });
});

describe("RATE_LIMIT_STORE=postgres", () => {
  it("satisfies REQUIRE_DISTRIBUTED_RATE_LIMIT without any startup wiring", async () => {
    vi.resetModules();
    vi.stubEnv("RATE_LIMIT_STORE", "postgres");
    vi.stubEnv("REQUIRE_DISTRIBUTED_RATE_LIMIT", "true");

    // A fresh module, as a cold serverless instance would load it.
    const fresh = await import("@/lib/rate-limit");
    const key = `${PREFIX}env`;
    const policy = { limit: 1, windowMs: 60_000 };

    expect((await fresh.rateLimit(key, policy)).success).toBe(true);
    expect((await fresh.rateLimit(key, policy)).success).toBe(false);
    expect(
      await prisma.rateLimitBucket.findUnique({ where: { key } })
    ).toMatchObject({ count: 2 });
  });
});
