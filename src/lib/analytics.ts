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
  "interview_started",
  "interview_completed",
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

/**
 * A readable label for each event.
 *
 * The profile used to print the raw `snake_case` name in a mono font,
 * which reads as a log line rather than as a history of somebody's own
 * work. Unknown names fall back to de-underscoring rather than being
 * dropped: an event recorded by newer code must still show up on a page
 * served by older code.
 */
export const EVENT_LABELS: Record<AnalyticsEvent, string> = {
  lesson_started: "Started a chapter",
  lesson_completed: "Completed a chapter",
  problem_started: "Opened a problem",
  problem_submitted: "Submitted a solution",
  problem_solved: "Solved a problem",
  hint_opened: "Opened a hint",
  solution_opened: "Read a solution",
  quiz_started: "Started a quiz",
  quiz_completed: "Completed a quiz",
  visualization_started: "Ran a visualization",
  pattern_viewed: "Read a pattern",
  review_graded: "Graded a review",
  design_submitted: "Submitted a design",
  interview_started: "Started an interview",
  interview_completed: "Finished an interview",
};

export function describeEvent(name: string): string {
  return (
    EVENT_LABELS[name as AnalyticsEvent] ??
    name.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
  );
}
