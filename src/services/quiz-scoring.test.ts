import { describe, expect, it } from "vitest";

import { answersMatch, scorePercent } from "./quiz-scoring";

describe("answersMatch", () => {
  it("matches a correct single answer", () => {
    expect(answersMatch("b", "b")).toBe(true);
  });

  it("rejects a wrong single answer", () => {
    expect(answersMatch("b", "c")).toBe(false);
  });

  it("treats a missing answer as wrong rather than throwing", () => {
    expect(answersMatch("b", null)).toBe(false);
    expect(answersMatch("b", undefined)).toBe(false);
  });

  it("ignores order for multi-select", () => {
    // Selecting the same options in a different order is the same answer.
    expect(answersMatch(["a", "c"], ["c", "a"])).toBe(true);
  });

  it("requires every option for multi-select", () => {
    expect(answersMatch(["a", "c"], ["a"])).toBe(false);
    expect(answersMatch(["a", "c"], ["a", "c", "d"])).toBe(false);
  });

  it("does not let a one-element array satisfy a single answer", () => {
    // The shapes mean different things; conflating them would let a
    // multi-select widget accidentally pass a single-answer question.
    expect(answersMatch("a", ["a"])).toBe(false);
  });

  it("does not let a bare string satisfy a multi-select", () => {
    expect(answersMatch(["a"], "a")).toBe(false);
  });

  it("handles duplicate submissions without silently passing", () => {
    // ["a", "a"] has the right length but is not the set {a, c}.
    expect(answersMatch(["a", "c"], ["a", "a"])).toBe(false);
  });
});

describe("scorePercent", () => {
  it("rounds to the nearest whole percent", () => {
    expect(scorePercent(2, 3)).toBe(67);
    expect(scorePercent(1, 3)).toBe(33);
  });

  it("is 100 for a perfect score and 0 for none", () => {
    expect(scorePercent(5, 5)).toBe(100);
    expect(scorePercent(0, 5)).toBe(0);
  });

  it("does not divide by zero on an empty quiz", () => {
    expect(scorePercent(0, 0)).toBe(0);
  });
});
