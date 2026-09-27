import "server-only";

import { prisma } from "@/lib/db";

/**
 * Event tracking.
 *
 * Events are written to the application's own database rather than shipped
 * to a third party, because they are also product data: the activity feed
 * and the recommender read the same rows. There is no external analytics
 * dependency to add later without a decision being made about it.
 *
 * Only behaviour is recorded. No IP addresses, no user agents, and no
 * personal data beyond the user id that owns the row — which cascades away
 * when the account is deleted.
 */

export const ANALYTICS_EVENTS = [
  "lesson_started",
  "lesson_completed",
  "problem_started",
  "problem_submitted",
  "problem_solved",
  "hint_opened",
  "solution_opened",
  "quiz_started",
  "quiz_completed",
  "visualization_started",
  "pattern_viewed",
  "review_graded",
  "design_submitted",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/**
 * Records an event. Never throws: analytics failing must not break the
 * action that triggered it.
 */
export async function recordEvent(
  userId: string,
  name: AnalyticsEvent,
  props: Record<string, unknown> = {}
): Promise<void> {
  try {
    await prisma.activityEvent.create({
      data: { userId, name, props: props as object },
    });
  } catch (error) {
    console.error(`[analytics] failed to record ${name}`, error);
  }
}
