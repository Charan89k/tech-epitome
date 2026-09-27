import "server-only";

/**
 * Fixed-window rate limiter.
 *
 * Deliberately an interface with an in-memory default. The in-memory store is
 * per-process, which means it does NOT hold across a multi-instance or
 * serverless deployment - it is a real control for a single node and a
 * speed bump elsewhere. Swap in a Redis-backed store via `setRateLimitStore`
 * before running more than one instance; see README "Known limitations".
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

let store: RateLimitStore = new MemoryRateLimitStore();

export function setRateLimitStore(next: RateLimitStore): void {
  store = next;
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

export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  if (limitsDisabled()) {
    return { success: true, limit, remaining: limit, resetAt: Date.now() + windowMs };
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
