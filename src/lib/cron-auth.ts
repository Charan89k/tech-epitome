import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getEnv } from "@/lib/env";

/** Constant time, and length-safe: `timingSafeEqual` throws on a mismatch. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The shared gate for scheduled jobs: a bearer token equal to CRON_SECRET.
 * Returns the refusal to send, or null to proceed. Unset secret refuses
 * everything rather than defaulting to open.
 */
export function refuseCron(request: NextRequest): NextResponse | null {
  const expected = getEnv().CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Scheduled jobs are not configured on this deployment." },
      { status: 503 }
    );
  }
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !secretMatches(provided, expected)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  return null;
}

/** A job outcome as the scheduler sees it: 200, 409 if already running, 500. */
export function jobResponse(
  outcome:
    | { status: "succeeded"; summary: unknown }
    | { status: "failed" }
    | { status: "already-running" }
): NextResponse {
  if (outcome.status === "already-running") {
    return NextResponse.json(
      { error: "This job is already running." },
      { status: 409 }
    );
  }
  if (outcome.status === "failed") {
    // The detail is in the job_runs row; the response says only that it failed.
    return NextResponse.json({ error: "The job failed." }, { status: 500 });
  }
  return NextResponse.json(outcome.summary);
}
