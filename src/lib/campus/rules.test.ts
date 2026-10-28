import { describe, expect, it } from "vitest";

import {
  applyLatePenalty,
  attemptDeadline,
  countedAttempt,
  isLate,
  phaseOf,
  scoreChoice,
  scoreCoding,
  type AssessmentTiming,
} from "./rules";

const t = (iso: string) => new Date(`2026-11-01T${iso}:00Z`);
const base: AssessmentTiming = {
  status: "PUBLISHED",
  opensAt: t("09:00"),
  closesAt: t("10:00"),
  lateUntil: null,
  durationMinutes: null,
};

describe("assessment phase", () => {
  it("walks scheduled -> open -> closed on the server clock", () => {
    expect(phaseOf(base, t("08:59"))).toBe("scheduled");
    expect(phaseOf(base, t("09:00"))).toBe("open");
    expect(phaseOf(base, t("10:00"))).toBe("closed");
  });

  it("has a late window only when lateUntil is set", () => {
    const late = { ...base, lateUntil: t("10:30") };
    expect(phaseOf(late, t("10:15"))).toBe("late");
    expect(phaseOf(late, t("10:30"))).toBe("closed");
  });

  it("lets staff status override the clock", () => {
    expect(phaseOf({ ...base, status: "DRAFT" }, t("09:30"))).toBe("draft");
    expect(phaseOf({ ...base, status: "CLOSED" }, t("09:30"))).toBe("closed");
    expect(phaseOf({ ...base, status: "ARCHIVED" }, t("09:30"))).toBe("archived");
  });
});

describe("attempt deadline", () => {
  it("is the time limit when it ends first, else the hard close", () => {
    const timed = { ...base, durationMinutes: 30 };
    expect(attemptDeadline(timed, t("09:10"))).toEqual(t("09:40"));
    expect(attemptDeadline(timed, t("09:45"))).toEqual(t("10:00"));
    expect(attemptDeadline({ ...timed, lateUntil: t("10:20") }, t("09:45"))).toEqual(
      t("10:15")
    );
    expect(attemptDeadline(base, t("09:10"))).toEqual(t("10:00"));
  });

  it("ignores a lateUntil earlier than closesAt", () => {
    expect(attemptDeadline({ ...base, lateUntil: t("09:30") }, t("09:10"))).toEqual(
      t("10:00")
    );
  });
});

describe("scoring", () => {
  it("marks late only after closesAt and applies the penalty then", () => {
    expect(isLate(base, t("10:00"))).toBe(false);
    expect(isLate(base, t("10:01"))).toBe(true);
    expect(applyLatePenalty(10, true, 20)).toBe(8);
    expect(applyLatePenalty(10, false, 20)).toBe(10);
    expect(applyLatePenalty(10, true, 150)).toBe(0);
  });

  it("scores choice answers all-or-nothing and rejects wrong shapes", () => {
    expect(scoreChoice("b", "b", 2)).toBe(2);
    expect(scoreChoice(["a", "c"], ["c", "a"], 3)).toBe(3);
    expect(scoreChoice(["a", "c"], ["a"], 3)).toBe(0);
    expect(scoreChoice("b", ["b"], 2)).toBe(0);
    expect(scoreChoice("b", { b: true }, 2)).toBe(0);
    expect(scoreChoice("b", null, 2)).toBe(0);
  });

  it("scores coding answers in proportion to passed tests", () => {
    expect(scoreCoding(3, 4, 10)).toBe(7.5);
    expect(scoreCoding(0, 0, 10)).toBe(0);
  });

  it("counts the best or the latest graded attempt", () => {
    const attempts = [
      { number: 1, score: 8 },
      { number: 2, score: 5 },
      { number: 3, score: null },
    ];
    expect(countedAttempt(attempts, "BEST")?.number).toBe(1);
    expect(countedAttempt(attempts, "LATEST")?.number).toBe(2);
    expect(countedAttempt([{ number: 1, score: null }], "BEST")).toBeNull();
  });
});
