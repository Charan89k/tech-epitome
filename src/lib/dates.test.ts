import { describe, expect, it } from "vitest";

import { daysBetweenUtc, utcDayStart } from "./dates";

/**
 * Streak arithmetic is measured in UTC calendar days, not 24-hour spans.
 * Getting this wrong either breaks a user's streak an hour early or lets it
 * survive a missed day, and both are noticed immediately.
 */
describe("daysBetweenUtc", () => {
  it("is zero for two instants on the same UTC day", () => {
    const morning = new Date("2026-03-14T00:05:00Z");
    const night = new Date("2026-03-14T23:55:00Z");
    expect(daysBetweenUtc(morning, night)).toBe(0);
  });

  it("is one across midnight even when only minutes apart", () => {
    const before = new Date("2026-03-14T23:59:00Z");
    const after = new Date("2026-03-15T00:01:00Z");
    expect(daysBetweenUtc(before, after)).toBe(1);
  });

  it("counts whole days across a month boundary", () => {
    expect(
      daysBetweenUtc(new Date("2026-01-30T12:00:00Z"), new Date("2026-02-02T01:00:00Z"))
    ).toBe(3);
  });

  it("counts correctly across a leap day", () => {
    expect(
      daysBetweenUtc(new Date("2028-02-28T12:00:00Z"), new Date("2028-03-01T12:00:00Z"))
    ).toBe(2);
  });

  it("is negative when the second instant is earlier", () => {
    expect(
      daysBetweenUtc(new Date("2026-03-15T00:00:00Z"), new Date("2026-03-14T00:00:00Z"))
    ).toBe(-1);
  });
});

describe("utcDayStart", () => {
  it("truncates to midnight UTC", () => {
    const result = utcDayStart(new Date("2026-03-14T17:42:11.123Z"));
    expect(result.toISOString()).toBe("2026-03-14T00:00:00.000Z");
  });

  it("is idempotent", () => {
    const once = utcDayStart(new Date("2026-03-14T17:42:11Z"));
    expect(utcDayStart(once).toISOString()).toBe(once.toISOString());
  });
});
