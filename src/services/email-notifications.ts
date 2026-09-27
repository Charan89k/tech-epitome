import "server-only";

import { getEmailProvider } from "@/lib/email";
import { reviewReminderEmail } from "@/lib/email/templates";
import type { SendResult } from "@/lib/email/types";
import { prisma } from "@/lib/db";

/**
 * The review-reminder pipeline, end to end.
 *
 *   due reviews
 *     → eligibility (does this learner have work waiting?)
 *     → preference (did they ask for email?)
 *     → idempotency (have they already had this period's reminder?)
 *     → render
 *     → provider
 *     → persist the result, whatever it was
 *
 * Every stage can decline, and a decline is recorded rather than
 * swallowed. The thing this must never do is claim a delivery that did
 * not happen: `SendResult` distinguishes accepted from rejected from
 * skipped, and all three are written to `email_deliveries` with the
 * provider's own reason.
 *
 * "Accepted" means the provider took the message. Whether it later
 * bounced is a webhook this product does not have, and nothing here
 * says "delivered".
 */

export const REVIEW_REMINDER_KIND = "review-reminder";

/** One reminder per learner per UTC day. */
export function periodKeyFor(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export type ReminderOutcome =
  | "sent"
  | "already-sent"
  | "opted-out"
  | "no-due-reviews"
  | "no-address"
  | "rejected"
  | "skipped";

export type ReminderRunSummary = {
  considered: number;
  sent: number;
  alreadySent: number;
  optedOut: number;
  rejected: number;
  skipped: number;
  provider: string;
};

/**
 * Claims this period's slot for one learner.
 *
 * The insert *is* the lock. Two schedulers racing both run the query
 * above and both decide to send; only one can win the unique index, and
 * the loser gets a constraint violation instead of sending a duplicate.
 * A time-window `findFirst` would let both through.
 *
 * Returns false when the slot was already taken.
 */
async function claimPeriod(params: {
  userId: string;
  kind: string;
  periodKey: string;
  provider: string;
}): Promise<{ claimed: boolean; id?: string }> {
  try {
    const row = await prisma.emailDelivery.create({
      data: {
        userId: params.userId,
        kind: params.kind,
        periodKey: params.periodKey,
        provider: params.provider,
        // Provisional. Rewritten with the real outcome once the provider
        // has answered — and left as `attempted` if the process dies
        // mid-send, which is the honest record of what we know.
        status: "attempted",
      },
      select: { id: true },
    });
    return { claimed: true, id: row.id };
  } catch {
    // The unique constraint. Any other failure also lands here and is
    // treated as "do not send", which is the safe direction for mail.
    return { claimed: false };
  }
}

async function recordResult(id: string, result: SendResult): Promise<void> {
  await prisma.emailDelivery.update({
    where: { id },
    data: {
      status: result.status,
      provider: result.provider,
      providerId: result.status === "accepted" ? result.id : null,
      reason: result.status === "accepted" ? null : result.reason,
    },
  });
}

/**
 * Sends one learner their reminder, if every gate agrees.
 *
 * Exported on its own so the pipeline is testable a learner at a time
 * rather than only as a batch.
 */
export async function sendReviewReminder(params: {
  userId: string;
  now?: Date;
}): Promise<ReminderOutcome> {
  const now = params.now ?? new Date();
  const periodKey = periodKeyFor(now);

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      email: true,
      name: true,
      profile: { select: { emailReviewReminders: true } },
    },
  });

  if (!user?.email) return "no-address";

  // Opt-in, and checked before anything is written. A learner who never
  // asked for mail leaves no delivery row at all.
  if (!user.profile?.emailReviewReminders) return "opted-out";

  const dueCount = await prisma.reviewItem.count({
    where: { userId: params.userId, dueAt: { lte: now } },
  });
  if (dueCount === 0) return "no-due-reviews";

  const provider = getEmailProvider();

  const claim = await claimPeriod({
    userId: params.userId,
    kind: REVIEW_REMINDER_KIND,
    periodKey,
    provider: provider.name,
  });
  if (!claim.claimed || !claim.id) return "already-sent";

  const message = reviewReminderEmail(
    { email: user.email, name: user.name ?? undefined },
    { name: user.name, dueCount }
  );

  const result = await provider.send({
    ...message,
    // Belt and braces: the database constraint is the real guarantee,
    // but a provider that honours this collapses a retry too.
    idempotencyKey: `${REVIEW_REMINDER_KIND}:${params.userId}:${periodKey}`,
  });

  await recordResult(claim.id, result);

  if (result.status === "accepted") return "sent";
  return result.status === "rejected" ? "rejected" : "skipped";
}

/**
 * The batch the scheduler runs.
 *
 * Grouped by user over `review_items` rather than walking every account,
 * so the work is bounded by the number of people with something waiting
 * rather than by signups.
 *
 * Sequential on purpose. This runs on a schedule with nobody waiting on
 * it, and a burst of parallel sends is the wrong thing to do both to a
 * database that is also serving requests and to a provider's rate limit.
 */
export async function runReviewReminders(params: {
  now?: Date;
  /** Safety valve, so one run cannot mail an unbounded number of people. */
  limit?: number;
} = {}): Promise<ReminderRunSummary> {
  const now = params.now ?? new Date();
  const limit = Math.min(Math.max(params.limit ?? 500, 1), 5_000);

  const due = await prisma.reviewItem.groupBy({
    by: ["userId"],
    where: { dueAt: { lte: now } },
    _count: true,
    // Prisma requires an ordering alongside `take`, and a stable one
    // means a capped run resumes predictably rather than mailing a
    // random subset each time.
    orderBy: { userId: "asc" },
    take: limit,
  });

  const summary: ReminderRunSummary = {
    considered: due.length,
    sent: 0,
    alreadySent: 0,
    optedOut: 0,
    rejected: 0,
    skipped: 0,
    provider: getEmailProvider().name,
  };

  for (const row of due) {
    let outcome: ReminderOutcome;
    try {
      outcome = await sendReviewReminder({ userId: row.userId, now });
    } catch (error) {
      // One learner's failure must not end the run for everybody else.
      console.error("[email] reminder failed for one learner", error);
      outcome = "rejected";
    }

    switch (outcome) {
      case "sent":
        summary.sent += 1;
        break;
      case "already-sent":
        summary.alreadySent += 1;
        break;
      case "opted-out":
      case "no-address":
      case "no-due-reviews":
        summary.optedOut += 1;
        break;
      case "rejected":
        summary.rejected += 1;
        break;
      case "skipped":
        summary.skipped += 1;
        break;
    }
  }

  return summary;
}

/** Recent attempts, for the admin view. Aggregated, never a payload. */
export async function listEmailDeliveries(limit = 100) {
  return prisma.emailDelivery.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
    select: {
      id: true,
      kind: true,
      periodKey: true,
      status: true,
      provider: true,
      reason: true,
      createdAt: true,
    },
  });
}
