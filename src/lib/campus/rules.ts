import { answersMatch } from "@/services/quiz-scoring";

/**
 * The assessment rules as pure functions, so the timing and scoring
 * decisions are tested without a database. The services call these with
 * the server clock; nothing here ever takes a time from the client.
 *
 * Lifecycle: DRAFT -> PUBLISHED -> CLOSED -> ARCHIVED.
 *   A PUBLISHED assessment is "scheduled" before opensAt, "open" until
 *   closesAt, then "late" until lateUntil (if set), then effectively closed
 *   even before staff press Close. Attempts start only while open or late.
 */

export type AssessmentTiming = {
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  opensAt: Date | null;
  closesAt: Date;
  lateUntil: Date | null;
  durationMinutes: number | null;
};

export type Phase = "draft" | "scheduled" | "open" | "late" | "closed" | "archived";

export const PHASE_LABEL: Record<Phase, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  open: "Open",
  late: "Late submissions",
  closed: "Closed",
  archived: "Archived",
};

export function hardClose(a: Pick<AssessmentTiming, "closesAt" | "lateUntil">): Date {
  return a.lateUntil && a.lateUntil > a.closesAt ? a.lateUntil : a.closesAt;
}

export function phaseOf(a: AssessmentTiming, now: Date): Phase {
  if (a.status === "DRAFT") return "draft";
  if (a.status === "ARCHIVED") return "archived";
  if (a.status === "CLOSED") return "closed";
  if (a.opensAt && now < a.opensAt) return "scheduled";
  if (now < a.closesAt) return "open";
  if (now < hardClose(a)) return "late";
  return "closed";
}

/** When an attempt started at `startedAt` stops accepting answers. */
export function attemptDeadline(a: AssessmentTiming, startedAt: Date): Date {
  const close = hardClose(a);
  if (!a.durationMinutes) return close;
  const byDuration = new Date(startedAt.getTime() + a.durationMinutes * 60_000);
  return byDuration < close ? byDuration : close;
}

/** A submission after the deadline but inside the grace window. */
export function isLate(a: Pick<AssessmentTiming, "closesAt">, at: Date): boolean {
  return at > a.closesAt;
}

export function applyLatePenalty(raw: number, late: boolean, percent: number): number {
  if (!late || percent <= 0) return raw;
  return Math.max(0, raw * (1 - Math.min(percent, 100) / 100));
}

/** The attempt whose score counts, from finalised attempts in start order. */
export function countedAttempt<T extends { score: number | null; number: number }>(
  attempts: T[],
  policy: "BEST" | "LATEST"
): T | null {
  const graded = attempts.filter((a) => a.score !== null);
  if (graded.length === 0) return null;
  if (policy === "LATEST")
    return graded.reduce((a, b) => (b.number > a.number ? b : a));
  return graded.reduce((a, b) => ((b.score ?? 0) > (a.score ?? 0) ? b : a));
}

/** All-or-nothing, like the platform quizzes: a set compared as a set. */
export function scoreChoice(
  answer: string | string[],
  given: unknown,
  points: number
): number {
  const value =
    typeof given === "string" ||
    (Array.isArray(given) && given.every((g) => typeof g === "string"))
      ? (given as string | string[])
      : null;
  return answersMatch(answer, value) ? points : 0;
}

/** Points for a coding answer from its test results, proportional. */
export function scoreCoding(passed: number, total: number, points: number): number {
  if (total <= 0) return 0;
  return Math.round((passed / total) * points * 100) / 100;
}
