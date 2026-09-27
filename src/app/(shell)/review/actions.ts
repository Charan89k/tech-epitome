"use server";

import { z } from "zod";

import { ReviewGrade } from "@/generated/prisma/enums";
import { recordEvent } from "@/lib/analytics";
import { requireUserOrThrow } from "@/lib/auth/session";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { describeInterval } from "@/lib/review/scheduler";
import { gradeReviewItem, type GradeOutcome } from "@/services/review";
import { touchStudyDay } from "@/app/(shell)/learn/actions";

/**
 * Review mutations.
 *
 * One action, because grading is the only thing a review session does.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const gradeSchema = z.object({
  reviewItemId: z.string().min(1).max(64),
  grade: z.nativeEnum(ReviewGrade),
});

export type GradeResponse = GradeOutcome & {
  /** Plain-language description of when the card returns. */
  nextIn: string;
};

export async function gradeReviewAction(
  raw: unknown
): Promise<ActionResult<GradeResponse>> {
  const user = await requireUserOrThrow();

  const parsed = gradeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That grade was not in the expected shape." };
  }

  // A review is one click, so a burst means a stuck key or a double
  // submission rather than a person. The limit is generous enough that a
  // fast session never notices it.
  const limited = await rateLimit(`review:${user.id}`, RATE_LIMITS.REVIEW_GRADE);
  if (!limited.success) {
    return { ok: false, error: "Slow down a moment — too many reviews at once." };
  }

  // `gradeReviewItem` scopes its write by userId, so an id belonging to
  // someone else matches no rows and comes back null. There is no read-then-
  // check window to race.
  const outcome = await gradeReviewItem(
    user.id,
    parsed.data.reviewItemId,
    parsed.data.grade
  );

  if (!outcome) {
    return { ok: false, error: "That review item is no longer available." };
  }

  await recordEvent(user.id, "review_graded", {
    grade: parsed.data.grade,
    intervalDays: outcome.intervalDays,
    stage: outcome.stage,
  });

  // A completed review is study, so it counts toward the streak and the
  // day's record like any other activity.
  await touchStudyDay(user.id, { seconds: 0, chapters: 0, xp: 5 });

  // Deliberately no revalidatePath here.
  //
  // revalidatePath invalidates the client Router Cache wholesale, which
  // includes the route the action was called from. The response then
  // carries a fresh RSC payload for /review, React swaps the tree, and the
  // running session is replaced by a server render of an empty queue —
  // taking the position, the completion screen, and any card requeued
  // after an AGAIN with it.
  //
  // Nothing is lost by omitting it: /dashboard is a dynamic route, so a
  // navigation there refetches rather than serving a cached payload, and
  // the due count is computed per request. The session refreshes the
  // router itself when the learner asks for more.

  return {
    ok: true,
    data: { ...outcome, nextIn: describeInterval(outcome.intervalDays) },
  };
}
