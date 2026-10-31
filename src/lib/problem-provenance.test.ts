import { describe, expect, it } from "vitest";

import { provenanceSchema } from "./problem-provenance";

const valid = {
  sourceType: "LICENSED",
  sourceName: "Open Problem Set",
  sourceUrl: "https://example.org/problems",
  license: "CC BY 4.0",
  attribution: "Adapted from Open Problem Set by its contributors.",
};

describe("provenanceSchema", () => {
  it("accepts a named source with a licence and attribution", () => {
    expect(provenanceSchema.safeParse(valid).success).toBe(true);
  });

  it.each(["license", "attribution", "sourceUrl", "sourceName"])(
    "requires %s",
    (field) => {
      expect(provenanceSchema.safeParse({ ...valid, [field]: undefined }).success).toBe(
        false
      );
    }
  );

  it.each([
    { sourceName: "LeetCode" },
    { sourceUrl: "https://leetcode.com/problems/two-sum" },
    { sourceUrl: "https://www.codechef.com/problems/X" },
    { sourceName: "AllCSNotes" },
  ])("refuses a proprietary source: %o", (override) => {
    expect(provenanceSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
