import { describe, expect, it } from "vitest";

import { median, rate, show } from "./metrics";

describe("analytics metrics", () => {
  it("returns null, not zero, when there is no denominator", () => {
    expect(rate(0, 0)).toBeNull();
    expect(rate(0, 5)).toBe(0);
    expect(rate(1, 3)).toBe(33.3);
  });

  it("takes the median of odd and even sets, and null for none", () => {
    expect(median([])).toBeNull();
    expect(median([90, 10, 50])).toBe(50);
    expect(median([10, 20, 30, 1000])).toBe(25);
  });

  it("renders missing data as a dash", () => {
    expect(show(null, "%")).toBe("—");
    expect(show(0, "%")).toBe("0%");
  });
});
