import { describe, expect, it } from "vitest";

import type { ReviewGrade } from "@/generated/prisma/enums";
import { addDays, utcDayStart } from "@/lib/dates";
import {
  EASE_DEFAULT,
  EASE_MAX,
  EASE_MIN,
  EASY_GRADUATING_INTERVAL_DAYS,
  GRADUATING_INTERVAL_DAYS,
  MATURE_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
  MIN_INTERVAL_DAYS,
  describeInterval,
  firstDueAt,
  initialState,
  isDue,
  schedule,
  type SchedulerResult,
  type SchedulerState,
} from "./scheduler";

/**
 * The scheduler decides when a learner sees something again, so it is worth
 * pinning down exhaustively. Every test fixes both timestamps, so nothing
 * here depends on the wall clock.
 */

const DAY = 86_400_000;
const NOON = new Date("2026-03-14T12:00:00.000Z");

/** Grades an item that is due exactly now. */
function grade(
  state: SchedulerState,
  g: ReviewGrade,
  reviewedAt: Date = NOON,
  dueAt: Date = reviewedAt
): SchedulerResult {
  return schedule({ ...state, grade: g, dueAt, reviewedAt });
}

/** A graduated item sitting in REVIEW. */
function reviewState(overrides: Partial<SchedulerState> = {}): SchedulerState {
  return {
    stage: "REVIEW",
    intervalDays: 10,
    repetitions: 3,
    ease: EASE_DEFAULT,
    lapses: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// A new item's first review
// ---------------------------------------------------------------------------

describe("a new item", () => {
  it("starts in NEW with the default ease and no history", () => {
    const state = initialState();
    expect(state.stage).toBe("NEW");
    expect(state.repetitions).toBe(0);
    expect(state.lapses).toBe(0);
    expect(state.ease).toBe(EASE_DEFAULT);
  });

  it("is first shown the day after it is created, not the same day", () => {
    // Recalling something minutes after reading it measures short-term
    // memory and nothing else.
    const due = firstDueAt(new Date("2026-03-14T23:30:00.000Z"));
    expect(due.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("graduates to REVIEW on a GOOD", () => {
    const result = grade(initialState(), "GOOD");
    expect(result.stage).toBe("REVIEW");
    expect(result.intervalDays).toBe(GRADUATING_INTERVAL_DAYS);
    expect(result.repetitions).toBe(1);
    expect(result.requeueInSession).toBe(false);
  });

  it("graduates further on an EASY", () => {
    const result = grade(initialState(), "EASY");
    expect(result.stage).toBe("REVIEW");
    expect(result.intervalDays).toBe(EASY_GRADUATING_INTERVAL_DAYS);
    expect(result.ease).toBe(EASE_DEFAULT + 15);
  });

  it("does not graduate on a HARD", () => {
    const result = grade(initialState(), "HARD");
    expect(result.stage).toBe("LEARNING");
    expect(result.intervalDays).toBe(MIN_INTERVAL_DAYS);
    expect(result.repetitions).toBe(0);
  });

  it("does not graduate on an AGAIN, and records a lapse", () => {
    const result = grade(initialState(), "AGAIN");
    expect(result.stage).toBe("LEARNING");
    expect(result.lapses).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.requeueInSession).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Grade ordering — the property everything else rests on
// ---------------------------------------------------------------------------

describe("grade ordering", () => {
  it("orders next intervals AGAIN <= HARD < GOOD < EASY from a REVIEW item", () => {
    const state = reviewState();
    const again = grade(state, "AGAIN").intervalDays;
    const hard = grade(state, "HARD").intervalDays;
    const good = grade(state, "GOOD").intervalDays;
    const easy = grade(state, "EASY").intervalDays;

    expect(again).toBeLessThanOrEqual(hard);
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it("orders them the same way from a NEW item", () => {
    const state = initialState();
    const again = grade(state, "AGAIN").intervalDays;
    const hard = grade(state, "HARD").intervalDays;
    const good = grade(state, "GOOD").intervalDays;
    const easy = grade(state, "EASY").intervalDays;

    expect(again).toBeLessThanOrEqual(hard);
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it("distinguishes AGAIN from HARD even when both land on the one-day floor", () => {
    // Both floor at a day, so what separates them is everything else: a
    // lapse, a reset repetition count, and coming back this session.
    const state = initialState();
    const again = grade(state, "AGAIN");
    const hard = grade(state, "HARD");

    expect(again.intervalDays).toBe(hard.intervalDays);
    expect(again.lapses).toBeGreaterThan(hard.lapses);
    expect(again.requeueInSession).toBe(true);
    expect(hard.requeueInSession).toBe(false);
    expect(again.ease).toBeLessThan(hard.ease);
  });

  it("moves ease in the expected direction for each grade", () => {
    const state = reviewState();
    expect(grade(state, "AGAIN").ease).toBe(EASE_DEFAULT - 20);
    expect(grade(state, "HARD").ease).toBe(EASE_DEFAULT - 15);
    expect(grade(state, "GOOD").ease).toBe(EASE_DEFAULT);
    expect(grade(state, "EASY").ease).toBe(EASE_DEFAULT + 15);
  });
});

// ---------------------------------------------------------------------------
// Repeated success
// ---------------------------------------------------------------------------

describe("repeated success", () => {
  it("grows the interval monotonically across a run of GOODs", () => {
    let state: SchedulerState = initialState();
    let reviewedAt = NOON;
    const intervals: number[] = [];

    for (let i = 0; i < 8; i += 1) {
      const result = grade(state, "GOOD", reviewedAt);
      intervals.push(result.intervalDays);
      state = result;
      reviewedAt = result.dueAt; // review exactly on time
    }

    // Strictly increasing until the cap engages, and never decreasing
    // after. Asserting strict growth all the way would contradict the cap,
    // which exists precisely to stop the sequence running away.
    for (let i = 1; i < intervals.length; i += 1) {
      const previous = intervals[i - 1]!;
      const current = intervals[i]!;
      if (previous < MAX_INTERVAL_DAYS) {
        expect(current, `interval ${i} should exceed ${previous}`).toBeGreaterThan(
          previous
        );
      } else {
        expect(current).toBe(MAX_INTERVAL_DAYS);
      }
    }

    // The concrete ladder, so a change to the constants is a visible diff
    // rather than a silent behaviour shift.
    expect(intervals).toEqual([2, 5, 13, 33, 83, 208, 365, 365]);
  });

  it("reaches MATURE once the interval passes the threshold", () => {
    let state: SchedulerState = initialState();
    let reviewedAt = NOON;

    for (let i = 0; i < 6; i += 1) {
      const result = grade(state, "GOOD", reviewedAt);
      state = result;
      reviewedAt = result.dueAt;
    }

    expect(state.intervalDays).toBeGreaterThanOrEqual(MATURE_INTERVAL_DAYS);
    expect(state.stage).toBe("MATURE");
  });

  it("increments repetitions once per successful review", () => {
    const first = grade(initialState(), "GOOD");
    const second = grade(first, "GOOD");
    const third = grade(second, "GOOD");
    expect([first.repetitions, second.repetitions, third.repetitions]).toEqual([
      1, 2, 3,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Repeated failure
// ---------------------------------------------------------------------------

describe("repeated failure", () => {
  it("keeps the item in LEARNING and never lets it mature", () => {
    let state: SchedulerState = initialState();
    let reviewedAt = NOON;

    for (let i = 0; i < 6; i += 1) {
      const result = grade(state, "AGAIN", reviewedAt);
      expect(result.stage).toBe("LEARNING");
      expect(result.intervalDays).toBe(MIN_INTERVAL_DAYS);
      state = result;
      reviewedAt = new Date(reviewedAt.getTime() + DAY);
    }

    expect(state.lapses).toBe(6);
    expect(state.stage).toBe("LEARNING");
  });

  it("drops a mature item all the way back to LEARNING on one AGAIN", () => {
    const mature: SchedulerState = {
      stage: "MATURE",
      intervalDays: 120,
      repetitions: 9,
      ease: 280,
      lapses: 0,
    };

    const result = grade(mature, "AGAIN");
    expect(result.stage).toBe("LEARNING");
    expect(result.intervalDays).toBe(MIN_INTERVAL_DAYS);
    expect(result.repetitions).toBe(0);
    expect(result.lapses).toBe(1);
  });

  it("never drives ease below the floor, however many failures", () => {
    let state: SchedulerState = reviewState();
    for (let i = 0; i < 40; i += 1) {
      state = grade(state, "AGAIN");
    }
    expect(state.ease).toBe(EASE_MIN);
  });

  it("keeps a run of HARD ratings in LEARNING", () => {
    // Struggling repeatedly must not accumulate into maturity.
    let state: SchedulerState = initialState();
    for (let i = 0; i < 5; i += 1) {
      state = grade(state, "HARD");
      expect(state.stage).toBe("LEARNING");
    }
    expect(state.intervalDays).toBe(MIN_INTERVAL_DAYS);
  });
});

// ---------------------------------------------------------------------------
// Overdue and early reviews
// ---------------------------------------------------------------------------

describe("overdue reviews", () => {
  it("produces a valid future date when weeks overdue", () => {
    const dueAt = new Date("2026-03-01T00:00:00.000Z");
    const reviewedAt = new Date("2026-03-25T09:00:00.000Z"); // 24 days late

    const result = grade(reviewState(), "GOOD", reviewedAt, dueAt);

    expect(result.intervalDays).toBeGreaterThanOrEqual(MIN_INTERVAL_DAYS);
    expect(result.dueAt.getTime()).toBeGreaterThan(reviewedAt.getTime());
    expect(Number.isNaN(result.dueAt.getTime())).toBe(false);
  });

  it("credits a successful overdue recall with a longer interval", () => {
    const state = reviewState({ intervalDays: 10 });
    const onTime = grade(state, "GOOD", NOON, NOON);
    const late = grade(
      state,
      "GOOD",
      new Date(NOON.getTime() + 20 * DAY),
      NOON
    );
    expect(late.intervalDays).toBeGreaterThan(onTime.intervalDays);
  });

  it("gives no overdue credit for a HARD recall", () => {
    // Struggling after a long gap is not evidence the interval was too short.
    const state = reviewState({ intervalDays: 10 });
    const onTime = grade(state, "HARD", NOON, NOON);
    const late = grade(state, "HARD", new Date(NOON.getTime() + 20 * DAY), NOON);
    expect(late.intervalDays).toBe(onTime.intervalDays);
  });

  it("does not penalise reviewing early", () => {
    const state = reviewState({ intervalDays: 10 });
    const early = grade(
      state,
      "GOOD",
      NOON,
      new Date(NOON.getTime() + 5 * DAY) // due in five days, reviewed now
    );
    const onTime = grade(state, "GOOD", NOON, NOON);
    expect(early.intervalDays).toBe(onTime.intervalDays);
  });
});

// ---------------------------------------------------------------------------
// Bounds
// ---------------------------------------------------------------------------

describe("interval bounds", () => {
  it("never returns a zero or negative interval, for any grade or state", () => {
    const states: SchedulerState[] = [
      initialState(),
      { stage: "LEARNING", intervalDays: 1, repetitions: 0, ease: EASE_MIN, lapses: 9 },
      reviewState(),
      { stage: "MATURE", intervalDays: 300, repetitions: 12, ease: EASE_MAX, lapses: 0 },
    ];
    const grades: ReviewGrade[] = ["AGAIN", "HARD", "GOOD", "EASY"];

    for (const state of states) {
      for (const g of grades) {
        const result = grade(state, g);
        expect(result.intervalDays, `${state.stage}/${g}`).toBeGreaterThanOrEqual(
          MIN_INTERVAL_DAYS
        );
        expect(result.dueAt.getTime()).toBeGreaterThan(
          utcDayStart(NOON).getTime()
        );
      }
    }
  });

  it("caps runaway growth", () => {
    // A long run of EASY on a high-ease item must not schedule the item
    // past the point of being useful.
    let state: SchedulerState = reviewState({ intervalDays: 200, ease: EASE_MAX });
    for (let i = 0; i < 10; i += 1) {
      state = grade(state, "EASY");
    }
    expect(state.intervalDays).toBe(MAX_INTERVAL_DAYS);
  });

  it("never drives ease above the ceiling", () => {
    let state: SchedulerState = reviewState();
    for (let i = 0; i < 40; i += 1) {
      state = grade(state, "EASY");
    }
    expect(state.ease).toBe(EASE_MAX);
  });
});

// ---------------------------------------------------------------------------
// Dates and timezones
// ---------------------------------------------------------------------------

describe("due dates", () => {
  it("anchors to the start of the review's UTC day", () => {
    const result = grade(initialState(), "GOOD", new Date("2026-03-14T17:42:11.123Z"));
    // Graduating interval is 2 days from the 14th.
    expect(result.dueAt.toISOString()).toBe("2026-03-16T00:00:00.000Z");
  });

  it("gives the same due date regardless of the time of day reviewed", () => {
    // Day-granular scheduling: two learners grading the same item on the
    // same UTC day get the same next date, morning or night.
    const morning = grade(initialState(), "GOOD", new Date("2026-03-14T00:01:00.000Z"));
    const night = grade(initialState(), "GOOD", new Date("2026-03-14T23:59:00.000Z"));
    expect(morning.dueAt.toISOString()).toBe(night.dueAt.toISOString());
  });

  it("crosses month and year boundaries correctly", () => {
    const result = grade(
      reviewState({ intervalDays: 10 }),
      "HARD",
      new Date("2026-12-28T10:00:00.000Z")
    );
    // 10 * 1.2 = 12 days from 28 December.
    expect(result.intervalDays).toBe(12);
    expect(result.dueAt.toISOString()).toBe("2027-01-09T00:00:00.000Z");
  });

  it("handles a leap day", () => {
    const result = grade(
      reviewState({ intervalDays: 1, repetitions: 1 }),
      "HARD",
      new Date("2028-02-28T10:00:00.000Z")
    );
    expect(result.dueAt.toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });

  it("always schedules strictly after the current UTC day", () => {
    // The floor of one day means a same-day regrade can never produce a
    // date in the past or today.
    const grades: ReviewGrade[] = ["AGAIN", "HARD", "GOOD", "EASY"];
    const reviewedAt = new Date("2026-03-14T23:59:59.000Z");

    for (const g of grades) {
      const result = grade(initialState(), g, reviewedAt);
      expect(result.dueAt.getTime(), g).toBeGreaterThan(
        utcDayStart(reviewedAt).getTime()
      );
    }
  });
});

describe("same-day reviews", () => {
  it("stays valid when an item is graded twice in one day", () => {
    // Only reachable through an in-session requeue after AGAIN.
    const first = grade(initialState(), "AGAIN", NOON);
    expect(first.requeueInSession).toBe(true);

    const second = grade(first, "GOOD", new Date(NOON.getTime() + 60_000));
    expect(second.intervalDays).toBeGreaterThanOrEqual(MIN_INTERVAL_DAYS);
    expect(second.dueAt.getTime()).toBeGreaterThan(NOON.getTime());
    expect(second.stage).toBe("REVIEW");
  });
});

describe("isDue", () => {
  it("is true at the exact due instant", () => {
    const at = new Date("2026-03-15T00:00:00.000Z");
    expect(isDue(at, at)).toBe(true);
  });

  it("is false before and true after", () => {
    const due = new Date("2026-03-15T00:00:00.000Z");
    expect(isDue(due, new Date(due.getTime() - 1))).toBe(false);
    expect(isDue(due, new Date(due.getTime() + 1))).toBe(true);
  });
});

describe("describeInterval", () => {
  it("reads naturally at each scale", () => {
    expect(describeInterval(1)).toBe("tomorrow");
    expect(describeInterval(3)).toBe("in 3 days");
    expect(describeInterval(7)).toBe("in a week");
    expect(describeInterval(21)).toBe("in 3 weeks");
    expect(describeInterval(30)).toBe("in a month");
    expect(describeInterval(90)).toBe("in 3 months");
    expect(describeInterval(400)).toBe("in a year");
  });

  it("never describes a sub-day interval as anything but tomorrow", () => {
    expect(describeInterval(0)).toBe("tomorrow");
    expect(describeInterval(-5)).toBe("tomorrow");
  });
});

// ---------------------------------------------------------------------------
// A realistic sequence
// ---------------------------------------------------------------------------

describe("a realistic learning sequence", () => {
  it("recovers after a lapse without starting from nothing", () => {
    // Build the item up, fail it once, then rebuild. Ease should carry the
    // memory of the failure while repetitions restart.
    let state: SchedulerState = initialState();
    let at = NOON;

    for (let i = 0; i < 4; i += 1) {
      const result = grade(state, "GOOD", at);
      state = result;
      at = result.dueAt;
    }
    const peakInterval = state.intervalDays;
    const easeBefore = state.ease;

    state = grade(state, "AGAIN", at);
    expect(state.intervalDays).toBe(MIN_INTERVAL_DAYS);
    expect(state.ease).toBe(easeBefore - 20);
    expect(state.lapses).toBe(1);

    // Rebuilding is faster than the first climb was, because ease persists
    // — but it does not jump straight back to where it was.
    state = grade(state, "GOOD", addDays(at, 1));
    expect(state.intervalDays).toBe(GRADUATING_INTERVAL_DAYS);
    expect(state.intervalDays).toBeLessThan(peakInterval);
  });
});
