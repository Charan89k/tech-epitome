import "server-only";

import { randomInt } from "node:crypto";

/**
 * At most one code execution in flight per learner.
 *
 * A lease rather than a counter: taking it claims a row in
 * `rate_limit_buckets` until it is released or its TTL lapses, whichever is
 * first. The claim is one atomic upsert that only overwrites an *expired*
 * lease, so two requests racing from two tabs — or two serverless instances
 * — cannot both win, and an instance that dies mid-run blocks its learner
 * for at most the TTL, never forever.
 *
 * Same store selection as the rate limiter: `RATE_LIMIT_STORE=postgres`
 * shares leases across instances; otherwise they are per-process, which is
 * only correct on a single node. With `REQUIRE_DISTRIBUTED_RATE_LIMIT=true`
 * and no shared store, every acquisition is refused rather than silently
 * becoming per-process.
 *
 * The lease's `count` column holds a random token, so a release can only
 * delete the lease it took: if a run outlived its TTL and somebody else has
 * since taken the slot, the late release leaves theirs alone.
 */

/**
 * Longer than any execution can take: Judge0's adapter gives a batch 15s to
 * be accepted and 45s to finish, plus the database work either side.
 */
export const EXECUTION_LEASE_MS = 90_000;

/**
 * Concurrent executions allowed per IP for signed-out visitors.
 *
 * A signed-in learner gets exactly one slot. A visitor has no identity but
 * an IP, and one IP is often many people (a campus, an office, a carrier
 * NAT), so a single slot per IP would let one visitor block a whole lab.
 * A few slots keep that from happening while still bounding what one IP can
 * have in flight; the per-IP rate limit bounds the rest.
 */
export const ANONYMOUS_SLOTS_PER_IP = 4;

export interface ExecutionLockStore {
  /** Returns a release token, or null when the slot is already held. */
  acquire(key: string, ttlMs: number): Promise<number | null>;
  release(key: string, token: number): Promise<void>;
}

class MemoryExecutionLockStore implements ExecutionLockStore {
  private leases = new Map<string, { token: number; expiresAt: number }>();

  async acquire(key: string, ttlMs: number) {
    const now = Date.now();
    const held = this.leases.get(key);
    if (held && held.expiresAt > now) return null;
    const token = randomInt(1, 2 ** 31 - 1);
    this.leases.set(key, { token, expiresAt: now + ttlMs });
    return token;
  }

  async release(key: string, token: number) {
    if (this.leases.get(key)?.token === token) this.leases.delete(key);
  }
}

export function createPostgresExecutionLockStore(): ExecutionLockStore {
  return {
    async acquire(key, ttlMs) {
      const { prisma } = await import("@/lib/db/prisma");
      const token = randomInt(1, 2 ** 31 - 1);
      // The WHERE on DO UPDATE is the whole lock: a live lease is left
      // untouched and no row comes back; an expired one is taken over.
      const rows = await prisma.$queryRaw<{ count: number }[]>`
        INSERT INTO rate_limit_buckets ("key", "count", "resetAt")
        VALUES (${key}, ${token}, now() + ${ttlMs}::int * interval '1 millisecond')
        ON CONFLICT ("key") DO UPDATE SET
          "count" = EXCLUDED."count",
          "resetAt" = EXCLUDED."resetAt"
        WHERE rate_limit_buckets."resetAt" <= now()
        RETURNING "count"
      `;
      return rows.length === 1 ? token : null;
    },

    async release(key, token) {
      const { prisma } = await import("@/lib/db/prisma");
      await prisma.$executeRaw`
        DELETE FROM rate_limit_buckets WHERE "key" = ${key} AND "count" = ${token}
      `;
    },
  };
}

let store: ExecutionLockStore | null = null;
let storeIsDistributed = false;

function activeStore(): ExecutionLockStore {
  if (!store) {
    if (process.env.RATE_LIMIT_STORE === "postgres") {
      store = createPostgresExecutionLockStore();
      storeIsDistributed = true;
    } else {
      store = new MemoryExecutionLockStore();
      storeIsDistributed = false;
    }
  }
  return store;
}

/** Test seam, mirroring setRateLimitStore. */
export function setExecutionLockStore(
  next: ExecutionLockStore | null,
  { distributed = true }: { distributed?: boolean } = {}
): void {
  store = next;
  storeIsDistributed = next ? distributed : false;
}

export type ExecutionSlot<T> = { ok: true; value: T } | { ok: false };

/**
 * Runs `work` while holding one of `owner`'s execution slots (one, unless
 * `slots` says otherwise), or reports that every slot is taken. The slot is
 * released in `finally`, so a thrown error frees it as surely as a result.
 */
export async function withExecutionSlot<T>(
  owner: string,
  work: () => Promise<T>,
  { slots = 1 }: { slots?: number } = {}
): Promise<ExecutionSlot<T>> {
  const current = activeStore();
  if (process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === "true" && !storeIsDistributed) {
    console.error(
      "[execution-lock] REQUIRE_DISTRIBUTED_RATE_LIMIT is set but leases are " +
        "per-process. Refusing the execution."
    );
    return { ok: false };
  }

  let key = "";
  let token: number | null = null;
  for (let slot = 0; slot < slots && token === null; slot++) {
    // Slot 0 keeps the plain key, so a single-slot owner's lease is
    // `exec:<owner>` and easy to find.
    key = slot === 0 ? `exec:${owner}` : `exec:${owner}#${slot}`;
    token = await current.acquire(key, EXECUTION_LEASE_MS);
  }
  if (token === null) return { ok: false };

  try {
    return { ok: true, value: await work() };
  } finally {
    await current.release(key, token).catch((error: unknown) => {
      // The lease lapses on its own; a failed release costs one learner
      // at most EXECUTION_LEASE_MS, so it is logged, not rethrown.
      console.error("[execution-lock] release failed", error);
    });
  }
}
