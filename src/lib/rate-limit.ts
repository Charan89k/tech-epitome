import "server-only";

/**
 * Fixed-window rate limiter.
 *
 * Deliberately an interface with an in-memory default. The in-memory store is
 * per-process, which means it does NOT hold across a multi-instance or
 * serverless deployment - it is a real control for a single node and a
 * speed bump elsewhere.
 *
 * For more than one instance, wrap any Redis client in
 * `createRedisRateLimitStore` and hand it to `setRateLimitStore` at
 * startup. Set `REQUIRE_DISTRIBUTED_RATE_LIMIT=true` alongside it and the
 * process refuses to serve a limited request on the in-memory store, so a
 * deployment that forgot the wiring fails loudly instead of quietly
 * running with a control that does not hold.
 */

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms at which the current window resets. */
  resetAt: number;
};

export interface RateLimitStore {
  /** Increments the counter for `key` and returns the new count plus window end. */
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  private lastSweep = Date.now();

  async hit(key: string, windowMs: number) {
    const now = Date.now();
    this.sweep(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, fresh);
      return fresh;
    }

    existing.count += 1;
    return existing;
  }

  /** Drops expired buckets so a long-lived process does not grow unbounded. */
  private sweep(now: number) {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

/**
 * The subset of a Redis client this needs.
 *
 * Structural rather than a dependency: `ioredis`, `node-redis` and every
 * hosted client expose these. Taking an interface means no client is
 * bundled, nothing is pinned to one vendor, and the store below is
 * testable against a fake rather than against a running server.
 */
export interface RedisLike {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
  pttl(key: string): Promise<number>;
}

/**
 * A fixed-window counter in Redis.
 *
 * `INCR` then `PEXPIRE` only on the first hit, which is the standard
 * fixed-window shape. The two commands are not atomic together, so a
 * crash between them could leave a key with no TTL; `pttl` returning -1
 * (exists, no expiry) is treated as that case and the expiry is re-set,
 * which bounds the damage to one window rather than forever.
 *
 * Fixed window, not sliding: it admits up to 2x the limit across a window
 * boundary. That is a known and accepted property — it matches the
 * in-memory store exactly, so behaviour does not change when the store
 * does, and for abuse prevention the simpler thing that both stores agree
 * on is worth more than the tighter one they would disagree about.
 */
export function createRedisRateLimitStore(
  client: RedisLike,
  prefix = "rl:"
): RateLimitStore {
  return {
    async hit(key, windowMs) {
      const namespaced = `${prefix}${key}`;
      const count = await client.incr(namespaced);

      let ttl = count === 1 ? -1 : await client.pttl(namespaced);
      if (ttl < 0) {
        // Either the first hit in this window, or a key that lost its
        // expiry to a crash between INCR and PEXPIRE.
        await client.pexpire(namespaced, windowMs);
        ttl = windowMs;
      }

      return { count, resetAt: Date.now() + ttl };
    },
  };
}

let store: RateLimitStore = new MemoryRateLimitStore();
let storeIsDistributed = false;

/**
 * Installs the store. Call once at startup, before serving.
 *
 * `distributed` is what `REQUIRE_DISTRIBUTED_RATE_LIMIT` checks. It
 * defaults to true because the only reason to replace the default store
 * is to get a shared one; a caller installing something else that is
 * still per-process has to say so.
 */
export function setRateLimitStore(
  next: RateLimitStore,
  { distributed = true }: { distributed?: boolean } = {}
): void {
  store = next;
  storeIsDistributed = distributed;
}

/** Test seam: puts the module back to a clean in-memory default. */
export function resetRateLimitStoreForTests(): void {
  store = new MemoryRateLimitStore();
  storeIsDistributed = false;
}

/**
 * True only when rate limiting has been explicitly switched off AND the
 * process is not in production.
 *
 * The end-to-end suite signs up a dozen throwaway accounts from one IP,
 * which the signup policy is specifically designed to stop. The two
 * conditions are deliberately ANDed against NODE_ENV so that setting the
 * flag on a production deploy does nothing at all - a misconfigured
 * environment variable must not be able to disable a security control.
 */
function limitsDisabled(): boolean {
  return (
    process.env.RATE_LIMIT_DISABLED === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

/**
 * Whether this deployment has declared it needs a shared limiter.
 *
 * Read per call rather than cached, so a test can set it; the cost is a
 * property lookup on an object that already exists.
 */
function requiresDistributed(): boolean {
  return process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT === "true";
}

export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  if (limitsDisabled()) {
    return { success: true, limit, remaining: limit, resetAt: Date.now() + windowMs };
  }

  // Fail closed, not open. A deployment that asked for a distributed
  // limiter and did not get one is running without the control it thinks
  // it has; refusing the request is recoverable, silently admitting it is
  // not. The alternative — starting up and hoping — is exactly the
  // "silent fallback to insecure rate limiting" this exists to prevent.
  if (requiresDistributed() && !storeIsDistributed) {
    console.error(
      "[rate-limit] REQUIRE_DISTRIBUTED_RATE_LIMIT is set but no distributed " +
        "store was installed. Refusing the request."
    );
    return { success: false, limit, remaining: 0, resetAt: Date.now() + windowMs };
  }

  const { count, resetAt } = await store.hit(key, windowMs);
  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

/** Named policies, so limits live in one place instead of at each call site. */
export const RATE_LIMITS = {
  /** Sign-in attempts. Tight: this is the credential-stuffing surface. */
  AUTH_SIGNIN: { limit: 8, windowMs: 10 * 60_000 },
  /** Account creation. */
  AUTH_SIGNUP: { limit: 5, windowMs: 60 * 60_000 },
  /** Code runs against sample tests. */
  CODE_RUN: { limit: 30, windowMs: 60_000 },
  /** Scored submissions. */
  CODE_SUBMIT: { limit: 20, windowMs: 60_000 },
  /** AI turns - each one costs money. */
  AI_MESSAGE: { limit: 30, windowMs: 60_000 },
  /**
   * Review grades. A review is one click, so a burst means a stuck key or a
   * double submission, not a person. Generous enough that a brisk session
   * never notices.
   */
  REVIEW_GRADE: { limit: 120, windowMs: 60_000 },
} as const;
