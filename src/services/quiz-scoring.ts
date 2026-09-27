/**
 * Answer comparison, extracted from the quiz service so it can be tested
 * without a database.
 *
 * This is the function that decides whether someone got a question right,
 * so it is worth being precise about: multi-select answers are compared as
 * sets, because selecting the same options in a different order is the same
 * answer and marking it wrong would be a bug, not strictness.
 */
export function answersMatch(
  expected: string | string[],
  given: string | string[] | null | undefined
): boolean {
  if (given === null || given === undefined) return false;

  if (Array.isArray(expected)) {
    if (!Array.isArray(given)) return false;
    if (expected.length !== given.length) return false;
    const a = [...expected].sort();
    const b = [...given].sort();
    return a.every((value, index) => value === b[index]);
  }

  // A single-answer question must not be satisfied by an array, even a
  // one-element one: the shapes mean different things.
  if (Array.isArray(given)) return false;
  return given === expected;
}

/** Percentage score, rounded. Zero when the quiz has no points. */
export function scorePercent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}
