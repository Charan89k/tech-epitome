import { describe, expect, it } from "vitest";

import {
  chapterPrompt,
  missingPrompt,
  patternPrompt,
  problemPrompt,
} from "./prompts";

/**
 * Prompts are derived from the curriculum, so the thing worth testing is
 * that they stay a card: a question that asks for recall, and an answer
 * short enough to check a recollection against rather than re-read.
 */

const PATTERN = {
  slug: "sliding-window",
  name: "Sliding Window",
  tagline: "A contiguous range that grows and shrinks.",
  coreIdea: "Ask when to grow and when to shrink; both must be one-directional.",
  recognitionClues: ["contiguous", "longest or shortest", "a, b, c", "d", "e", "f", "g"],
  antiPatterns: ["subsequences", "non-removable summary", "third", "fourth"],
  commonMistakes: ["if instead of while", "off-by-one width", "third", "fourth"],
};

describe("patternPrompt", () => {
  it("asks for recognition rather than for a definition", () => {
    const prompt = patternPrompt(PATTERN);
    expect(prompt.question).toContain("recognise");
    expect(prompt.question).toContain("Sliding Window");
    expect(prompt.kind).toBe("Pattern");
  });

  it("leads with the recognition clues", () => {
    // Recognition is the skill; the clues are the answer to the question
    // actually asked, so they come first.
    const prompt = patternPrompt(PATTERN);
    expect(prompt.answer[0]!.heading).toBe("Recognition clues");
  });

  it("caps each section so the card stays a card", () => {
    const prompt = patternPrompt(PATTERN);
    for (const section of prompt.answer) {
      expect(section.items.length, section.heading).toBeLessThanOrEqual(5);
    }
  });

  it("links back to the pattern page", () => {
    expect(patternPrompt(PATTERN).href).toBe("/patterns/sliding-window");
  });

  it("omits sections the content does not supply", () => {
    const sparse = { ...PATTERN, antiPatterns: [], commonMistakes: [] };
    const headings = patternPrompt(sparse).answer.map((section) => section.heading);
    expect(headings).not.toContain("Not this pattern when");
    expect(headings).not.toContain("Easy to get wrong");
  });

  it("drops blank entries rather than rendering empty bullets", () => {
    const messy = { ...PATTERN, recognitionClues: ["real", "  ", ""] };
    expect(patternPrompt(messy).answer[0]!.items).toEqual(["real"]);
  });
});

const CHAPTER = {
  slug: "big-o-notation",
  title: "Big O Notation",
  summary: "What the notation claims.",
  keyTakeaways: ["Upper bound on growth", "Drop constants", "Worst case by default"],
  objectives: ["State what O(f(n)) claims", "Simplify an expression"],
  sectionSlug: "complexity-analysis",
  courseSlug: "dsa-foundations",
};

describe("chapterPrompt", () => {
  it("asks for recall from memory", () => {
    const prompt = chapterPrompt(CHAPTER);
    expect(prompt.question).toContain("From memory");
    expect(prompt.question).toContain("Big O Notation");
  });

  it("builds a link into the curriculum", () => {
    expect(chapterPrompt(CHAPTER).href).toBe(
      "/learn/dsa/dsa-foundations/complexity-analysis/big-o-notation"
    );
  });

  it("uses the key takeaways as the answer", () => {
    const prompt = chapterPrompt(CHAPTER);
    expect(prompt.answer[0]!.items).toContain("Drop constants");
  });
});

const PROBLEM = {
  slug: "running-altitude",
  number: 1,
  title: "Running Altitude",
  learningObjective: "Carry a running value through a single pass.",
  expectedTime: "O(n)",
  expectedSpace: "O(1)",
  patternNames: ["Prefix Sum"],
  hintsRevealed: 0,
  attempts: 1,
};

describe("problemPrompt", () => {
  it("asks for an approach, not for the code", () => {
    const prompt = problemPrompt(PROBLEM);
    expect(prompt.question).toContain("Without opening the solution");
    expect(prompt.question).toContain("Running Altitude");
  });

  it("states hint usage plainly when there was any", () => {
    const prompt = problemPrompt({ ...PROBLEM, hintsRevealed: 2 });
    expect(prompt.context).toBe("Last time you opened 2 hints on this one.");
  });

  it("uses the singular for one hint", () => {
    expect(problemPrompt({ ...PROBLEM, hintsRevealed: 1 }).context).toContain("1 hint on");
  });

  it("mentions attempts when there were several and no hints", () => {
    const prompt = problemPrompt({ ...PROBLEM, hintsRevealed: 0, attempts: 5 });
    expect(prompt.context).toBe("This one took you 5 attempts.");
  });

  it("says nothing when there is nothing worth saying", () => {
    expect(problemPrompt(PROBLEM).context).toBeUndefined();
  });

  it("includes the target complexity", () => {
    const complexity = problemPrompt(PROBLEM).answer.find(
      (section) => section.heading === "Target complexity"
    );
    expect(complexity?.items[0]).toBe("O(n) time, O(1) space");
  });

  it("copes with a problem that has no stated objective", () => {
    const prompt = problemPrompt({ ...PROBLEM, learningObjective: null });
    const headings = prompt.answer.map((section) => section.heading);
    expect(headings).not.toContain("What it teaches");
    expect(prompt.answer.length).toBeGreaterThan(0);
  });
});

describe("missingPrompt", () => {
  it("explains itself rather than showing an empty card", () => {
    // An item vanishing with no explanation is worse than one that says
    // what happened.
    const prompt = missingPrompt("CHAPTER");
    expect(prompt.question.length).toBeGreaterThan(10);
    expect(prompt.answer[0]!.items[0]).toContain("unpublished");
  });
});
