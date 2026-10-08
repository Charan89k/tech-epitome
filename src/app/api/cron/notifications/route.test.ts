import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "./route";
import { resetEnvForTests } from "@/lib/env";

/**
 * The cron endpoint's authentication.
 *
 * This route enumerates users and sends mail, so it is the one place in
 * the product where getting authorization wrong means an open
 * mail-sending endpoint. Every refusal path is asserted, including the
 * one that matters most: **unset secret means refuse everything**, not
 * "allow everything".
 *
 * Kept separate from the pipeline tests, which use the service directly.
 */

const ORIGINAL = process.env.CRON_SECRET;
const SECRET = "a-sufficiently-long-cron-secret-value";

/**
 * An authorised request runs the whole reminder job over every learner
 * with due reviews in the shared dev database, sequentially by design.
 * That database accumulates accounts from every e2e run, so the job
 * outgrows vitest's 5s default; it took ~15s locally on 2026-10-08.
 */
const RUNS_THE_REAL_JOB = 60_000;

function request(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/cron/notifications", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  resetEnvForTests();
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL;
  resetEnvForTests();
});

describe("without a configured secret", () => {
  it("refuses every request rather than defaulting to open", async () => {
    // An unauthenticated endpoint that enumerates users and sends mail
    // is worse than a switched-off feature.
    delete process.env.CRON_SECRET;
    resetEnvForTests();

    const response = await POST(request() as never);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.error).toMatch(/not configured/i);
  });

  it("refuses even when a caller supplies some token", async () => {
    delete process.env.CRON_SECRET;
    resetEnvForTests();

    const response = await POST(
      request({ authorization: "Bearer anything" }) as never
    );
    expect(response.status).toBe(503);
  });
});

describe("with a configured secret", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    resetEnvForTests();
  });

  it("refuses a request with no authorization header", async () => {
    const response = await POST(request() as never);
    expect(response.status).toBe(401);
  });

  it("refuses a wrong secret", async () => {
    const response = await POST(
      request({ authorization: `Bearer ${SECRET}-wrong` }) as never
    );
    expect(response.status).toBe(401);
  });

  it("refuses a secret of a different length", async () => {
    // `timingSafeEqual` throws on a length mismatch; the comparison has
    // to check length first rather than letting that surface as a 500.
    const response = await POST(request({ authorization: "Bearer short" }) as never);
    expect(response.status).toBe(401);
  });

  it("refuses the right secret in the wrong scheme", async () => {
    const response = await POST(request({ authorization: SECRET }) as never);
    expect(response.status).toBe(401);
  });

  it("refuses an empty bearer", async () => {
    const response = await POST(request({ authorization: "Bearer " }) as never);
    expect(response.status).toBe(401);
  });

  it("accepts the right secret and reports what it did", async () => {
    const response = await POST(
      request({ authorization: `Bearer ${SECRET}` }) as never
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    // Real counts over real rows, and the email summary alongside.
    expect(typeof body.learnersWithWork).toBe("number");
    expect(typeof body.notified).toBe("number");
    expect(body.email).toBeDefined();
    expect(typeof body.email.considered).toBe("number");
    expect(typeof body.email.sent).toBe("number");
  }, RUNS_THE_REAL_JOB);

  it("never echoes the secret back", async () => {
    const response = await POST(
      request({ authorization: `Bearer ${SECRET}` }) as never
    );
    expect(JSON.stringify(await response.json())).not.toContain(SECRET);
  }, RUNS_THE_REAL_JOB);
});
