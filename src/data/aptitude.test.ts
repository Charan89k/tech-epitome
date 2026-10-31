import { describe, expect, it } from "vitest";

import { APTITUDE_TOPICS, gradeAptitude } from "./aptitude";

describe("aptitude content", () => {
  it("has a valid answer and an explanation for every question", () => {
    const ids = new Set<string>();
    for (const topic of APTITUDE_TOPICS) {
      for (const q of topic.questions) {
        expect(ids.has(q.id), `${q.id} is duplicated`).toBe(false);
        ids.add(q.id);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.explanation.length).toBeGreaterThan(5);
      }
    }
  });

  it("computes the worked quantitative answers independently", () => {
    const answerOf = (id: string) => {
      const q = APTITUDE_TOPICS[0]!.questions.find((x) => x.id === id)!;
      return q.options[q.answer];
    };
    expect(answerOf("q1")).toBe(`${(150 / 10) * 3.6} km/h`);
    expect(answerOf("q3")).toBe(`${(3 * 12) / 4} days`);
    expect(answerOf("q4")).toBe(String(6 * 20 - 5 * 18));
    expect(answerOf("q6")).toBe(String((64 / 8) * 5));
    expect(answerOf("q8")).toBe(`${(10 / 50) * 100}%`);
  });
});

describe("gradeAptitude", () => {
  const topic = APTITUDE_TOPICS[1]!;

  it("counts only correct answers, treating blanks as wrong", () => {
    const first = topic.questions[0]!;
    const result = gradeAptitude(topic, { [first.id]: first.answer });
    expect(result).toMatchObject({ correct: 1, total: topic.questions.length });
    expect(result.review[1]?.chosen).toBeNull();
  });

  it("ignores ids that are not in the set", () => {
    expect(gradeAptitude(topic, { nope: 1 }).correct).toBe(0);
  });
});
