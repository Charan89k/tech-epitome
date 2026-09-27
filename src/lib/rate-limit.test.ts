import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RATE_LIMITS, rateLimit } from "./rate-limit";

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
