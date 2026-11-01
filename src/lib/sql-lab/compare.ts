export type SqlRows = (string | null)[][];

export type Comparison = { correct: true } | { correct: false; reason: string };

const rowKey = (row: (string | null)[]) => JSON.stringify(row);

/**
 * Whether a query's rows answer the exercise. Column names and aliases do not
 * matter, but column order does, because the prompt names the columns in order.
 */
export function compareRows(
  answer: SqlRows,
  expected: SqlRows,
  ordered: boolean
): Comparison {
  if ((answer[0]?.length ?? 0) !== (expected[0]?.length ?? 0) && answer.length > 0) {
    return {
      correct: false,
      reason: `Expected ${expected[0]?.length ?? 0} columns, got ${answer[0]?.length ?? 0}.`,
    };
  }
  if (answer.length !== expected.length) {
    return {
      correct: false,
      reason: `Expected ${expected.length} rows, got ${answer.length}.`,
    };
  }
  const left = answer.map(rowKey);
  const right = expected.map(rowKey);
  if (!ordered) {
    left.sort();
    right.sort();
  }
  if (left.every((row, index) => row === right[index])) return { correct: true };

  if (ordered && [...left].sort().join() === [...right].sort().join()) {
    return { correct: false, reason: "The rows are right, but the order is not." };
  }
  return { correct: false, reason: "The row count is right, but some values differ." };
}
