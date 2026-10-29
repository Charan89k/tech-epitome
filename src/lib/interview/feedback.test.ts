import { describe, expect, it } from "vitest";

import { checkFeedback, extractQuotes, SELF_CHECK } from "./feedback";
import { dimensionsFor, EVALUATION_DIMENSIONS, type InterviewFeedback } from "./types";

const said =
  "I would sort the array first, then use two pointers from both ends.\n" +
  "def solve(nums): nums.sort()";

function feedbackFor(
  dims = dimensionsFor("DSA"),
  evidence = 'You said "use two pointers from both ends" before coding.'
): InterviewFeedback {
  return {
    dimensions: dims.map((dimension) => ({ dimension, band: "solid", evidence })),
    strengths: ["Planned before coding."],
    improvements: ["Test on an empty input."],
    summary: "A clear plan.",
  };
}

describe("feedback checks", () => {
  it("accepts the type's exact rubric with real quotations", () => {
    expect(checkFeedback(feedbackFor(), "DSA", said)).toEqual({ ok: true });
  });

  it("ignores case, punctuation and curly quotes when matching", () => {
    const f = feedbackFor(
      dimensionsFor("DSA"),
      "“I would SORT the array first, then” was a good start"
    );
    expect(checkFeedback(f, "DSA", said).ok).toBe(true);
  });

  it("rejects a quotation the candidate never said", () => {
    const f = feedbackFor(
      dimensionsFor("DSA"),
      'You said "I always use a hash map here".'
    );
    const result = checkFeedback(f, "DSA", said);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.problems.join(" ")).toMatch(/not in the candidate's words/);
  });

  it("checks strengths, improvements and the summary too", () => {
    const f = {
      ...feedbackFor(),
      summary: 'You claimed "I have built this at Google".',
    };
    expect(checkFeedback(f, "DSA", said).ok).toBe(false);
  });

  it("rejects missing, foreign and repeated dimensions", () => {
    const dsa = dimensionsFor("DSA");
    expect(checkFeedback(feedbackFor(dsa.slice(1)), "DSA", said).ok).toBe(false);
    expect(checkFeedback(feedbackFor([...dsa, "impact"]), "DSA", said).ok).toBe(false);
    expect(checkFeedback(feedbackFor([...dsa, dsa[0]!]), "DSA", said).ok).toBe(false);
  });

  it("holds every interview type to its own rubric", () => {
    for (const type of ["DSA", "BEHAVIORAL", "SYSTEM_DESIGN", "LLD"] as const) {
      expect(checkFeedback(feedbackFor(dimensionsFor(type), "x"), type, said).ok).toBe(
        true
      );
    }
    expect(checkFeedback(feedbackFor(dimensionsFor("LLD"), "x"), "DSA", said).ok).toBe(
      false
    );
  });

  it("does not try to verify short quotes", () => {
    expect(extractQuotes('a "map" and "an unrelated sentence here"')).toEqual([
      "an unrelated sentence here",
    ]);
  });

  it("has a self-check question for every dimension", () => {
    for (const d of EVALUATION_DIMENSIONS) expect(SELF_CHECK[d]).toBeTruthy();
  });
});
