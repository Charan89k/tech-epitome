import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { notifyReviewsDue } from "@/services/notifications";

/**
 * The scheduled job that sends review reminders.
 *
 * CodeForge has no background worker, so this is an HTTP endpoint meant
 * to be called by whatever scheduler the deployment already has — a
 * platform cron, a Kubernetes CronJob, a systemd timer. **If nothing
 * calls it, no review reminders are sent.** That is stated here, in the
 * README and next to the preference itself, because a toggle for a
 * notification nobody will ever send is a lie.
 *
 * Auth is a shared secret in `CRON_SECRET`, compared in constant time.
 * When the variable is unset the route refuses every request rather than
 * defaulting to open: an unauthenticated endpoint that enumerates users
 * and writes rows is worse than a feature that is switched off.
 *
 * Deliberately not a GET. A scheduler that can only issue GETs can still
 * be pointed at this with `-X POST`, and keeping it a POST means a
 * prefetch, a crawler or a link click cannot trigger it.
 */

export const dynamic = "force-dynamic";

/** Constant time, and length-safe: `timingSafeEqual` throws on a mismatch. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
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

  const now = new Date();
  // One reminder per learner per day, however often the scheduler runs.
  const since = new Date(now.getTime() - 20 * 60 * 60 * 1000);

  // Group the due items rather than walking every user: the query is
  // bounded by the number of people with work waiting, not by signups.
  const due = await prisma.reviewItem.groupBy({
    by: ["userId"],
    where: { dueAt: { lte: now } },
    _count: true,
  });

  let sent = 0;
  for (const row of due) {
    // Sequential on purpose. This runs on a schedule with no user
    // waiting on it, and a burst of parallel writes is the wrong thing
    // to do to a database that is also serving requests.
    const ok = await notifyReviewsDue({
      userId: row.userId,
      dueCount: row._count,
      since,
    });
    if (ok) sent += 1;
  }

  return NextResponse.json({ learnersWithWork: due.length, sent });
}
