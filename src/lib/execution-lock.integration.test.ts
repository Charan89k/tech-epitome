import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db";
import {
  createPostgresExecutionLockStore,
  setExecutionLockStore,
  withExecutionSlot,
} from "@/lib/execution-lock";

/**
 * The one-execution-per-learner lease, against the real database.
 *
 * The property that matters is the one two browser tabs (or two serverless
 * instances) would exercise: while one execution holds the slot, a second
 * for the same learner is refused, not queued and not run.
 */

const PREFIX = `test-lock-${Date.now()}-`;

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

afterEach(() => {
  vi.unstubAllEnvs();
  setExecutionLockStore(null);
});

afterAll(async () => {
  await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: `exec:${PREFIX}` } } });
  await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: PREFIX } } });
});

describe("withExecutionSlot on the Postgres store", () => {
  it("refuses a second execution while the first is running", async () => {
    setExecutionLockStore(createPostgresExecutionLockStore());
    const owner = `${PREFIX}tabs`;
    const gate = deferred();

    const first = withExecutionSlot(owner, async () => {
      await gate.promise;
      return "first";
    });
    // Let the first acquire before the second asks.
    await new Promise((r) => setTimeout(r, 200));
    const second = await withExecutionSlot(owner, async () => "second");

    expect(second).toEqual({ ok: false });
    gate.resolve();
    expect(await first).toEqual({ ok: true, value: "first" });

    // Released: the next one runs.
    expect(await withExecutionSlot(owner, async () => "third")).toEqual({
      ok: true,
      value: "third",
    });
  });

  it("lets exactly one of two simultaneous requests through", async () => {
    setExecutionLockStore(createPostgresExecutionLockStore());
    const owner = `${PREFIX}race`;
    const gate = deferred();
    let ran = 0;

    const attempts = [1, 2].map(() =>
      withExecutionSlot(owner, async () => {
        ran += 1;
        await gate.promise;
      })
    );
    await new Promise((r) => setTimeout(r, 300));
    gate.resolve();
    const results = await Promise.all(attempts);

    expect(ran).toBe(1);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("gives a multi-slot owner exactly that many concurrent executions", async () => {
    setExecutionLockStore(createPostgresExecutionLockStore());
    const owner = `${PREFIX}ip`;
    const gate = deferred();

    const held = [0, 1, 2].map(() => withExecutionSlot(owner, () => gate.promise, { slots: 3 }));
    await new Promise((r) => setTimeout(r, 300));
    const fourth = await withExecutionSlot(owner, async () => 4, { slots: 3 });

    expect(fourth).toEqual({ ok: false });
    gate.resolve();
    expect((await Promise.all(held)).every((r) => r.ok)).toBe(true);
  });

  it("does not block a different learner", async () => {
    setExecutionLockStore(createPostgresExecutionLockStore());
    const gate = deferred();
    const a = withExecutionSlot(`${PREFIX}a`, () => gate.promise);
    await new Promise((r) => setTimeout(r, 200));

    expect(await withExecutionSlot(`${PREFIX}b`, async () => "b")).toEqual({
      ok: true,
      value: "b",
    });
    gate.resolve();
    await a;
  });

  it("releases the slot when the execution throws", async () => {
    setExecutionLockStore(createPostgresExecutionLockStore());
    const owner = `${PREFIX}throws`;

    await expect(
      withExecutionSlot(owner, async () => {
        throw new Error("executor down");
      })
    ).rejects.toThrow("executor down");

    expect((await withExecutionSlot(owner, async () => 1)).ok).toBe(true);
  });

  it("takes over an expired lease, and a stale release leaves the new one alone", async () => {
    const store = createPostgresExecutionLockStore();
    const key = `${PREFIX}expiry`;

    const stale = await store.acquire(key, 50);
    expect(stale).not.toBeNull();
    expect(await store.acquire(key, 60_000)).toBeNull(); // still live

    await new Promise((r) => setTimeout(r, 150));
    const fresh = await store.acquire(key, 60_000);
    expect(fresh).not.toBeNull();

    // The crashed holder's late release must not free the new holder's slot.
    await store.release(key, stale!);
    expect(await store.acquire(key, 60_000)).toBeNull();

    await store.release(key, fresh!);
    expect(await store.acquire(key, 60_000)).not.toBeNull();
  });
});

describe("store selection", () => {
  it("uses the shared Postgres store when RATE_LIMIT_STORE=postgres", async () => {
    vi.resetModules();
    vi.stubEnv("RATE_LIMIT_STORE", "postgres");
    vi.stubEnv("REQUIRE_DISTRIBUTED_RATE_LIMIT", "true");
    const fresh = await import("@/lib/execution-lock");
    const owner = `${PREFIX}env`;
    const gate = deferred();

    const first = fresh.withExecutionSlot(owner, () => gate.promise);
    await new Promise((r) => setTimeout(r, 200));
    const row = await prisma.rateLimitBucket.findUnique({ where: { key: `exec:${owner}` } });
    expect(row).not.toBeNull();

    gate.resolve();
    await first;
    expect(
      await prisma.rateLimitBucket.findUnique({ where: { key: `exec:${owner}` } })
    ).toBeNull();
  });

  it("fails closed when a shared store is required but not configured", async () => {
    vi.resetModules();
    vi.stubEnv("RATE_LIMIT_STORE", "");
    vi.stubEnv("REQUIRE_DISTRIBUTED_RATE_LIMIT", "true");
    const fresh = await import("@/lib/execution-lock");
    const work = vi.fn(async () => 1);

    expect(await fresh.withExecutionSlot(`${PREFIX}closed`, work)).toEqual({ ok: false });
    expect(work).not.toHaveBeenCalled();
  });
});
