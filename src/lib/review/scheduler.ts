import { addDays, daysBetweenUtc, utcDayStart } from "@/lib/dates";
import type { ReviewGrade, ReviewStage } from "@/generated/prisma/enums";

/**
 * The spaced-repetition scheduler.
 *
 * A pure function of (current state, grade, timestamps) -> next state. No
 * database, no clock of its own, no randomness. That is deliberate: the
 * scheduler decides when a learner sees something again, which is the single
 * thing in this product most worth being able to test exhaustively.
 *
 * ---------------------------------------------------------------------------
 * THE MODEL
 *
 * Four stages, and an item only moves forward by recalling successfully:
 *
 *     NEW ──GOOD/EASY──> REVIEW ──interval >= 21d──> MATURE
 *      │                    │                          │
 *      └──AGAIN/HARD──> LEARNING <────────AGAIN────────┘
 *
 * Intervals are whole days. Sub-day learning steps would mean changing the
 * unit on `intervalDays`, and a second interval column — or a dead one — is
 * worse than the alternative: re-drilling a forgotten card *now* is handled
 * by the session requeueing it, which is what `requeueInSession` is for. The
 * persisted schedule therefore stays day-granular and consistent with the
 * UTC-day convention StudyDay and streaks already use.
 *
 * ---------------------------------------------------------------------------
 * GRADES
 *
 *   AGAIN  Could not recall. Ease -20, lapse recorded, repetitions reset,
 *          back to LEARNING at 1 day, and requeued inside this session.
 *   HARD   Recalled, but with difficulty. Ease -15. In LEARNING it does not
 *          graduate and stays at 1 day; in REVIEW the interval grows by only
 *          1.2x, so it barely moves.
 *   GOOD   Recalled as expected. Ease unchanged. Graduates LEARNING at 2
 *          days; in REVIEW the interval multiplies by the ease factor.
 *   EASY   Recalled effortlessly. Ease +15. Graduates LEARNING straight to 4
 *          days; in REVIEW it takes the ease multiplier plus a 1.3x bonus.
 *
 * From any single state the next intervals are ordered
 * AGAIN <= HARD < GOOD < EASY, which is the property the tests pin down.
 * AGAIN and HARD can both land on the one-day floor; what separates them is
 * that AGAIN also resets `repetitions`, records a lapse, and comes back
 * before the session ends.
 * ---------------------------------------------------------------------------
 */

/** Ease is stored x100 so it is an integer and cannot drift. */
export const EASE_DEFAULT = 250;
export const EASE_MIN = 130;
export const EASE_MAX = 350;

const EASE_DELTA: Record<ReviewGrade, number> = {
  AGAIN: -20,
  HARD: -15,
  GOOD: 0,
  EASY: +15,
};

/** Interval a LEARNING item graduates to on its first successful recall. */
export const GRADUATING_INTERVAL_DAYS = 2;
/** Graduating interval when the first recall was effortless. */
export const EASY_GRADUATING_INTERVAL_DAYS = 4;

/** At or above this, an item is considered MATURE. */
export const MATURE_INTERVAL_DAYS = 21;

/** Growth applied to a HARD review. Barely more than standing still. */
const HARD_MULTIPLIER = 1.2;
/** Extra multiplier on top of ease for an EASY review. */
const EASY_BONUS = 1.3;

/**
 * Bounds. The floor guarantees a schedule can never produce a zero or
 * negative interval; the ceiling stops a long chain of EASY ratings pushing
 * an item decades out, where it may as well not exist.
 */
export const MIN_INTERVAL_DAYS = 1;
export const MAX_INTERVAL_DAYS = 365;

export type SchedulerState = {
  stage: ReviewStage;
  intervalDays: number;
  /** Consecutive successful recalls. Reset to 0 by AGAIN. */
  repetitions: number;
  /** Ease factor x100. */
  ease: number;
  /** Total AGAIN ratings, ever. */
  lapses: number;
};

export type SchedulerInput = SchedulerState & {
  /** When the item was scheduled to be seen. */
  dueAt: Date;
  /** When the learner actually graded it. */
  reviewedAt: Date;
  grade: ReviewGrade;
};

export type SchedulerResult = SchedulerState & {
  dueAt: Date;
  /**
   * True when the item should be shown again before the session ends.
   * Only AGAIN sets this: the persisted interval has a one-day floor, so
   * immediate re-drilling is the session's job, not the schedule's.
   */
  requeueInSession: boolean;
};

/** The state a freshly created item starts in. */
export function initialState(ease = EASE_DEFAULT): SchedulerState {
  return {
    stage: "NEW",
    intervalDays: MIN_INTERVAL_DAYS,
    repetitions: 0,
    ease: clampEase(ease),
    lapses: 0,
  };
}

function clampEase(ease: number): number {
  if (!Number.isFinite(ease)) return EASE_DEFAULT;
  return Math.min(EASE_MAX, Math.max(EASE_MIN, Math.round(ease)));
}

function clampInterval(days: number): number {
  if (!Number.isFinite(days)) return MIN_INTERVAL_DAYS;
  return Math.min(MAX_INTERVAL_DAYS, Math.max(MIN_INTERVAL_DAYS, Math.round(days)));
}

/** NEW and LEARNING items have not proved themselves yet. */
function hasGraduated(stage: ReviewStage): boolean {
  return stage === "REVIEW" || stage === "MATURE";
}

/**
 * Stage is a function of the resulting interval and repetition count, so it
 * can never disagree with them.
 */
function stageFor(intervalDays: number, repetitions: number): ReviewStage {
  if (repetitions === 0) return "LEARNING";
  return intervalDays >= MATURE_INTERVAL_DAYS ? "MATURE" : "REVIEW";
}

/**
 * Computes the next state.
 *
 * `reviewedAt` is passed in rather than read from the clock so that every
 * transition — including overdue and same-day cases — is reproducible.
 */
export function schedule(input: SchedulerInput): SchedulerResult {
  const { grade, stage, reviewedAt } = input;

  const graduated = hasGraduated(stage);
  const ease = clampEase(input.ease + EASE_DELTA[grade]);

  // How late the review is, in whole UTC days. Reviewing early contributes
  // nothing rather than a penalty: being keen should not shorten intervals.
  const overdueDays = Math.max(0, daysBetweenUtc(input.dueAt, reviewedAt));

  let intervalDays: number;
  let repetitions: number;
  let lapses = input.lapses;
  let requeueInSession = false;

  switch (grade) {
    case "AGAIN": {
      // A failure sends the item all the way back. The lapse is permanent
      // history: it is what tells the queue this one keeps catching them out.
      intervalDays = MIN_INTERVAL_DAYS;
      repetitions = 0;
      lapses += 1;
      requeueInSession = true;
      break;
    }

    case "HARD": {
      if (graduated) {
        // Grows, but barely. No overdue bonus: a struggle after a long gap
        // is not evidence the interval should stretch further.
        intervalDays = clampInterval(input.intervalDays * HARD_MULTIPLIER);
        repetitions = input.repetitions + 1;
      } else {
        // Does not graduate. Stays at the floor and stays in LEARNING, so a
        // run of HARD ratings can never mature an item.
        intervalDays = MIN_INTERVAL_DAYS;
        repetitions = 0;
      }
      break;
    }

    case "GOOD": {
      if (graduated) {
        // Recalling something overdue is stronger evidence than recalling it
        // on time, so half the overdue days are folded into the base.
        const base = input.intervalDays + Math.floor(overdueDays / 2);
        intervalDays = clampInterval((base * ease) / 100);
        repetitions = input.repetitions + 1;
      } else {
        intervalDays = GRADUATING_INTERVAL_DAYS;
        repetitions = 1;
      }
      break;
    }

    case "EASY": {
      if (graduated) {
        // The full overdue gap counts here: effortless recall after a long
        // delay is the clearest signal the interval was too short.
        const base = input.intervalDays + overdueDays;
        intervalDays = clampInterval((base * ease * EASY_BONUS) / 100);
        repetitions = input.repetitions + 1;
      } else {
        intervalDays = EASY_GRADUATING_INTERVAL_DAYS;
        repetitions = 1;
      }
      break;
    }
  }

  return {
    stage: stageFor(intervalDays, repetitions),
    intervalDays,
    repetitions,
    ease,
    lapses,
    // Anchored to the start of the review's UTC day, so "due in 3 days"
    // means the whole of that day rather than a moment within it. Matches
    // how StudyDay and streaks already define a day.
    dueAt: addDays(utcDayStart(reviewedAt), intervalDays),
    requeueInSession,
  };
}

/**
 * When a newly created item should first be seen.
 *
 * Tomorrow, not today: the learner has just worked through the material, so
 * recalling it minutes later measures short-term memory and nothing else.
 */
export function firstDueAt(createdAt: Date): Date {
  return addDays(utcDayStart(createdAt), 1);
}

/** Whether an item is due as of `now`. */
export function isDue(dueAt: Date, now: Date): boolean {
  return dueAt.getTime() <= now.getTime();
}

/** A human-readable description of when an item returns. Used in the UI. */
export function describeInterval(days: number): string {
  if (days <= 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? "in a week" : `in ${weeks} weeks`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "in a month" : `in ${months} months`;
  }
  return "in a year";
}
