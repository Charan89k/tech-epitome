/**
 * Calendar arithmetic, in UTC.
 *
 * Streaks and study days are keyed by UTC calendar day rather than by
 * 24-hour spans, so that "did they study yesterday" means the same thing
 * regardless of the server's timezone or the user's travel. These live here,
 * away from any database import, because they are pure and heavily tested.
 */

/** Whole days between two instants, measured in UTC calendar days. */
export function daysBetweenUtc(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / 86_400_000);
}

/** Midnight UTC for the given instant - the canonical key for a StudyDay row. */
export function utcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/** Adds whole days to an instant without tripping over DST. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
