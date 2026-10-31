import { describe, expect, it } from "vitest";

import { summarizeEvaluations, type EvaluationRecord } from "./summary";

const at = (day: number) => new Date(Date.UTC(2026, 9, day));

describe("career summary", () => {
  it("is empty, not invented, with no feedback", () => {
    const s = summarizeEvaluations([]);
    expect(s.sessions).toBe(0);
    expect(s.strengths).toEqual([]);
    expect(s.improvements).toEqual([]);
  });

  it("judges each dimension by its latest band, in date order", () => {
    const records: EvaluationRecord[] = [
      { type: "DSA", at: at(3), dimensions: [{ dimension: "testing", band: "solid" }] },
      { type: "DSA", at: at(1), dimensions: [{ dimension: "testing", band: "developing" }] },
      { type: "DSA", at: at(2), dimensions: [{ dimension: "approach", band: "developing" }] },
    ];
    const s = summarizeEvaluations(records);
    expect(s.byType.DSA).toBe(3);
    expect(s.strengths.map((h) => h.dimension)).toEqual(["testing"]);
    expect(s.strengths[0]!.bands).toEqual(["developing", "solid"]);
    expect(s.improvements.map((h) => h.dimension)).toEqual(["approach"]);
  });

  it("reports never-reached dimensions separately, not as weaknesses", () => {
    const s = summarizeEvaluations([
      {
        type: "BEHAVIORAL",
        at: at(1),
        dimensions: [{ dimension: "impact", band: "not_demonstrated" }],
      },
    ]);
    expect(s.improvements).toEqual([]);
    expect(s.notYetShown.map((h) => h.dimension)).toEqual(["impact"]);
  });

  it("drops dimensions and bands outside the type's rubric", () => {
    const s = summarizeEvaluations([
      {
        type: "DSA",
        at: at(1),
        dimensions: [
          { dimension: "impact", band: "strong" },
          { dimension: "testing", band: "excellent" },
        ],
      },
    ]);
    expect(s.strengths).toEqual([]);
    expect(s.improvements).toEqual([]);
  });
});
