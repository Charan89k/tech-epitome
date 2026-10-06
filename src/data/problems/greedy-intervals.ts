import { bullets, example, para, rich, type ProblemSeed } from "./types";

/**
 * Greedy choices and interval scheduling.
 *
 * Every problem here rewards the same habit: find the one local decision that
 * can never be regretted - the earliest finish, the farthest reach, the
 * cheapest portion that still fits - and prove to yourself why. Intervals are
 * passed as `int[][]` rows of `start end`; where an answer is itself a list of
 * intervals it is returned flattened as `int[]` (s1 e1 s2 e2 ...).
 */
export const GREEDY_INTERVAL_PROBLEMS: ProblemSeed[] = [
  {
    slug: "can-reach-last-stone",
    title: "Stepping Stones Across the Stream",
    difficulty: "EASY",
    learningObjective:
      "Replace an exhaustive reachability search with a single running 'farthest point I can reach' value.",
    topics: ["greedy", "arrays"],
    patterns: ["greedy"],
    statement: [
      para(
        "A hiker crosses a stream on a line of stepping stones. Each stone is marked with the longest hop the hiker can safely make from it: from stone i with mark m, the hiker may land on any stone from i + 1 up to i + m. A mark of 0 means the stone is a dead end."
      ),
      rich(
        "The hiker starts on stone ",
        { code: "0" },
        ". Return ",
        { code: "true" },
        " if the last stone can be reached, and ",
        { code: "false" },
        " otherwise."
      ),
      example(
        "hops = [2, 3, 1, 1, 4]",
        "true",
        [
          { state: "stone 0, reach = 2", note: "from 0 we can land on 1 or 2" },
          {
            state: "stone 1, reach = 4",
            note: "1 + 3 = 4 already covers the last stone",
          },
          { state: "stone 2..4", note: "every stone up to 4 is within reach" },
        ],
        "Tracking the farthest reachable stone"
      ),
      example(
        "hops = [3, 2, 1, 0, 4]",
        "false",
        [
          { state: "stone 0, reach = 3", note: "" },
          { state: "stones 1, 2, 3", note: "each of them also tops out at stone 3" },
          { state: "stone 4", note: "4 > reach of 3 — the hiker is stuck on stone 3" },
        ],
        "A wall of dead ends"
      ),
    ],
    constraints: [
      "1 ≤ hops.length ≤ 10000",
      "0 ≤ hops[i] ≤ 100000",
      "With a single stone the hiker is already standing on the last one.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["hops"],
      returns: "bool",
      functionName: "canCrossStream",
    },
    tests: [
      {
        input: "2 3 1 1 4",
        expected: "true",
        isSample: true,
        explanation: "Stone 1 alone can hop 3, landing on the last stone.",
      },
      {
        input: "3 2 1 0 4",
        expected: "false",
        isSample: true,
        explanation: "Every route ends on stone 3, whose mark is 0.",
      },
      {
        input: "0",
        expected: "true",
      },
      {
        input: "0 1",
        expected: "false",
      },
      {
        input: "1 0",
        expected: "true",
      },
      {
        input: "2 0 0",
        expected: "true",
      },
      {
        input: "1 1 0 1",
        expected: "false",
      },
      {
        input: "5 0 0 0 0 0",
        expected: "true",
      },
      {
        input: "4 0 0 0 0 1",
        expected: "false",
      },
      {
        input:
          "3 0 2 2 4 1 4 1 4 4 4 0 0 0 1 0 0 2 3 4 3 2 1 0 0 1 3 1 1 1 1 3 0 0 0 3 0 1 2 0 3 3 1 1 2 1 0 4 3 0 1 1 0 0 0 3 3 1 0 3 4 2 0 4 2 4 0 2 2 3 1 4 3 1 4 0 1 0 3 0 4 0 3 1 3 2 1 4 0 0 0 3 4 4 0 3 1 1 4 2 0 4 4 4 0 3 1 0 3 0 3 0 2 0 3 4 0 3 1 2 3 1 4 0 3 3 4 4 4 3 2 0 2 3 0 1 3 0 4 4 4 4 0 3 2 4 3 3 0 3 1 3 0 3 0 3 1 4 3 3 2 0 1 2 0 3 0 4 3 0 2 2 4 4 3 4 4 1 4 0 4 1 3 0 1 3 2 0 4 2 3 1 3 0 4 2 1 3 1 4 3 4 3 1 1 2 3 0 2 4 3 2 0 3 2 3 0 4 1 2 4 1 4 1 1 4 1 3 2 1 3 1 4 1 3 3 0 0 3 0 3 1 0 2 3 4 0 0 1 1 4 0 1 4 1 2 3 1 1 3 0 0 4 1 1 0 0 3 0 4 3 1 1 4 0 3 1 2 4 4 3 2 2 1 3 1 4 1 2 3 1 1 0 4 2 0 1 4 4 0 1 1 3 1 2 1 0 0 1 0 2 4 0 3 3 3 0 3 0 3 2 1 4 2 0 2 4 0 1 0 3 0 0 3 4 0 2 4 1 4 0 3 4 0 2 1 3 0 2 4 0 1 4 3 3 2 2 2 1 0 2 4 4 0 4 2 0 1 0 4 1 0 1 3 0 2 2 0 1 3 2 2 1 2 3 4 2 1 4 0 4 2 4 4 3 1 4 0 0 3 3 3 1 4 3 4 1 0 2 3 2 1 3 4 2 0 0 1 4 1 2 4 0 2 0 2 3 0 2 1 0 4 0 4 0 1 0 1 4 4 1 2 0 0 0 4 1 3 1 1 0 2 1 0 2 1 0 3 3 1 4 1 4 1 0 3 0 0 4 4 4 0 0 2 2 2 2 2 3 3 0 1 1 3 1 2 2 1 0 0 2 3 3 4 4 2 4 3 0 2 1 3 0 2 0 2 0 3 4 0 0 1 4 0 4 4 4 1 1 4 0 3 4 1 3 2 1 3 3 4 3 0 2 3 2 3 1 2 1 4 3 4 2 3 4 3 3 4 1 1 3 4 3 1 1 0 0 0 1 2 1 2 1 3 2 1 3 3 3 3 4 1 1 0 3 1 2 4 3 3 1 4 4 2 0 1 0 0 4 2 0 1 0 2 1 1 0 1 3 3 4 0 1 1 1 3 3 0 3 1 3 1 3 3 0 3 3 3 1 1 3 3 4 0 3 4 4 0 4 1 1 1 1 1 2 4 2 3 0 3 0 4 2 0 4 2 0 0 4 4 3 1 0 0 2 1 4 2 0 1 4 0 3 4 0 4 4 4 3 1 2 4 4 3 4 0 4 3 3 0 0 0 0 1 4 1 1 4 2 0 4 2 0 0 3 4 4 0 0 3 4 3 1 2 4 1 4 4 2 0 4 1 1 0 4 0 0 4 0 3 1 2 0 2 2 2 2 4 4 0 3 4 2 1 4 3 4 4 4 3 4 4 4 1 1 4 0 4 0 2 4 1 4 4 4 2 4 2 4 1 1 1 1 2 4 0 1 4 4 2 4 3 4 2 1 1 1 1 0 3 0 3 3 4 4 1 2 4 3 2 1 1 3 0 0 3 1 0 3 0 0 4 4 1 0 1 1 4 2 2 2 0 4 1 1 3 2 2 3 1 3 3 3 2 1 2 1 2 3 3 3 2 4 2 0 0 3 4 2 0 3 4 1 3 2 1 2 4 1 2 2 1 3 3 4 0 3 4 0 3 1 3 4 0 2 0 1 3 2 0 1 0 3 3 3 2 4 4 3 0 4 4 0 2 3 2 4 1 3 4 0 3 4 0 4 2 3 3 0 4 1 1 2 1 4 0 4 4 0 4 1 4 1 4 2 4 3 4 0 0 3 0 0 1 3 1 4 4 1 1 0 1 1 3 2 0 0 0 0 4 2 2 3 1 2 3 4 4 4 1 3 2 1 2 0 4 3 3 2 3 0 4 4 4 1 4 4 2 1 0 1 0 2 1 3 3 3 3 4 4 3 2 4 0 2 0 0 2 1 3 2 4 1 0 1 4 1 4 2 3 4 2 3 0 1 2 0 1 0 0 4 4 0 4 1 0 4 3 1 1 2 3 2 4 2 0 4 2 1 2 0 1 1 1 1 1 1 4 0 1 4 0 4 3 3 3 0 4 3 0 2 1 2 0 3 2 4 2 3 2 1 0 3 2 3 4 3 1 1 1 4 3 1 3 2 2 3 3 3 2 0 4 3 2 3 0 0 0 3 0 0 4 3 3 2 3 2 2 2 2 1 0 2 4 3 3 0 1 3 4 1 2 2 4 0 3 1 2 0 3 2 1 0 1 4 4 0 3 2 2 4 0 2 1 1 0 1 0 4 0 1 1 0 2 2 3 3 3 4 0 2 4 1 4 2 2 2 1 1 1 2 4 3 2 4 2 1 1 3 4 1 4 0 1 0 0 3 1 0 4 3 3 0 1 0 0 2 3 1 4 4 2 4 4 4 1 2 3 3 4 2 4 2 0 3 0 3 0 1 0 4 1 4 1 1 4 0 2 2 0 0 3 1 0 2 2 4 1 0 2 0 1 1 3 2 1 1 4 2 2 3 4 3 4 0 2 1 1 4 4 1 1 2 1 2 3 2 0 3 4 3 3 1 3 0 4 4 3 2 3 2 4 1 3 1 3 0 0 2 0 1 3 1 0 4 4 2 2 4 2 4 2 3 4 3 3 1 2 3 3 4 4 0 0 4 1 2 1 1 1 2 1 2 3 1 2 0 4 4 3 1 3 4 3 1 0 2 1 0 3 3 0 4 1 3 0 4 3 4 3 4 2 0 0 3 1 3 0 2 1 0 3 4 4 1 3 2 2 3 4 1 2 4 1 4 3 0 2 3 3 2 2 0 3 4 4 2 3 1 4 1 4 1 2 2 1 2 3 0 3 1 3 3 2 1 0 4 1 4 1 4 1 3 2 0 3 1 1 1 2 0 4 3 4 4 4 2 4 3 4 3 1 1 0 0 4 0 0 3 3 3 1 2 2 1 0 3 2 2 0 4 2 0 3 1 3 3 1 0 0 2 1 4 2 1 4 1 0 1 2 4 1 3 0 1 4 0 1 0 1 0 4 2 0 2 3 3 2 2 1 1 4 3 0 0 2 0 3 2 0 3 1 3 0 1 4 0 0 2 1 4 4 0 1 0 0 0 1 1 4 2 1 2 4 1 4 4 3 4 3 3 1 0 0 3 3 2 1 0 2 0 3 4 0 2 4 0 2 3 4 2 0 4 0 2 0 4 2 0 4 1 1 2 2 1 2 3 0 4 3 0 0 4 4 3 3 1 2 2 4 2 1 4 0 3 3 2 2 0 2 0 1 2 1 0 2 4 0 1 1 2 3 2 0 1 3 0 3 2 2 3 3 1 2 4 2 4 1 3 1 2 4 2 2 1 0 1 2 0 1 0 0 4 2 2 0 2 1 3 2 4 3 4 1 1 1 0 1 3 1 1 2 2 0 4 4 4 4 4 2 4 3 1 0 0 1 1 4 2 3 3 3 4 3 0 4 2 2 3 3 1 2 0 0 0 3 2 4 4 2 0 4 0 1 0 0 3 4 2 2 1 0 1 4 0 1 1 3 2 3 0 3 2 4 2 4 4 3 3 2 3 2 3 1 4 1 3 4 0 0 2 3 0 1 1 1 4 2 2 0 0 0 4 0 2 3 0 3 2 0 1 3 4 3 1 0 0 0 0 0 4 1 4 2 2 2 2 3 0 4 2 0 2 2 4 0 4 0 4 3 2 4 4 3 3 4 2 0 0 4 0 2 3 4 3 2 1 3 3 3 2 4 4 3 1 2 1 3 3 3 0 3 1 1 3 2 1 2 2 4 2 1 2 2 1 0 4 3 0 2 3 0 0 3 2 4 0 2 4 3 0 2 3 4 3 2 1 2 2 3 1 2 0 0 2 2 3 4 0 3 0 1 1 3 1 3 2 4 1 0 4 0 3 2 4 0 0 2 2 2 4 0 2 3 2 1 2 3 1 0 1 4 4 1 2 1 1 0 1 4 2 2 0 1 4 3 4 1 4 3 1 4 2 4 3 4 0 3 0 2 1 2 4 4 2 2 4 1 1 4 0 3 2 3 1 3 4 2 3 3 0 1 0 1 3 0 0 4 2 3 2 4 4 0 4 0 3 4 1 3 0 1 0 4 0 4 2 0 0 1 3 4 0 0 1 4 0 3 0 3 2 4 1 2 0 1 2 3 3 3 4 3 2 2 0 2 3 3 1 4 0 0 2 1 3 4 2 3 0 0",
        expected: "false",
      },
      {
        input:
          "1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3 3",
        expected: "false",
      },
      {
        input:
          "2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2",
        expected: "true",
      },
    ],
    hints: [
      "Start with the obvious: mark stone 0 as reachable, then mark everything each reachable stone can hop to.",
      "Do you really need to remember which individual stones are reachable? If stone 7 is reachable, what can you say about stone 5?",
      "The reachable stones always form a prefix 0..reach. One number describes the whole set.",
      "Walk left to right. If you ever stand on an index beyond reach, you are stuck; otherwise stretch reach to i + hops[i].",
    ],
    solutions: [
      {
        title: "Mark every reachable stone",
        order: 1,
        intuition:
          "Treat it as a reachability question. Keep a boolean per stone. Each reachable stone switches on every stone it can hop to. Because hops only go forward, one left-to-right pass settles every stone before it is used.",
        approach: [
          "Create a boolean list with only stone 0 marked reachable.",
          "For each reachable stone i, mark stones i + 1 through i + hops[i] (clipped to the end).",
          "Return whether the last stone was marked.",
        ],
        code: {
          PYTHON: `def canCrossStream(hops: List[int]) -> bool:
    n = len(hops)
    reachable = [False] * n
    reachable[0] = True

    for i in range(n):
        if not reachable[i]:
            continue
        for j in range(i + 1, min(n, i + hops[i] + 1)):
            reachable[j] = True

    return reachable[n - 1]`,
          JAVA: `class Solution {
    public boolean canCrossStream(int[] hops) {
        int n = hops.length;
        boolean[] reachable = new boolean[n];
        reachable[0] = true;

        for (int i = 0; i < n; i++) {
            if (!reachable[i]) continue;
            long limit = Math.min((long) n - 1, (long) i + hops[i]);
            for (int j = i + 1; j <= limit; j++) reachable[j] = true;
        }

        return reachable[n - 1];
    }
}`,
        },
        timeComplexity: "O(n · max hop) — every stone may relabel many others",
        spaceComplexity: "O(n)",
        edgeCases: ["A single stone.", "Large hop values that run past the end."],
        commonMistakes: [
          "Forgetting to clip the inner loop at the last stone.",
          "Marking stones from unreachable starting points.",
        ],
      },
      {
        title: "Optimal: carry the farthest reach",
        order: 2,
        intuition:
          "Reachable stones never have gaps: if you can reach stone k, you passed over every stone before it and could have stopped there instead. So the whole reachable set is the prefix 0..reach, and a single integer is enough. Each stone you can stand on may only push that frontier further.",
        approach: [
          "Set reach = 0.",
          "Scan stones left to right. If i > reach, stone i cannot be stood on — return false.",
          "Otherwise update reach = max(reach, i + hops[i]).",
          "If the scan completes, every stone including the last was reachable — return true.",
        ],
        code: {
          PYTHON: `def canCrossStream(hops: List[int]) -> bool:
    reach = 0  # farthest stone we can stand on so far

    for i, hop in enumerate(hops):
        if i > reach:
            return False  # a gap: stone i is beyond every hop
        reach = max(reach, i + hop)

    return True`,
          JAVA: `class Solution {
    public boolean canCrossStream(int[] hops) {
        long reach = 0; // farthest stone we can stand on so far

        for (int i = 0; i < hops.length; i++) {
            if (i > reach) return false;
            reach = Math.max(reach, (long) i + hops[i]);
        }

        return true;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A zero on the very first stone of a longer line.",
          "A zero that is jumped over — it only matters if it caps the reach.",
          "A dead end sitting exactly on the last stone, which is fine: you only need to land there.",
        ],
        commonMistakes: [
          "Returning false as soon as a 0 appears, even when an earlier stone hops past it.",
          "Checking i > reach after updating reach, which lets the hiker stand on a stone they never reached.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "portions-for-appetites",
    title: "Portions for Appetites",
    difficulty: "EASY",
    learningObjective:
      "Sort both sides and pair the smallest adequate resource with the smallest demand, so nothing big is wasted on someone small.",
    topics: ["greedy", "arrays"],
    patterns: ["greedy", "two-pointers"],
    statement: [
      para(
        "A community kitchen has prepared a tray of portions of different sizes, and a queue of diners who each have an appetite. A diner leaves happy if handed a single portion at least as large as their appetite. Every diner receives at most one portion, and every portion goes to at most one diner."
      ),
      para("Return the largest number of diners who can leave happy."),
      example(
        "appetites = [4, 2, 7], portions = [3, 5, 2, 8]",
        "3",
        [
          { state: "appetites 2 4 7 · portions 2 3 5 8", note: "sort both" },
          {
            state: "portion 2 → appetite 2",
            note: "smallest portion that fits the smallest appetite",
          },
          {
            state: "portion 3 → too small for 4",
            note: "skip it; it cannot help anyone bigger either",
          },
          { state: "portion 5 → appetite 4", note: "" },
          { state: "portion 8 → appetite 7", note: "three happy diners" },
        ],
        "Smallest fit first"
      ),
    ],
    constraints: [
      "0 ≤ appetites.length, portions.length ≤ 30000",
      "1 ≤ appetites[i], portions[j] ≤ 1000000000",
    ],
    signature: {
      params: ["int[]", "int[]"],
      paramNames: ["appetites", "portions"],
      returns: "int",
      functionName: "maxSatisfiedDiners",
    },
    tests: [
      {
        input: "1 2 3\n1 1",
        expected: "1",
        isSample: true,
        explanation:
          "Both portions have size 1, so only the diner with appetite 1 can be satisfied.",
      },
      {
        input: "4 2 7\n3 5 2 8",
        expected: "3",
        isSample: true,
        explanation: "Pair 2→2, 5→4 and 8→7; the 3 fits nobody left.",
      },
      {
        input: "5\n",
        expected: "0",
      },
      {
        input: "\n3 4",
        expected: "0",
      },
      {
        input: "10 10\n1 2 3",
        expected: "0",
      },
      {
        input: "1 1 1\n1 1 1",
        expected: "3",
      },
      {
        input: "3 1 2\n2 2 2 2",
        expected: "2",
      },
      {
        input: "7 8 9\n9 8 7",
        expected: "3",
      },
      {
        input:
          "724 96 458 488 692 567 398 656 504 992 96 191 529 231 470 582 914 903 213 666 992 478 698 716 608 936 301 32 607 845 996 736 713 498 563 101 18 825 571 552 273 422 730 565 840 886 165 162 574 41 410 360 300 473 300 424 870 63 116 355 304 451 1000 666 50 521 749 673 754 841 254 568 421 313 294 569 312 274 852 510 615 982 131 641 757 176 794 17 782 254 334 222 564 85 746 235 994 332 337 859 25 87 351 585 324 513 497 530 732 992 729 88 63 111 719 368 928 176 392 322 213 226 821 976 257 996 260 679 960 12 791 269 927 265 15 435 131 278 165 559 9 341 504 451 779 224 8 52 112 2 478 509 577 772 405 285 679 466 998 816 641 885 789 903 753 393 511 202 619 701 967 829 300 802 442 352 709 26 656 957 297 513 426 141 426 964 72 272 103 588 859 551 851 162 190 870 676 524 58 674 912 425 762 668 213 355 541 874 608 5 11 727 667 51 255 589 464 958 279 85 371 206 346 69 317 867 908 189 128 493 934 366 193 840 583 580 845 309 790 518 267 48 898 367 860 572 310 867 809 169 304 361 958 149 27 90 206 842 261 841 986 398 123 988 104 923 941 838 780 887 705 580 741 582 365 162 174 518 554 830 698 668 671 213 739 914 685 581 317 172 632 893 332 311 580 299 452 614 123 888 661 707 458 278 940 753 215 359 43 287 848 425 925 708 826 351 905 325 171 987 210 792 474 184 102 866 292 708 751 688 673 357 692 713 453 930 284 243 518 108 223 477 848 234 263 828 33 458 651 413 893 898 428 988 492 732 805 966 710 768 293 360 809 522 256 904 156 877 793 749 752 768 689 267 850 763 263 240 837 208 1 781 675 616 273 152 330 63 365 737 201 175 220 515 550 907 383 324 747 181 770 277 841 366 888 652 347 431 265 199 986 392 153 403 752 169 320 89 441 319 508 131 931 83 555 708 723 646 430 48 841 293 253 205 359 606 804 67 210 286 820 192 674 286 644 494 540 160 72 732 647 431 505 792 1000 127 963 498 787 232 669 709 104 31 611 544 48 622 192 284 998 506 530 641 879 469 805 250 333 493 818 930 734 78 670 275 297 899 450 914 767 103 328 595 228 702 272 827 856 172 160 488 521 695 351 71 396 58 344 773 23 487 118 764 971 318 741 819 848 115 605 576 206 350 321 590 543 991 705 523 942 331 506 997 495 502 39 119 90 437 259 702 111 869 264 542 593 371 828 277 807 290 881 586 809 530 237 843 198 493 816 872 631 373 892 556 745 637 468 76 550 552 53 873 433 210 949 714 357 738 577 576 746 323 334 358 5 612 431 421 547 186 603 157 497 390 538 724 899 328 287 181 379 328 31 959 887 737 397 465 401 936 122 736 190 517 665 714 309 533 339 213 851 830 822 481 430 409 518 325 962 299 375 412 696 168 40 683 533 825 453 197 856 918 719 651 589 511 506 928 69 688 378 4 62 313 296 908 47 896 345 467 643 759 910 961 63 895 819 74 491 14 410 439 403 731 159 114 45 134 263 743 366 247 172 771 562 884 571 139 364 263 774 55 318 723 888 128 270 651 576 368 539 68 88 271 651 640 998 79 297 487 484 132 721 925 435 428 70 617 836 142 873 908 306 111 336 589 149 723 488 101 478 811 756 622 213 363 705 934 205 822 419 714 750 825 596 866 395 136 187 706 400 594 705 961 851 960 65 960 278 997 571 89 270 787 195 689 26 253 426 419 342 38 992 570 871 152 668 514 305 649 940 551 432 484 704 613 36 507 980 437 269 416 885 681 887 34 806 459 243 450 396 384 849 359 217 489 647 128 163 452 3 336 344 619 298 250 806 979 791 616 428 996 236 523 836 963 975 481 478 49 569 867 819 954 134 655 160 514 260 672 972 10 820 472 638 50 949 993 458 612 218 932 398 140 433 760 312 644 611 42 963 46 202 998 845 929 394 113 801 73 443 792 757 672 433 821 960 901 33 942 274 927 493 819 150 620 222 16 686 180 330 74 859 228 439 47 876 206 986 511 190 381 296 554 848 227 888 220 700 362 552 283 550 584 453 403 555 480 775 48 218 606 468 805 624 765 489 142 864 262 243 266 271 844 723 398 816 439 971 892 362 887 877 332 487 663 118 605 349 983 279 473 169 124 254 312 525 793 992 410 460 674 618 232 373 964 732 800 516 680 754 933 218 503 347 296 400 295 292 723 121 419 584 50 55 253 771 220 881 295 295 976 13 386 142 340 719 803\n743 820 2 865 767 935 844 119 961 535 897 652 583 13 979 130 718 632 175 731 83 770 155 495 536 61 303 265 756 69 374 934 869 811 982 185 83 90 233 974 824 870 928 426 519 163 243 692 203 624 257 106 71 532 180 849 84 450 225 286 485 651 949 818 101 549 453 603 842 25 814 89 536 641 292 171 365 535 636 6 188 66 565 937 474 858 344 528 194 363 971 957 152 666 154 837 780 1 773 943 366 45 625 367 286 657 418 549 755 373 825 354 952 479 539 371 666 114 403 230 437 487 319 898 369 425 901 649 216 962 447 718 340 815 347 754 760 243 560 767 510 892 660 698 471 968 200 340 987 176 632 186 155 336 167 399 112 127 424 652 757 220 371 681 384 607 325 895 150 471 414 251 528 112 609 336 371 761 356 963 319 646 231 549 724 501 905 892 551 865 146 187 309 995 912 25 291 120 877 440 755 799 845 728 448 597 813 74 419 495 920 49 38 64 770 715 252 432 783 685 214 908 608 248 175 666 801 91 389 909 968 830 684 65 132 401 438 499 441 181 801 160 207 855 470 460 585 131 987 983 344 345 36 359 13 831 799 853 830 480 934 443 855 476 886 454 552 803 932 330 118 114 631 717 975 820 48 242 515 424 316 552 977 317 483 538 995 72 624 426 702 650 188 360 963 656 291 480 217 858 358 603 347 544 863 932 886 971 90 623 114 754 58 78 433 46 876 887 393 487 910 963 517 99 915 303 414 24 471 961 4 390 370 335 698 246 647 370 239 92 864 838 270 936 255 692 504 24 339 480 231 220 192 703 423 440 641 705 26 852 87 610 834 234 473 226 846 244 47 711 362 770 532 999 256 258 43 511 60 1000 785 845 324 345 121 467 616 841 87 72 884 232 60 688 252 141 952 873 756 292 543 685 503 124 327 952 328 435 591 89 671 85 95 686 237 182 444 294 683 155 324 724 789 136 931 741 245 621 661 284 544 410 199 651 861 881 778 510 842 445 587 78 152 266 598 759 511 140 779 245 306 374 962 458 452 163 609 947 594 776 861 540 891 536 337 547 320 816 660 671 558 559 375 235 706 407 756 230 333 503 172 868 526 341 19 923 966 395 869 870 184 990 568 684 211 302 378 338 286 752 429 974 468 323 142 187 169 287 859 517 855 484 445 273 464 666 888 510 394 287 395 320 419 994 103 609 618 344 782 902 653 27 591 129 265 137 847 973 794 440 574 773 369 869 912 688 248 148 839 119 255 706 630 233 454 69 558 981 557 503 651 691 888 126 141 737 831 601 592 361 524 363 928 682 906 778 916 434 110 28 676 908 100 306 472 796 134 411 584 6 446 969 33 180 647 127 421 823 397 946 64 401 748 751 899 464 386 795 458 757 131 630 246 233 748 913 803 460 747 902 425 439 406 200 877 946 153 166 467 459 878 390 190 805 187 584 945 65 740 682 384 443 673 727 561 550 511 122 708 267 468 855 875 392 298 312 782 488 443 871 244 614 944 835 506 842 434 792 289 511 255 931 598 477 995 258 869 439 543 500 611 35 599 326 652 918 839 211 99 614 778 431 659 241 949 115 859 523 356 307 404 250 217 40 225 716 529 49 354 672 941 377 437 561 80 108 602 180 910 874 571 734 956 765 709 253 893 647 970 386 765 850 552 378 48 765 834 709 295 840 442 592 559 183 385 268 14 51 67 747 741 327 145 832 958 945 944 998 409 892 899 315 981 94 798 435 362 445 646 915 656 229 485 311 99 384 121 25 586 218 517 815 875 767 82 99 627 30 401 907 981 929 220 969 794 192 518 747 42 627 141 805 550 767 494 527 896 221 483 209 570 25 26 327 844 14 261 859 198 629 305 694 192 412 222 605 966 886 121 664 375 821 860 495 461 724 231 867 898 873 768 953 345 122 366 181 843 81 907 638 487 183 673 929 295 498 778 383 441 911 198 959 135 848 372 283 137 770 417 505 545 168 256 546 655 791 478 249 88 163 358 375 962 735 516 19 89 984 117 992 453 982 50 419 226 470 889 574 389 576",
        expected: "900",
      },
    ],
    hints: [
      "Which diner is easiest to please? Which portion is least valuable?",
      "Giving a huge portion to a tiny appetite can only hurt — a smaller portion would have done the same job.",
      "Sort both lists. Walk the portions from small to large, and hand each to the hungriest-yet-smallest diner still waiting if it is big enough.",
      "Two pointers over two sorted lists: advance the diner pointer only when a portion satisfies them.",
    ],
    solutions: [
      {
        title: "For each diner, search for the smallest fitting portion",
        order: 1,
        intuition:
          "Serve diners from smallest appetite upward, and for each one scan the whole tray for the smallest unused portion that still satisfies them. This already embodies the greedy idea, but pays a full scan per diner.",
        approach: [
          "Sort the appetites.",
          "For each appetite, scan all portions and pick the smallest unused one that is large enough.",
          "If one is found, mark it used and count the diner.",
        ],
        code: {
          PYTHON: `def maxSatisfiedDiners(appetites: List[int], portions: List[int]) -> int:
    used = [False] * len(portions)
    happy = 0

    for need in sorted(appetites):
        best = -1
        for j, size in enumerate(portions):
            if not used[j] and size >= need:
                if best == -1 or size < portions[best]:
                    best = j
        if best != -1:
            used[best] = True
            happy += 1

    return happy`,
          JAVA: `class Solution {
    public int maxSatisfiedDiners(int[] appetites, int[] portions) {
        int[] needs = appetites.clone();
        Arrays.sort(needs);
        boolean[] used = new boolean[portions.length];
        int happy = 0;

        for (int need : needs) {
            int best = -1;
            for (int j = 0; j < portions.length; j++) {
                if (!used[j] && portions[j] >= need && (best == -1 || portions[j] < portions[best])) {
                    best = j;
                }
            }
            if (best != -1) {
                used[best] = true;
                happy++;
            }
        }

        return happy;
    }
}`,
        },
        timeComplexity: "O(n · m)",
        spaceComplexity: "O(m)",
        edgeCases: ["No portions at all.", "No diners at all."],
        commonMistakes: [
          "Picking the first fitting portion instead of the smallest, which can starve a later diner.",
        ],
      },
      {
        title: "Optimal: sort both, two pointers",
        order: 2,
        intuition:
          "Once both lists are sorted, the smallest portion either satisfies the smallest waiting appetite or it satisfies nobody at all — every other diner is at least as hungry. So each portion is decided the moment we look at it, and both pointers only move forward.",
        approach: [
          "Sort appetites and portions ascending.",
          "Keep a pointer i at the smallest unsatisfied appetite.",
          "For each portion in ascending order, if it is at least appetites[i], serve that diner and advance i.",
          "Return i, the number served.",
        ],
        code: {
          PYTHON: `def maxSatisfiedDiners(appetites: List[int], portions: List[int]) -> int:
    needs = sorted(appetites)
    sizes = sorted(portions)
    i = 0  # next diner waiting to be served

    for size in sizes:
        if i < len(needs) and size >= needs[i]:
            i += 1  # this portion satisfies the smallest remaining appetite

    return i`,
          JAVA: `class Solution {
    public int maxSatisfiedDiners(int[] appetites, int[] portions) {
        int[] needs = appetites.clone();
        int[] sizes = portions.clone();
        Arrays.sort(needs);
        Arrays.sort(sizes);

        int i = 0;
        for (int size : sizes) {
            if (i < needs.length && size >= needs[i]) i++;
        }
        return i;
    }
}`,
        },
        timeComplexity: "O(n log n + m log m) — dominated by sorting",
        spaceComplexity: "O(n + m) for the sorted copies",
        edgeCases: [
          "Either list empty.",
          "Every portion too small for every diner.",
          "More portions than diners — the pointer stops at the end of the diners.",
        ],
        commonMistakes: [
          "Advancing the diner pointer when the portion is too small, which skips a diner who could still be served.",
          "Serving from the largest portion downward to the smallest appetite, which wastes big portions.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "exact-change-booth",
    title: "Exact Change at the Ferry Booth",
    difficulty: "EASY",
    learningObjective:
      "Spend the least flexible resource first so the versatile one is still there when only it will do.",
    topics: ["greedy", "arrays"],
    patterns: ["greedy"],
    statement: [
      para(
        "A ferry booth sells tickets for 5 coins each. Passengers queue up and each pays with a single note worth 5, 10 or 20 coins. The booth opens with an empty cash drawer and may only hand out change from notes it has collected so far."
      ),
      rich(
        "Given the notes in queue order, return ",
        { code: "true" },
        " if every passenger can be given exact change, and ",
        { code: "false" },
        " as soon as one cannot."
      ),
      example(
        "payments = [5, 5, 10, 5, 20]",
        "true",
        [
          { state: "fives 1, tens 0", note: "first 5 — no change needed" },
          { state: "fives 2, tens 0", note: "" },
          { state: "fives 1, tens 1", note: "10 paid — return a 5" },
          { state: "fives 2, tens 1", note: "" },
          {
            state: "fives 1, tens 0",
            note: "20 paid — return 10 + 5, keeping fives for later",
          },
        ],
        "Keeping count of the drawer"
      ),
    ],
    constraints: ["1 ≤ payments.length ≤ 100000", "Each payment is 5, 10 or 20."],
    signature: {
      params: ["int[]"],
      paramNames: ["payments"],
      returns: "bool",
      functionName: "canGiveChange",
    },
    tests: [
      {
        input: "5 5 10 5 20",
        expected: "true",
        isSample: true,
        explanation: "Change is always available; the 20 is broken with a 10 and a 5.",
      },
      {
        input: "5 10 10",
        expected: "false",
        isSample: true,
        explanation: "The second 10 arrives when the drawer holds no fives.",
      },
      {
        input: "5",
        expected: "true",
      },
      {
        input: "10",
        expected: "false",
      },
      {
        input: "20",
        expected: "false",
      },
      {
        input: "5 5 5 20",
        expected: "true",
      },
      {
        input: "5 5 10 10 20",
        expected: "false",
      },
      {
        input: "5 10 5 20 5 10",
        expected: "true",
      },
      {
        input:
          "5 10 5 20 5 10 5 5 10 5 20 5 10 10 5 20 5 20 5 5 20 10 5 5 5 5 10 20 10 20 5 20 5 5 5 5 10 10 5 20 5 5 5 10 10 20 10 20 5 10 5 5 5 20 20 20 5 10 5 20 5 10 5 5 10 10 5 5 20 5 20 20 5 5 10 10 5 20 5 20 5 10 5 20 5 5 10 10 5 20 5 5 10 20 5 5 10 20 5 10 5 20 5 20 5 5 10 20 5 10 5 20 5 5 10 10 5 5 20 10 5 10 5 10 5 20 5 5 20 5 5 10 5 10 5 10 5 20 5 10 10 5 5 10 20 10 5 5 10 5 5 10 20 10 5 5 10 20 5 20 5 20 5 5 20 20 5 10 5 20 5 5 20 5 20 5 10 20 5 5 10 20 5 20 5 10 5 10 5 10 5 5 10 5 5 20 20 10 5 10 5 20 5 10 5 20 5 20 5 10 5 10 5 10 5 10 5 20 5 20 5 10 5 5 10 5 5 20 5 10 20 5 20 10 5 5 5 10 10 10 5 5 10 5 20 5 20 10 5 10 5 20 5 20 5 20 5 20 5 20 5 5 5 10 5 10 10 10 5 20 5 5 5 5 10 10 5 5 10 10 5 10 5 10 20 5 10 5 20 10 5 20 5 20 5 10 5 10 5 20 5 10 5 20 5 5 20 20 5 20 5 5 10 5 20 5 5 20 10 20 5 10 5 5 5 20 20 10 5 20 5 20 5 20 5 5 20 5 5 10 10 20 5 20 5 10 5 10 5 5 5 20 20 20 5 20 5 5 10 20 5 10 5 10 5 5 20 5 5 10 20 20 5 10 5 20 5 20 5 10 5 5 5 20 5 5 5 5 10 20 10 5 5 10 10 10 5 5 10 5 10 20 5 10 10 10 5 10 5 5 5 20 20 20 5 10 5 20 5 10 5 5 20 5 20 10 5 20 5 10 5 20 5 5 10 10 5 20 5 20 5 5 10 20 5 5 5 20 20 20 5 10 5 10 5 10 5 5 20 20 5 5 20 20 5 10 5 20 5 10 5 20 5 5 10 10 5 20 5 5 5 5 20 5 10 5 5 5 20 20 20 20 5 5 20 10 20 5 5 10 20 5 5 5 20 5 10 10 5 10 5 20 5 20 5 10 5 5 5 10 10 20 5 10 5 10 5 20 5 10 5 20 5 5 20 10 5 10 5 20 5 10 5 20 5 5 20 20 5 5 20 5 20 5 5 10 20 5 5 5 5 5 5 20 5 10 10 5 5 10 20 10 20 5 20 20 5 5 10 10 5 5 10 10 5 20 5 20 5 10 5 10 5 10 5 20 5 20 5 5 5 10 5 10 5 10 5 5 5 5 5 20 5 5 20 10 5 20 5 5 10 10 20 5 20 20 20 5 10 5 10 20 10 10 5 10 5 5 5 10 10 20 5 20 5 20 5 20 5 5 5 20 5 10 5 20 10 5 20 10 5 10 5 10 5 10 5 20 5 5 5 10 20 5 10 10 5 20 5 10 5 5 20 20 5 5 5 20 5 5 5 10 5 5 5 10 20 5 10 5 20 5 5 20 5 5 10 20 20 20 10 5 5 10 20 10 20 5 10 20 5 10 5 5 10 10 5 10 5 20 5 20 5 20 5 10 5 10 5 10 5 5 5 20 10 20 5 20 5 5 5 20 10 10 5 5 20 10 5 5 20 20 5 5 5 20 5 5 5 10 5 10 10 10 5 10 10 5 5 20 5 10 10 5 20 20 5 20 5 5 10 20 5 5 5 10 20 20 5 20 5 5 10 10 5 10 5 10 5 10 5 20 5 5 20 5 10 5 10 5 20 10 5 20 5 10 5 10 5 5 5 10 20 5 5 20 20 20 5 10 5 20 5 20 5 10 5 10 5 5 20 20 5 10 5 5 5 10 10 10 5 20 5 5 20 5 20 5 10 10 5 10 5 20 5 10 5 5 5 5 20 5 5 10 5 20 5 5 20 5 20 5 10 10 5 5 5 20 5 20 5 20 20 5 20 20 10 10 10 10 5 5 20 5 20 5 10 20 5 20 5 10 5 10 5 10 5 20 5 10 5 20 5 5 10 5 10 20 5 10 5 5 10 10 5 20 5 5 5 20 20 20 5 10 5 10 5 20 5 10 5 10 5 5 20 5 10 5 5 10 20 10 5 20 5 10 5 10 5 20 5 20 5 20 5 5 20 5 10 10 5 20 5 20 5 5 5 5 10 5 10 5 10 5 20 5 20 5 20 10 20 10 5 10 5 5 10 5 20 10 5 10 5 10 5 20 5 5 20 20 5 20 5 10 5 20 5 20 5 10 5 10 5 10 5 5 5 5 5 10 5 20 5 10 5 10 20 5 5 20 5 20 10 20 5 20 20 10 5 5 10 10 5 20 5 10 5 10 5 5 5 20 5 20 5 20 10 5 20 20 5 10 5 20 5 10 5 5 10 5 20 5 10 10 5 5 5 5 20 10 20 5 20 5 10 5 20 10 5 5 10 5 10 10 5 10 5 20 5 5 5 5 20 20 10 20 5 20 5 10 5 5 5 5 20 5 20 5 5 20 5 5 10 20 5 10 20 20 5 20 20 5 5 5 5 5 10 20 20 5 10 10 10 5 20 20 5 20 5 20 5 20 5 10 5 10 5 10 5 5 10 5 10 10 5 10 5 5 5 5 20 5 10 10 5 20 10 20 5 5 10 20 5 5 5 20 5 10 5 20 20 20 5 10 5 10 5 20 5 5 10 5 20 10 5 5 5 20 5 20 5 10 20 10 5 20 5 5 20 5 20 5 20 20 5 20 5 10 5 20 5 10 5 5 10 20 5 20 5 10 5 10 5 20 5 10 5 5 10 20 5 5 20 20 5 20 5 10 5 5 20 20 5 10 5 20 5 5 5 10 10 5 10 10 5 5 20 20 5 10 5 20 5 20 5 20 5 10 5 20 5 10 5 5 20 10 5 10 5 20 5 20 5 5 5 5 5 10 10 20 10 10 5 20 5 20 5 5 10 10 5 20 5 10 5 5 10 20 5 10 5 20 5 20 5 20 5 20 5 5 5 20 5 10 5 5 5 5 20 20 5 10 5 20 5 5 5 20 5 10 5 10 5 5 20 20 5 10 5 5 5 10 5 5 5 5 10 20 10 20 10 20 5 20 5 10 5 20 5 5 5 10 20 5 10 10 5 10 5 20 5 20 5 20 5 10 5 20 5 5 5 20 5 10 5 5 20 20 5 5 10 5 5 10 10 10 5 20 5 20 5 20 5 5 5 10 5 5 10 10 20 5 20 5 20 5 5 10 5 20 10 10 5 20 5 20 5 5 5 10 20 20 5 5 10 5 20 5 5 10",
        expected: "true",
      },
      {
        input:
          "5 10 5 20 5 10 5 5 10 5 20 5 10 10 5 20 5 20 5 5 20 10 5 5 5 5 10 20 10 20 5 20 5 5 5 5 10 10 5 20 5 5 5 10 10 20 10 20 5 10 5 5 5 20 20 20 5 10 5 20 5 10 5 5 10 10 5 5 20 5 20 20 5 5 10 10 5 20 5 20 5 10 5 20 5 5 10 10 5 20 5 5 10 20 5 5 10 20 5 10 5 20 5 20 5 5 10 20 5 10 5 20 5 5 10 10 5 5 20 10 5 10 5 10 5 20 5 5 20 5 5 10 5 10 5 10 5 20 5 10 10 5 5 10 20 10 5 5 10 5 5 10 20 10 5 5 10 20 5 20 5 20 5 5 20 20 5 10 5 20 5 5 20 5 20 5 10 20 5 5 10 20 5 20 5 10 5 10 5 10 5 5 10 5 5 20 20 10 5 10 5 20 5 10 5 20 5 20 5 10 5 10 5 10 5 10 5 20 5 20 5 10 5 5 10 5 5 20 5 10 20 5 20 10 5 5 5 10 10 10 5 5 10 5 20 5 20 10 5 10 5 20 5 20 5 20 5 20 5 20 5 5 5 10 5 10 10 10 5 20 5 5 5 5 10 10 5 5 10 10 5 10 5 10 20 5 10 5 20 10 5 20 5 20 5 10 5 10 5 20 5 10 5 20 5 5 20 20 5 20 5 5 10 5 20 5 5 20 10 20 5 10 5 5 5 20 20 10 5 20 5 20 5 20 5 5 20 5 5 10 10 20 5 20 5 10 5 10 5 5 5 20 20 20 5 20 5 5 10 20 5 10 5 10 5 5 20 5 5 10 20 20 5 10 5 20 5 20 5 10 5 5 5 20 5 5 5 5 10 20 10 5 5 10 10 10 5 5 10 5 10 20 5 10 10 10 5 10 5 5 5 20 20 20 5 10 5 20 5 10 5 5 20 5 20 10 5 20 5 10 5 20 5 5 10 10 5 20 5 20 5 5 10 20 5 5 5 20 20 20 5 10 5 10 5 10 5 5 20 20 5 5 20 20 5 10 5 20 5 10 5 20 5 5 10 10 5 20 5 5 5 5 20 5 10 5 5 5 20 20 20 20 5 5 20 10 20 5 5 10 20 5 5 5 20 5 10 10 5 10 5 20 5 20 5 10 5 5 5 10 10 20 5 10 5 10 5 20 5 10 5 20 5 5 20 10 5 10 5 20 5 10 5 20 5 5 20 20 5 5 20 5 20 5 5 10 20 5 5 5 5 5 5 20 5 10 10 5 5 10 20 10 20 5 20 20 5 5 10 10 5 5 10 10 5 20 5 20 5 10 5 10 5 10 5 20 5 20 5 5 5 10 5 10 5 10 5 5 5 5 5 20 5 5 20 10 5 20 5 5 10 10 20 5 20 20 20 5 10 5 10 20 10 10 5 10 5 5 5 10 10 20 5 20 5 20 5 20 5 5 5 20 5 10 5 20 10 5 20 10 5 10 5 10 5 10 5 20 5 5 5 10 20 5 10 10 5 20 5 10 5 5 20 20 5 5 5 20 5 5 5 10 5 5 5 10 20 5 10 5 20 5 5 20 5 5 10 20 20 20 10 5 5 10 20 10 20 5 10 20 5 10 5 5 10 10 5 10 5 20 5 20 5 20 5 10 5 10 5 10 5 5 5 20 10 20 5 20 5 5 5 20 10 10 5 5 20 10 5 5 20 20 5 5 5 20 5 5 5 10 5 10 10 10 5 10 10 5 5 20 5 10 10 5 20 20 5 20 5 5 10 20 5 5 5 10 20 20 5 20 5 5 10 10 5 10 5 10 5 10 5 20 5 5 20 5 10 5 10 5 20 10 5 20 5 10 5 10 5 5 5 10 20 5 5 20 20 20 5 10 5 20 5 20 5 10 5 10 5 5 20 20 5 10 5 5 5 10 10 10 5 20 5 5 20 5 20 5 10 10 5 10 5 20 5 10 5 5 5 5 20 5 5 10 5 20 5 5 20 5 20 5 10 10 5 5 5 20 5 20 5 20 20 5 20 20 10 10 10 10 5 5 20 5 20 5 10 20 5 20 5 10 5 10 5 10 5 20 5 10 5 20 5 5 10 5 10 20 5 10 5 5 10 10 5 20 5 5 5 20 20 20 5 10 5 10 5 20 5 10 5 10 5 5 20 5 10 5 5 10 20 10 5 20 5 10 5 10 5 20 5 20 5 20 5 5 20 5 10 10 5 20 5 20 5 5 5 5 10 5 10 5 10 5 20 5 20 5 20 10 20 10 5 10 5 5 10 5 20 10 5 10 5 10 5 20 5 5 20 20 5 20 5 10 5 20 5 20 5 10 5 10 5 10 5 5 5 5 5 10 5 20 5 10 5 10 20 5 5 20 5 20 10 20 5 20 20 10 5 5 10 10 5 20 5 10 5 10 5 5 5 20 5 20 5 20 10 5 20 20 5 10 5 20 5 10 5 5 10 5 20 5 10 10 5 5 5 5 20 10 20 5 20 5 10 5 20 10 5 5 10 5 10 10 5 10 5 20 5 5 5 5 20 20 10 20 5 20 5 10 5 5 5 5 20 5 20 5 5 20 5 5 10 20 5 10 20 20 5 20 20 5 5 5 5 5 10 20 20 5 10 10 10 5 20 20 5 20 5 20 5 20 5 10 5 10 5 10 5 5 10 5 10 10 5 10 5 5 5 5 20 5 10 10 5 20 10 20 5 5 10 20 5 5 5 20 5 10 5 20 20 20 5 10 5 10 5 20 5 5 10 5 20 10 5 5 5 20 5 20 5 10 20 10 5 20 5 5 20 5 20 5 20 20 5 20 5 10 5 20 5 10 5 5 10 20 5 20 5 10 5 10 5 20 5 10 5 5 10 20 5 5 20 20 5 20 5 10 5 5 20 20 5 10 5 20 5 5 5 10 10 5 10 10 5 5 20 20 5 10 5 20 5 20 5 20 5 10 5 20 5 10 5 5 20 10 5 10 5 20 5 20 5 5 5 5 5 10 10 20 10 10 5 20 5 20 5 5 10 10 5 20 5 10 5 5 10 20 5 10 5 20 5 20 5 20 5 20 5 5 5 20 5 10 5 5 5 5 20 20 5 10 5 20 5 5 5 20 5 10 5 10 5 5 20 20 5 10 5 5 5 10 5 5 5 5 10 20 10 20 10 20 5 20 5 10 5 20 5 5 5 10 20 5 10 10 5 10 5 20 5 20 5 20 5 10 5 20 5 5 5 20 5 10 5 5 20 20 5 5 10 5 5 10 10 10 5 20 5 20 5 20 5 5 5 10 5 5 10 10 20 5 20 5 20 5 5 10 5 20 10 10 5 20 5 20 5 5 5 10 20 20 5 5 10 5 20 5 5 10 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20 20",
        expected: "false",
      },
    ],
    hints: [
      "Twenty-coin notes are never useful as change. Which notes do you actually need to count?",
      "A 10 needs exactly one 5 back. A 20 needs 15 back, which can be made two different ways.",
      "Fives can make change for anything; tens can only help a 20. Which should you hand out first when you have a choice?",
      "For a 20, prefer 10 + 5 over 5 + 5 + 5 — it keeps the more flexible notes in the drawer.",
    ],
    solutions: [
      {
        title: "Optimal: count fives and tens, spend tens first",
        order: 1,
        intuition:
          "Only two quantities matter: how many fives and how many tens are in the drawer. When a 20 arrives there may be two ways to make 15. A ten is only ever good for breaking a 20, while a five can break a 10 or a 20 — so when both options exist, part with the ten. That choice can never leave you worse off than the alternative.",
        approach: [
          "Keep counters fives and tens, both 0.",
          "On a 5, add one five.",
          "On a 10, if there is no five return false; otherwise give a five back and keep the ten.",
          "On a 20, give back a ten and a five if you can; otherwise three fives if you can; otherwise return false.",
          "If the queue empties without a failure, return true.",
        ],
        code: {
          PYTHON: `def canGiveChange(payments: List[int]) -> bool:
    fives = 0
    tens = 0

    for note in payments:
        if note == 5:
            fives += 1
        elif note == 10:
            if fives == 0:
                return False
            fives -= 1
            tens += 1
        else:
            # 15 back: prefer 10 + 5, keeping fives which are more flexible.
            if tens > 0 and fives > 0:
                tens -= 1
                fives -= 1
            elif fives >= 3:
                fives -= 3
            else:
                return False

    return True`,
          JAVA: `class Solution {
    public boolean canGiveChange(int[] payments) {
        int fives = 0, tens = 0;

        for (int note : payments) {
            if (note == 5) {
                fives++;
            } else if (note == 10) {
                if (fives == 0) return false;
                fives--;
                tens++;
            } else {
                if (tens > 0 && fives > 0) {
                    tens--;
                    fives--;
                } else if (fives >= 3) {
                    fives -= 3;
                } else {
                    return false;
                }
            }
        }

        return true;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "The very first passenger pays with a 10 or a 20.",
          "Several tens in the drawer but no fives when a 20 arrives.",
        ],
        commonMistakes: [
          "Giving three fives for a 20 when a ten is available, which strands later 10-coin payers.",
          "Counting 20-coin notes as usable change.",
          "Checking only the total value in the drawer rather than which notes are in it.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "truck-unit-loading",
    title: "Loading the Supply Truck",
    difficulty: "EASY",
    learningObjective:
      "Recognise when items are divisible by count and the best-value-first greedy is provably optimal.",
    topics: ["greedy", "arrays"],
    patterns: ["greedy"],
    statement: [
      para(
        "A relief warehouse ships supplies in crates. The stock list has one row per kind of crate: how many crates of that kind are available, and how many ration units each of those crates holds."
      ),
      rich(
        "The truck can carry at most ",
        { code: "capacity" },
        " crates, of any mix of kinds. Return the most ration units it can carry."
      ),
      example(
        "stock = [[5, 10], [2, 5], [4, 7], [3, 9]], capacity = 10",
        "91",
        [
          { state: "kinds by units: 10, 9, 7, 5", note: "sort by value per crate" },
          { state: "take 5 crates × 10 = 50", note: "5 slots left" },
          { state: "take 3 crates × 9 = 27", note: "2 slots left" },
          { state: "take 2 crates × 7 = 14", note: "truck full: 50 + 27 + 14 = 91" },
        ],
        "Fill with the richest crates first"
      ),
    ],
    constraints: [
      "1 ≤ stock.length ≤ 1000",
      "Each row is [count, unitsPerCrate] with 1 ≤ count, unitsPerCrate ≤ 1000",
      "1 ≤ capacity ≤ 1000000",
    ],
    signature: {
      params: ["int[][]", "int"],
      paramNames: ["stock", "capacity"],
      returns: "int",
      functionName: "maxUnitsLoaded",
    },
    tests: [
      {
        input: "3\n1 3\n2 2\n3 1\n4",
        expected: "8",
        isSample: true,
        explanation:
          "Take the 3-unit crate, both 2-unit crates and one 1-unit crate: 3 + 4 + 1 = 8.",
      },
      {
        input: "4\n5 10\n2 5\n4 7\n3 9\n10",
        expected: "91",
        isSample: true,
        explanation: "50 + 27 + 14 = 91.",
      },
      {
        input: "1\n1 1\n1",
        expected: "1",
      },
      {
        input: "1\n2 5\n10",
        expected: "10",
      },
      {
        input: "2\n3 4\n3 4\n5",
        expected: "20",
      },
      {
        input: "3\n1 9\n1 1\n1 5\n2",
        expected: "14",
      },
      {
        input: "1\n10 1\n3",
        expected: "3",
      },
      {
        input:
          "1000\n860 543\n328 924\n480 134\n682 688\n414 244\n730 576\n40 761\n733 934\n296 216\n475 230\n881 143\n466 409\n711 839\n22 1000\n644 294\n423 396\n654 449\n256 996\n374 264\n414 853\n376 569\n169 405\n95 965\n546 662\n28 397\n101 689\n367 725\n8 445\n9 589\n510 277\n352 2\n354 402\n731 68\n544 62\n349 163\n276 525\n426 198\n796 863\n879 471\n822 981\n374 146\n974 854\n774 589\n740 364\n362 423\n352 818\n986 101\n99 812\n185 290\n598 628\n736 920\n965 582\n371 604\n433 207\n150 203\n542 645\n847 583\n406 871\n929 919\n353 695\n338 476\n570 457\n140 11\n155 857\n535 348\n107 877\n541 827\n712 167\n975 116\n849 954\n861 778\n134 387\n597 632\n645 663\n542 409\n921 756\n320 434\n189 290\n245 720\n841 595\n545 427\n321 230\n73 919\n626 972\n961 343\n449 246\n140 539\n126 145\n100 39\n467 625\n160 567\n263 369\n877 756\n874 993\n234 852\n952 628\n468 356\n780 600\n357 913\n731 379\n565 908\n794 528\n351 165\n714 872\n636 930\n177 370\n743 974\n643 993\n355 626\n804 574\n366 283\n323 473\n45 407\n202 349\n937 777\n897 588\n808 498\n436 582\n301 753\n75 131\n696 711\n580 40\n572 410\n398 473\n458 705\n591 296\n257 438\n138 601\n318 300\n417 691\n254 420\n511 449\n503 358\n982 380\n130 86\n874 181\n426 631\n73 892\n513 784\n373 116\n679 359\n961 841\n97 113\n959 925\n502 926\n705 957\n156 720\n759 558\n69 199\n77 88\n436 293\n158 346\n570 368\n472 91\n743 310\n496 199\n18 754\n863 474\n85 470\n634 956\n796 360\n664 804\n205 541\n416 431\n138 60\n982 346\n486 457\n310 794\n721 532\n999 869\n937 559\n294 495\n985 420\n507 36\n359 580\n924 917\n830 559\n42 181\n150 367\n243 942\n190 158\n368 858\n741 309\n49 479\n541 648\n198 211\n518 542\n594 953\n209 650\n772 645\n595 997\n731 468\n57 499\n805 134\n342 139\n454 489\n475 53\n479 65\n874 21\n730 661\n976 119\n485 946\n488 212\n118 148\n291 54\n313 878\n422 707\n539 882\n671 951\n679 336\n890 655\n336 68\n739 602\n483 240\n599 68\n622 896\n173 314\n346 454\n910 182\n76 630\n944 17\n957 111\n605 366\n830 62\n6 968\n214 909\n949 1000\n470 318\n987 873\n489 130\n898 572\n720 405\n459 50\n190 274\n470 483\n798 376\n721 142\n99 484\n665 98\n97 269\n170 693\n321 213\n792 32\n71 198\n311 624\n43 619\n67 581\n971 327\n675 757\n488 913\n229 990\n107 583\n849 921\n26 636\n485 105\n977 600\n505 419\n496 422\n604 783\n435 389\n134 625\n188 755\n478 35\n661 63\n511 166\n999 504\n439 191\n698 497\n481 136\n886 27\n420 635\n407 221\n584 419\n582 353\n470 983\n356 136\n99 902\n574 400\n551 995\n99 80\n216 151\n280 792\n999 29\n766 857\n804 609\n260 366\n9 693\n362 84\n45 411\n761 748\n452 883\n396 634\n99 738\n427 698\n211 701\n679 652\n64 848\n808 718\n576 475\n194 438\n789 287\n440 510\n334 633\n317 801\n749 312\n303 504\n171 384\n770 496\n466 246\n871 490\n679 991\n640 481\n36 659\n636 452\n310 485\n873 670\n357 699\n481 703\n62 535\n703 573\n519 124\n482 353\n677 412\n519 775\n253 914\n990 971\n42 991\n605 44\n551 455\n513 62\n516 343\n101 326\n628 887\n282 756\n541 89\n67 228\n340 670\n266 186\n587 864\n935 297\n689 41\n25 122\n715 827\n96 462\n737 108\n267 579\n430 91\n599 497\n248 668\n846 921\n180 664\n40 138\n284 860\n352 389\n572 472\n245 538\n227 265\n13 797\n861 75\n581 863\n539 136\n924 623\n479 981\n223 766\n108 621\n138 800\n424 493\n510 218\n882 6\n243 393\n182 521\n379 857\n307 522\n164 666\n852 135\n163 910\n219 232\n495 998\n304 422\n896 853\n536 648\n390 103\n93 560\n217 838\n939 192\n324 717\n570 155\n801 853\n502 458\n720 152\n628 304\n461 566\n84 597\n871 655\n217 414\n249 881\n919 546\n321 649\n616 906\n920 715\n501 28\n643 922\n659 592\n36 955\n745 126\n380 609\n60 984\n767 371\n299 811\n382 401\n850 501\n768 865\n196 258\n234 111\n556 250\n605 981\n924 304\n696 80\n386 337\n282 982\n815 540\n201 754\n270 15\n561 26\n465 714\n31 102\n215 292\n423 768\n134 134\n789 377\n875 708\n323 400\n76 406\n313 7\n690 669\n125 656\n332 201\n388 854\n351 1\n186 378\n318 772\n817 211\n995 111\n971 116\n878 167\n318 785\n483 3\n301 137\n756 633\n987 15\n7 707\n307 341\n269 953\n711 272\n188 540\n792 342\n372 920\n382 489\n245 878\n643 203\n200 142\n832 433\n786 225\n648 776\n642 7\n767 609\n893 763\n623 366\n472 92\n174 435\n97 330\n147 673\n797 928\n572 32\n162 864\n232 253\n865 28\n869 870\n112 792\n484 588\n202 540\n51 256\n262 560\n466 30\n979 452\n469 24\n155 346\n894 23\n400 394\n792 944\n568 988\n241 356\n391 669\n240 168\n837 337\n306 638\n838 202\n657 694\n177 746\n131 538\n509 568\n219 34\n107 393\n564 12\n317 210\n151 428\n18 429\n290 295\n697 133\n627 660\n71 374\n857 581\n676 827\n117 246\n141 549\n604 573\n982 629\n868 556\n710 621\n640 924\n197 507\n60 629\n445 959\n467 278\n283 85\n908 558\n538 971\n887 357\n433 706\n117 408\n116 471\n206 432\n854 923\n781 520\n793 668\n988 810\n636 39\n403 405\n347 14\n331 317\n384 879\n710 448\n199 971\n904 930\n490 955\n210 545\n978 718\n191 435\n63 801\n663 149\n119 826\n120 124\n591 520\n76 436\n390 563\n118 535\n311 477\n176 898\n873 945\n588 642\n705 737\n361 135\n431 470\n786 941\n762 190\n94 749\n230 272\n825 691\n760 350\n776 182\n650 793\n20 26\n754 800\n419 856\n340 118\n481 170\n255 453\n161 447\n268 767\n728 199\n647 420\n698 897\n267 726\n810 514\n767 287\n735 946\n712 518\n215 817\n560 740\n523 302\n121 622\n523 620\n327 452\n92 219\n495 438\n972 464\n221 527\n259 518\n586 848\n874 223\n642 711\n124 761\n710 502\n203 207\n785 837\n442 973\n851 890\n879 407\n545 1\n181 670\n369 673\n804 937\n263 194\n19 798\n877 473\n346 635\n275 765\n650 462\n649 477\n122 113\n550 366\n34 830\n761 428\n390 708\n196 817\n40 842\n474 848\n586 488\n957 92\n140 686\n451 976\n180 462\n551 855\n326 908\n372 158\n359 982\n529 432\n455 600\n195 313\n898 609\n707 412\n654 651\n943 229\n849 886\n892 549\n5 123\n139 728\n545 489\n973 122\n320 724\n903 524\n734 148\n820 962\n976 14\n760 401\n154 683\n499 503\n309 100\n960 62\n422 153\n569 591\n122 78\n687 480\n986 542\n529 385\n273 636\n149 334\n600 35\n463 556\n738 116\n131 6\n175 46\n878 103\n434 566\n197 69\n598 830\n340 458\n33 170\n367 93\n484 71\n134 287\n461 390\n514 478\n288 396\n799 903\n133 647\n880 21\n214 344\n991 191\n461 183\n522 47\n941 71\n209 161\n721 1\n510 211\n919 866\n521 200\n77 934\n608 237\n185 914\n143 6\n752 427\n129 685\n514 228\n746 939\n723 490\n603 241\n517 350\n593 174\n620 795\n93 678\n376 448\n138 712\n982 677\n665 349\n565 492\n138 219\n929 632\n734 661\n300 108\n770 677\n770 525\n787 595\n352 54\n70 528\n971 767\n889 813\n968 331\n813 749\n453 782\n947 715\n311 17\n497 320\n644 851\n365 5\n386 612\n325 271\n843 471\n688 2\n178 282\n401 503\n729 44\n820 615\n934 697\n289 147\n986 351\n30 892\n938 774\n562 891\n154 4\n188 685\n590 77\n583 19\n409 477\n29 941\n957 724\n55 23\n597 838\n962 971\n467 113\n377 341\n201 504\n131 150\n257 317\n842 412\n461 574\n420 837\n422 301\n921 538\n361 885\n603 244\n266 583\n639 926\n820 994\n835 334\n654 674\n462 920\n959 319\n696 210\n746 786\n750 755\n163 449\n681 274\n705 683\n25 257\n77 949\n758 230\n213 572\n10 783\n780 837\n921 39\n517 683\n324 731\n120 590\n714 461\n705 728\n465 827\n958 880\n809 850\n115 810\n158 472\n216 536\n714 120\n205 450\n617 640\n950 47\n729 636\n60 84\n750 366\n697 925\n316 354\n599 255\n649 184\n688 244\n352 330\n704 462\n773 36\n849 86\n542 600\n622 801\n973 493\n57 97\n956 646\n516 563\n806 285\n930 987\n877 949\n652 35\n757 623\n870 126\n247 108\n376 540\n671 681\n265 913\n738 590\n285 102\n715 997\n785 79\n219 398\n964 658\n860 159\n945 740\n966 13\n551 145\n402 80\n598 748\n233 564\n815 265\n918 970\n298 503\n545 835\n194 775\n729 442\n76 920\n708 909\n747 947\n812 690\n814 14\n418 829\n206 270\n310 765\n371 682\n388 642\n721 989\n798 803\n1 712\n404 40\n70 292\n809 589\n323 793\n179 485\n260 322\n467 889\n854 355\n306 698\n440 877\n649 32\n529 824\n844 193\n991 616\n157 207\n2 94\n950 212\n51 679\n876 332\n177 562\n921 612\n452 551\n100 977\n620 357\n903 57\n360 381\n180 855\n963 356\n756 375\n12 705\n79 895\n150 374\n657 522\n14 561\n676 20\n630 258\n938 388\n798 540\n367 694\n24 303\n972 42\n194 987\n102 842\n932 439\n906 657\n566 353\n435 844\n676 294\n574 207\n54 226\n257 92\n856 684\n5 841\n933 36\n761 661\n36 944\n473 599\n785 378\n381 321\n216 714\n722 57\n530 24\n294 708\n978 965\n685 27\n98 678\n824 212\n42 343\n187 141\n960 100\n973 752\n255 206\n892 308\n824 729\n798 737\n531 205\n739 586\n736 414\n389 892\n810 850\n980 276\n572 143\n997 447\n512 584\n360 632\n92 497\n687 988\n507 519\n671 134\n221 708\n274 949\n23 149\n445 265\n368 803\n649 567\n927 819\n616 853\n254 206\n362 42\n473 724\n851 45\n646 699\n701 359\n824 34\n610 817\n39 160\n830 978\n359 968\n40 9\n920 824\n842 574\n516 259\n687 428\n75 45\n609 218\n949 524\n560 563\n37 32\n705 514\n471 30\n359 958\n572 244\n533 78\n136 700\n95 771\n318 340\n662 22\n592 712\n317 447\n323 994\n681 239\n499 542\n964 666\n909 841\n250000",
        expected: "186883324",
      },
    ],
    hints: [
      "Every crate costs the same — one slot on the truck. What makes one crate better than another?",
      "If a slot holds a 5-unit crate while a 9-unit crate is left behind, can you improve the load?",
      "Sort the kinds by units per crate, descending, and take as many of each as still fit.",
    ],
    solutions: [
      {
        title: "Pick the best remaining kind, one round at a time",
        order: 1,
        intuition:
          "Each slot should hold the richest crate still available. Without sorting, we can find the richest remaining kind by scanning the list every time, load as many of it as fit, and repeat.",
        approach: [
          "Copy the counts so they can be used up.",
          "While there is room, scan all kinds for the highest units per crate with crates remaining.",
          "Load min(count, room) of them and reduce room.",
          "Stop when the truck is full or no crates are left.",
        ],
        code: {
          PYTHON: `def maxUnitsLoaded(stock: List[List[int]], capacity: int) -> int:
    left = [count for count, _ in stock]
    room = capacity
    total = 0

    while room > 0:
        best = -1
        for k, (_, units) in enumerate(stock):
            if left[k] > 0 and (best == -1 or units > stock[best][1]):
                best = k
        if best == -1:
            break
        take = min(left[best], room)
        total += take * stock[best][1]
        room -= take
        left[best] = 0

    return total`,
          JAVA: `class Solution {
    public int maxUnitsLoaded(int[][] stock, int capacity) {
        int[] left = new int[stock.length];
        for (int k = 0; k < stock.length; k++) left[k] = stock[k][0];
        int room = capacity;
        int total = 0;

        while (room > 0) {
            int best = -1;
            for (int k = 0; k < stock.length; k++) {
                if (left[k] > 0 && (best == -1 || stock[k][1] > stock[best][1])) best = k;
            }
            if (best == -1) break;
            int take = Math.min(left[best], room);
            total += take * stock[best][1];
            room -= take;
            left[best] = 0;
        }
        return total;
    }
}`,
        },
        timeComplexity: "O(k²) for k kinds",
        spaceComplexity: "O(k)",
        edgeCases: ["Capacity larger than the total number of crates."],
        commonMistakes: ["Looping one crate at a time, which is O(capacity · k)."],
      },
      {
        title: "Optimal: sort kinds by value, fill greedily",
        order: 2,
        intuition:
          "All crates occupy one slot, so the problem is simply: choose the capacity most valuable crates. Sorting kinds by units per crate puts them in exactly the order a careful loader would pick, and whole groups can be taken in one step.",
        approach: [
          "Sort the rows by unitsPerCrate, highest first.",
          "For each kind, take min(count, room) crates and add their units.",
          "Reduce room and stop once it reaches zero.",
        ],
        code: {
          PYTHON: `def maxUnitsLoaded(stock: List[List[int]], capacity: int) -> int:
    total = 0
    room = capacity

    for count, units in sorted(stock, key=lambda row: -row[1]):
        take = min(count, room)
        total += take * units
        room -= take
        if room == 0:
            break

    return total`,
          JAVA: `class Solution {
    public int maxUnitsLoaded(int[][] stock, int capacity) {
        int[][] kinds = stock.clone();
        Arrays.sort(kinds, (a, b) -> Integer.compare(b[1], a[1]));

        int total = 0;
        int room = capacity;
        for (int[] kind : kinds) {
            int take = Math.min(kind[0], room);
            total += take * kind[1];
            room -= take;
            if (room == 0) break;
        }
        return total;
    }
}`,
        },
        timeComplexity: "O(k log k)",
        spaceComplexity: "O(k)",
        edgeCases: [
          "The truck holds more crates than exist — every crate is loaded.",
          "Two kinds with identical value per crate — order between them does not matter.",
        ],
        commonMistakes: [
          "Sorting by count or by count × units instead of units per crate.",
          "Forgetting to stop when room hits zero, then multiplying by a negative remainder.",
        ],
      },
    ],
    expectedTime: "O(k log k)",
    expectedSpace: "O(k)",
  },

  {
    slug: "attend-every-meeting",
    title: "One Calendar, No Clashes",
    difficulty: "EASY",
    learningObjective:
      "Sort intervals by start so that any overlap must show up between neighbours, turning a pairwise check into a linear scan.",
    topics: ["intervals", "arrays"],
    patterns: ["merge-intervals"],
    statement: [
      para(
        "A consultant has been sent a list of meeting requests. Each request is a row [start, end] in minutes; a meeting occupies the time from start up to, but not including, end. The consultant can only be in one meeting at a time."
      ),
      rich(
        "Return ",
        { code: "true" },
        " if all requested meetings can be attended. A meeting that starts at the exact minute another ends does not clash with it."
      ),
      example(
        "meetings = [[1, 4], [6, 8], [3, 5]]",
        "false",
        [
          { state: "[1,4] [3,5] [6,8]", note: "sorted by start" },
          {
            state: "[1,4] vs [3,5]",
            note: "3 < 4 — the second starts before the first ends",
          },
        ],
        "Only neighbours need comparing"
      ),
    ],
    constraints: ["0 ≤ meetings.length ≤ 10000", "0 ≤ start < end ≤ 1000000"],
    signature: {
      params: ["int[][]"],
      paramNames: ["meetings"],
      returns: "bool",
      functionName: "canAttendAll",
    },
    tests: [
      {
        input: "3\n9 10\n13 15\n10 12",
        expected: "true",
        isSample: true,
        explanation:
          "Sorted: [9,10], [10,12], [13,15]. The first two only share a boundary.",
      },
      {
        input: "3\n1 4\n6 8\n3 5",
        expected: "false",
        isSample: true,
        explanation: "[3,5] starts before [1,4] ends.",
      },
      {
        input: "0",
        expected: "true",
      },
      {
        input: "1\n5 6",
        expected: "true",
      },
      {
        input: "2\n1 2\n2 3",
        expected: "true",
      },
      {
        input: "2\n1 5\n2 3",
        expected: "false",
      },
      {
        input: "3\n0 10\n10 20\n5 6",
        expected: "false",
      },
      {
        input:
          "900\n1740 1742\n877 882\n1004 1006\n2919 2924\n3617 3621\n2396 2401\n560 561\n1624 1629\n3326 3329\n607 608\n223 224\n2285 2287\n2265 2266\n93 94\n677 682\n3895 3896\n3197 3201\n3 8\n1867 1872\n3164 3166\n2692 2697\n1617 1618\n2088 2093\n3789 3794\n56 58\n3621 3625\n2779 2782\n2191 2192\n446 447\n1352 1355\n1371 1375\n2306 2310\n3590 3594\n1084 1086\n3089 3091\n3643 3647\n1017 1019\n403 406\n3173 3176\n2258 2263\n2027 2030\n631 633\n421 422\n3287 3291\n2211 2212\n3236 3241\n3263 3268\n2377 2378\n3415 3418\n1113 1115\n3046 3051\n2915 2919\n2376 2377\n2272 2273\n2350 2352\n2080 2082\n3868 3872\n3129 3130\n1749 1751\n3051 3054\n3529 3532\n74 76\n523 528\n2580 2582\n2162 2166\n980 983\n3721 3726\n306 308\n3017 3021\n1831 1833\n120 122\n1466 1470\n2008 2010\n1037 1042\n1506 1511\n3911 3912\n3035 3036\n48 50\n1101 1104\n1726 1730\n1983 1985\n2230 2232\n3024 3028\n2814 2815\n3229 3232\n2031 2033\n2657 2662\n148 150\n2992 2995\n1590 1594\n2336 2337\n190 192\n2675 2680\n3822 3826\n2471 2473\n1710 1715\n3760 3765\n2066 2070\n1956 1957\n2977 2979\n1875 1880\n3648 3650\n301 305\n3421 3423\n487 491\n2556 2561\n650 654\n377 381\n1056 1061\n3872 3873\n961 964\n2721 2726\n2567 2568\n1786 1791\n296 297\n2508 2511\n2534 2535\n1681 1684\n109 114\n3466 3469\n1947 1950\n2825 2830\n1607 1608\n493 495\n717 722\n1827 1830\n1156 1161\n794 797\n1177 1178\n2966 2968\n1589 1590\n284 286\n3684 3689\n3550 3554\n3104 3109\n1733 1735\n1284 1285\n519 523\n936 939\n1168 1171\n429 430\n3689 3694\n117 119\n278 280\n2848 2849\n3820 3821\n1392 1397\n1550 1552\n1754 1757\n2221 2222\n25 28\n270 275\n218 223\n2632 2637\n2058 2060\n1232 1236\n3203 3205\n3517 3522\n479 480\n3785 3788\n2938 2939\n1125 1130\n3881 3885\n449 452\n648 650\n2703 2704\n1258 1263\n825 828\n3307 3310\n2782 2786\n818 823\n685 687\n508 513\n1050 1053\n1873 1874\n3943 3946\n3461 3466\n976 980\n1986 1988\n1844 1846\n782 785\n930 935\n63 67\n1993 1996\n153 155\n3078 3081\n1498 1500\n322 323\n848 852\n1252 1253\n2407 2411\n3489 3493\n345 349\n1164 1165\n2890 2892\n540 543\n127 128\n2139 2142\n745 747\n2388 2389\n1608 1610\n2247 2248\n2236 2241\n2939 2941\n895 899\n2018 2020\n3193 3197\n453 456\n2823 2825\n1678 1680\n2936 2937\n999 1003\n3331 3336\n2988 2989\n3584 3588\n15 20\n2845 2848\n2456 2461\n3745 3750\n3450 3455\n2303 2306\n1009 1011\n1450 1452\n2697 2701\n892 894\n700 702\n531 533\n1484 1488\n3969 3971\n1178 1182\n3908 3909\n2598 2602\n1454 1459\n1196 1200\n3861 3863\n2969 2970\n3771 3773\n939 941\n1296 1298\n152 153\n2811 2813\n1086 1090\n3934 3939\n3850 3853\n339 343\n3668 3673\n2439 2442\n3481 3484\n2741 2742\n1555 1558\n2980 2985\n3136 3138\n3036 3039\n2355 2356\n496 500\n1808 1813\n2109 2111\n2051 2054\n2665 2668\n40 41\n884 885\n3116 3119\n1216 1218\n1587 1588\n905 908\n2293 2296\n899 902\n2527 2531\n1920 1924\n668 671\n245 247\n2097 2102\n3472 3474\n1382 1387\n1511 1513\n1903 1906\n3611 3614\n3008 3009\n623 626\n1151 1154\n188 190\n2858 2863\n2864 2866\n2158 2160\n1501 1503\n2881 2885\n1357 1362\n845 848\n536 537\n3841 3842\n3260 3263\n2086 2088\n3337 3339\n2126 2131\n598 599\n1397 1399\n330 332\n2604 2606\n1798 1800\n698 699\n3254 3259\n2214 2219\n3147 3151\n989 992\n22 25\n418 420\n2503 2507\n2759 2760\n741 742\n716 717\n1651 1654\n3875 3880\n3609 3610\n2852 2855\n2280 2284\n382 387\n2118 2119\n1836 1837\n3598 3601\n1834 1835\n3539 3541\n2562 2567\n230 233\n104 109\n3400 3405\n1428 1433\n3277 3279\n142 147\n3892 3895\n957 958\n1074 1075\n1190 1195\n1744 1745\n1022 1027\n1131 1136\n3001 3006\n207 208\n3398 3399\n1793 1798\n3143 3147\n3485 3489\n165 168\n2302 2303\n235 238\n1866 1867\n690 695\n3469 3471\n3296 3300\n2150 2151\n2426 2428\n61 63\n3023 3024\n3339 3342\n984 986\n838 843\n1224 1229\n1915 1920\n1077 1079\n557 559\n1477 1479\n431 435\n3434 3436\n2443 2448\n3069 3074\n3709 3711\n1032 1036\n1745 1747\n2132 2136\n436 438\n1424 1427\n1243 1244\n1270 1272\n1642 1646\n1908 1912\n1685 1687\n1279 1281\n3177 3181\n1689 1694\n947 949\n2592 2594\n1890 1892\n481 484\n423 427\n3898 3902\n2488 2492\n2056 2058\n2145 2149\n2579 2580\n3493 3498\n780 781\n3215 3219\n3738 3739\n1355 1356\n671 676\n372 375\n2756 2759\n2701 2702\n2792 2796\n919 923\n1965 1968\n915 919\n2929 2934\n1597 1599\n439 444\n552 553\n1411 1413\n3357 3361\n2650 2655\n2925 2929\n3153 3155\n2639 2644\n3208 3212\n3365 3366\n1254 1255\n1326 1331\n949 953\n3863 3866\n972 976\n99 102\n636 640\n3367 3370\n3439 3440\n2311 2316\n2012 2015\n2769 2774\n2498 2499\n2761 2766\n161 164\n2479 2481\n3556 3560\n2096 2097\n2985 2987\n3122 3126\n2210 2211\n3698 3703\n1415 1417\n2582 2585\n3626 3630\n1694 1697\n2379 2381\n1104 1108\n1880 1884\n1321 1324\n1334 1339\n3845 3848\n580 584\n785 790\n2739 2741\n1999 2000\n3921 3924\n1445 1450\n2871 2874\n1777 1778\n2418 2420\n460 462\n1310 1311\n2945 2949\n2462 2467\n2234 2235\n2154 2157\n3579 3583\n2538 2542\n3939 3940\n2807 2808\n547 549\n3753 3757\n3766 3770\n1494 1496\n3930 3931\n2045 2050\n3411 3415\n2044 2045\n257 260\n1364 1369\n1704 1707\n1588 1589\n537 539\n2609 2610\n35 36\n1489 1493\n2775 2778\n3796 3801\n2867 2871\n2082 2083\n1565 1570\n2123 2126\n2616 2619\n3731 3733\n174 175\n3377 3380\n2337 2341\n155 160\n3131 3136\n2475 2479\n3679 3683\n2493 2496\n724 728\n2620 2621\n2414 2417\n3312 3315\n1399 1400\n20 22\n3740 3742\n3063 3067\n2449 2454\n887 892\n1291 1295\n2326 2331\n208 212\n1479 1484\n1096 1101\n2482 2487\n2808 2811\n3704 3707\n2203 2206\n1301 1304\n1663 1666\n3596 3598\n194 196\n1900 1903\n1346 1351\n544 546\n398 403\n2186 2191\n2832 2834\n1575 1580\n874 876\n1544 1548\n2535 2538\n2112 2117\n169 171\n362 366\n2288 2293\n3372 3374\n52 56\n2684 2689\n3972 3976\n1718 1719\n3812 3814\n3303 3305\n2121 2123\n357 359\n3437 3438\n3604 3607\n3279 3281\n3029 3030\n836 838\n2002 2006\n3300 3302\n810 815\n1161 1163\n902 904\n1672 1676\n829 833\n2552 2554\n530 531\n1963 1964\n2517 2521\n241 243\n134 139\n705 708\n2020 2024\n858 862\n77 82\n3833 3838\n2818 2820\n2310 2311\n1631 1634\n84 87\n2645 2647\n3158 3163\n2223 2227\n736 738\n394 395\n3075 3076\n2499 2502\n1768 1769\n564 569\n3225 3226\n2613 2614\n3284 3285\n2033 2036\n953 955\n2669 2674\n1951 1953\n1316 1320\n2421 2423\n1266 1269\n3602 3603\n3498 3500\n324 328\n3475 3479\n1237 1240\n3085 3088\n3952 3953\n2804 2806\n3349 3354\n2323 2324\n3506 3511\n1045 1048\n1409 1410\n2835 2840\n555 557\n1418 1423\n1582 1584\n1656 1660\n611 616\n1940 1941\n1514 1516\n3856 3859\n1137 1140\n2568 2571\n2206 2207\n2299 2300\n3241 3244\n1167 1168\n3502 3506\n1886 1888\n2796 2798\n2061 2063\n2595 2596\n664 665\n3656 3659\n458 460\n2169 2172\n3714 3716\n2039 2044\n3948 3950\n2708 2709\n629 630\n1601 1605\n1856 1859\n3726 3728\n369 370\n2243 2247\n503 507\n263 265\n3041 3043\n1928 1929\n389 392\n465 470\n3099 3102\n1860 1865\n2886 2889\n1559 1564\n1822 1824\n853 855\n1688 1689\n67 68\n3447 3449\n414 417\n474 477\n2319 2320\n3321 3325\n317 322\n268 269\n968 969\n2732 2737\n3093 3098\n2367 2370\n559 560\n585 587\n3060 3061\n2359 2360\n250 254\n2751 2755\n2629 2631\n335 338\n1976 1981\n2587 2591\n213 216\n1079 1082\n2895 2898\n3829 3831\n3427 3431\n41 45\n1441 1443\n1801 1806\n3562 3564\n1735 1739\n1815 1819\n1203 1205\n749 750\n2704 2705\n3817 3818\n2961 2963\n2820 2822\n3572 3577\n1647 1651\n1924 1927\n2951 2953\n3954 3957\n3245 3246\n2913 2915\n2602 2604\n2743 2746\n588 592\n3381 3386\n1307 1310\n2300 2302\n39 40\n514 519\n3781 3784\n1067 1071\n3389 3391\n943 947\n31 34\n94 99\n2523 2527\n3733 3737\n2073 2077\n866 869\n1722 1726\n2266 2270\n2799 2800\n3535 3537\n1669 1672\n1206 1209\n2998 3000\n2362 2367\n1619 1623\n11 12\n1758 1763\n2209 2210\n641 646\n3084 3085\n2384 2387\n2390 2395\n3915 3920\n1988 1991\n770 772\n1287 1288\n2332 2333\n3803 3804\n3694 3696\n3274 3277\n3442 3444\n2274 2277\n1092 1094\n1173 1177\n2726 2730\n804 809\n1147 1149\n1634 1638\n3220 3224\n2545 2549\n2102 2106\n3637 3640\n3805 3810\n3660 3662\n2710 2713\n908 913\n1892 1897\n2786 2791\n3664 3667\n3235 3236\n471 473\n281 283\n3773 3777\n3885 3890\n3393 3395\n2180 2185\n3317 3318\n1839 1843\n3675 3678\n1772 1775\n470 471\n3152 3153\n2467 2469\n2840 2843\n3512 3516\n2875 2879\n3291 3294\n1776 1777\n3615 3617\n1013 1014\n729 733\n790 791\n1970 1975\n3056 3057\n3957 3962\n2371 2374\n2173 2177\n1536 1541\n2680 2683\n2195 2200\n3456 3458\n923 927\n1313 1316\n753 754\n865 866\n1517 1521\n2149 2150\n1531 1535\n773 778\n2343 2347\n764 765\n2514 2517\n1763 1768\n3554 3556\n3903 3906\n1779 1784\n1470 1475\n1611 1615\n768 769\n3777 3781\n3544 3546\n2973 2975\n3012 3014\n3269 3272\n1932 1937\n1638 1640\n3419 3421\n310 315\n130 134\n197 199\n2403 2405\n965 966\n3652 3655\n502 503\n1849 1854\n3183 3185\n3424 3425\n995 997\n1218 1222\n3343 3347\n3138 3140\n184 188\n798 803\n1452 1454\n3926 3929\n3567 3570\n3362 3364\n569 571\n2622 2627\n200 205\n1340 1344\n2716 2721\n1960 1962\n289 293\n68 73\n1011 1013\n1247 1250\n1402 1406\n225 227\n2907 2910\n869 873\n1524 1529\n1109 1112\n3547 3548\n1298 1301\n2748 2751\n1433 1438\n178 183\n2803 2804\n3525 3526\n1183 1187\n2956 2960\n3166 3170\n2435 2436\n3631 3635\n1388 1390\n572 577\n710 713\n3718 3719\n1028 1031\n1376 1381\n297 298\n1459 1464\n1118 1123\n3347 3348\n1212 1215\n3405 3410\n1062 1067\n617 622\n656 661\n408 412\n3964 3967\n1942 1945\n3188 3192\n2943 2945\n561 564\n2430 2434\n594 595\n2900 2905\n89 92\n3030 3033\n2251 2256\n1143 1144\n287 288\n3110 3114\n3248 3251\n123 126\n1274 1277\n2573 2576\n1698 1702\n602 604\n1571 1574\n757 762\n350 355",
        expected: "true",
      },
      {
        input:
          "901\n1740 1742\n877 882\n1004 1006\n2919 2924\n3617 3621\n2396 2401\n560 561\n1624 1629\n3326 3329\n607 608\n223 224\n2285 2287\n2265 2266\n93 94\n677 682\n3895 3896\n3197 3201\n3 8\n1867 1872\n3164 3166\n2692 2697\n1617 1618\n2088 2093\n3789 3794\n56 58\n3621 3625\n2779 2782\n2191 2192\n446 447\n1352 1355\n1371 1375\n2306 2310\n3590 3594\n1084 1086\n3089 3091\n3643 3647\n1017 1019\n403 406\n3173 3176\n2258 2263\n2027 2030\n631 633\n421 422\n3287 3291\n2211 2212\n3236 3241\n3263 3268\n2377 2378\n3415 3418\n1113 1115\n3046 3051\n2915 2919\n2376 2377\n2272 2273\n2350 2352\n2080 2082\n3868 3872\n3129 3130\n1749 1751\n3051 3054\n3529 3532\n74 76\n523 528\n2580 2582\n2162 2166\n980 983\n3721 3726\n306 308\n3017 3021\n1831 1833\n120 122\n1466 1470\n2008 2010\n1037 1042\n1506 1511\n3911 3912\n3035 3036\n48 50\n1101 1104\n1726 1730\n1983 1985\n2230 2232\n3024 3028\n2814 2815\n3229 3232\n2031 2033\n2657 2662\n148 150\n2992 2995\n1590 1594\n2336 2337\n190 192\n2675 2680\n3822 3826\n2471 2473\n1710 1715\n3760 3765\n2066 2070\n1956 1957\n2977 2979\n1875 1880\n3648 3650\n301 305\n3421 3423\n487 491\n2556 2561\n650 654\n377 381\n1056 1061\n3872 3873\n961 964\n2721 2726\n2567 2568\n1786 1791\n296 297\n2508 2511\n2534 2535\n1681 1684\n109 114\n3466 3469\n1947 1950\n2825 2830\n1607 1608\n493 495\n717 722\n1827 1830\n1156 1161\n794 797\n1177 1178\n2966 2968\n1589 1590\n284 286\n3684 3689\n3550 3554\n3104 3109\n1733 1735\n1284 1285\n519 523\n936 939\n1168 1171\n429 430\n3689 3694\n117 119\n278 280\n2848 2849\n3820 3821\n1392 1397\n1550 1552\n1754 1757\n2221 2222\n25 28\n270 275\n218 223\n2632 2637\n2058 2060\n1232 1236\n3203 3205\n3517 3522\n479 480\n3785 3788\n2938 2939\n1125 1130\n3881 3885\n449 452\n648 650\n2703 2704\n1258 1263\n825 828\n3307 3310\n2782 2786\n818 823\n685 687\n508 513\n1050 1053\n1873 1874\n3943 3946\n3461 3466\n976 980\n1986 1988\n1844 1846\n782 785\n930 935\n63 67\n1993 1996\n153 155\n3078 3081\n1498 1500\n322 323\n848 852\n1252 1253\n2407 2411\n3489 3493\n345 349\n1164 1165\n2890 2892\n540 543\n127 128\n2139 2142\n745 747\n2388 2389\n1608 1610\n2247 2248\n2236 2241\n2939 2941\n895 899\n2018 2020\n3193 3197\n453 456\n2823 2825\n1678 1680\n2936 2937\n999 1003\n3331 3336\n2988 2989\n3584 3588\n15 20\n2845 2848\n2456 2461\n3745 3750\n3450 3455\n2303 2306\n1009 1011\n1450 1452\n2697 2701\n892 894\n700 702\n531 533\n1484 1488\n3969 3971\n1178 1182\n3908 3909\n2598 2602\n1454 1459\n1196 1200\n3861 3863\n2969 2970\n3771 3773\n939 941\n1296 1298\n152 153\n2811 2813\n1086 1090\n3934 3939\n3850 3853\n339 343\n3668 3673\n2439 2442\n3481 3484\n2741 2742\n1555 1558\n2980 2985\n3136 3138\n3036 3039\n2355 2356\n496 500\n1808 1813\n2109 2111\n2051 2054\n2665 2668\n40 41\n884 885\n3116 3119\n1216 1218\n1587 1588\n905 908\n2293 2296\n899 902\n2527 2531\n1920 1924\n668 671\n245 247\n2097 2102\n3472 3474\n1382 1387\n1511 1513\n1903 1906\n3611 3614\n3008 3009\n623 626\n1151 1154\n188 190\n2858 2863\n2864 2866\n2158 2160\n1501 1503\n2881 2885\n1357 1362\n845 848\n536 537\n3841 3842\n3260 3263\n2086 2088\n3337 3339\n2126 2131\n598 599\n1397 1399\n330 332\n2604 2606\n1798 1800\n698 699\n3254 3259\n2214 2219\n3147 3151\n989 992\n22 25\n418 420\n2503 2507\n2759 2760\n741 742\n716 717\n1651 1654\n3875 3880\n3609 3610\n2852 2855\n2280 2284\n382 387\n2118 2119\n1836 1837\n3598 3601\n1834 1835\n3539 3541\n2562 2567\n230 233\n104 109\n3400 3405\n1428 1433\n3277 3279\n142 147\n3892 3895\n957 958\n1074 1075\n1190 1195\n1744 1745\n1022 1027\n1131 1136\n3001 3006\n207 208\n3398 3399\n1793 1798\n3143 3147\n3485 3489\n165 168\n2302 2303\n235 238\n1866 1867\n690 695\n3469 3471\n3296 3300\n2150 2151\n2426 2428\n61 63\n3023 3024\n3339 3342\n984 986\n838 843\n1224 1229\n1915 1920\n1077 1079\n557 559\n1477 1479\n431 435\n3434 3436\n2443 2448\n3069 3074\n3709 3711\n1032 1036\n1745 1747\n2132 2136\n436 438\n1424 1427\n1243 1244\n1270 1272\n1642 1646\n1908 1912\n1685 1687\n1279 1281\n3177 3181\n1689 1694\n947 949\n2592 2594\n1890 1892\n481 484\n423 427\n3898 3902\n2488 2492\n2056 2058\n2145 2149\n2579 2580\n3493 3498\n780 781\n3215 3219\n3738 3739\n1355 1356\n671 676\n372 375\n2756 2759\n2701 2702\n2792 2796\n919 923\n1965 1968\n915 919\n2929 2934\n1597 1599\n439 444\n552 553\n1411 1413\n3357 3361\n2650 2655\n2925 2929\n3153 3155\n2639 2644\n3208 3212\n3365 3366\n1254 1255\n1326 1331\n949 953\n3863 3866\n972 976\n99 102\n636 640\n3367 3370\n3439 3440\n2311 2316\n2012 2015\n2769 2774\n2498 2499\n2761 2766\n161 164\n2479 2481\n3556 3560\n2096 2097\n2985 2987\n3122 3126\n2210 2211\n3698 3703\n1415 1417\n2582 2585\n3626 3630\n1694 1697\n2379 2381\n1104 1108\n1880 1884\n1321 1324\n1334 1339\n3845 3848\n580 584\n785 790\n2739 2741\n1999 2000\n3921 3924\n1445 1450\n2871 2874\n1777 1778\n2418 2420\n460 462\n1310 1311\n2945 2949\n2462 2467\n2234 2235\n2154 2157\n3579 3583\n2538 2542\n3939 3940\n2807 2808\n547 549\n3753 3757\n3766 3770\n1494 1496\n3930 3931\n2045 2050\n3411 3415\n2044 2045\n257 260\n1364 1369\n1704 1707\n1588 1589\n537 539\n2609 2610\n35 36\n1489 1493\n2775 2778\n3796 3801\n2867 2871\n2082 2083\n1565 1570\n2123 2126\n2616 2619\n3731 3733\n174 175\n3377 3380\n2337 2341\n155 160\n3131 3136\n2475 2479\n3679 3683\n2493 2496\n724 728\n2620 2621\n2414 2417\n3312 3315\n1399 1400\n20 22\n3740 3742\n3063 3067\n2449 2454\n887 892\n1291 1295\n2326 2331\n208 212\n1479 1484\n1096 1101\n2482 2487\n2808 2811\n3704 3707\n2203 2206\n1301 1304\n1663 1666\n3596 3598\n194 196\n1900 1903\n1346 1351\n544 546\n398 403\n2186 2191\n2832 2834\n1575 1580\n874 876\n1544 1548\n2535 2538\n2112 2117\n169 171\n362 366\n2288 2293\n3372 3374\n52 56\n2684 2689\n3972 3976\n1718 1719\n3812 3814\n3303 3305\n2121 2123\n357 359\n3437 3438\n3604 3607\n3279 3281\n3029 3030\n836 838\n2002 2006\n3300 3302\n810 815\n1161 1163\n902 904\n1672 1676\n829 833\n2552 2554\n530 531\n1963 1964\n2517 2521\n241 243\n134 139\n705 708\n2020 2024\n858 862\n77 82\n3833 3838\n2818 2820\n2310 2311\n1631 1634\n84 87\n2645 2647\n3158 3163\n2223 2227\n736 738\n394 395\n3075 3076\n2499 2502\n1768 1769\n564 569\n3225 3226\n2613 2614\n3284 3285\n2033 2036\n953 955\n2669 2674\n1951 1953\n1316 1320\n2421 2423\n1266 1269\n3602 3603\n3498 3500\n324 328\n3475 3479\n1237 1240\n3085 3088\n3952 3953\n2804 2806\n3349 3354\n2323 2324\n3506 3511\n1045 1048\n1409 1410\n2835 2840\n555 557\n1418 1423\n1582 1584\n1656 1660\n611 616\n1940 1941\n1514 1516\n3856 3859\n1137 1140\n2568 2571\n2206 2207\n2299 2300\n3241 3244\n1167 1168\n3502 3506\n1886 1888\n2796 2798\n2061 2063\n2595 2596\n664 665\n3656 3659\n458 460\n2169 2172\n3714 3716\n2039 2044\n3948 3950\n2708 2709\n629 630\n1601 1605\n1856 1859\n3726 3728\n369 370\n2243 2247\n503 507\n263 265\n3041 3043\n1928 1929\n389 392\n465 470\n3099 3102\n1860 1865\n2886 2889\n1559 1564\n1822 1824\n853 855\n1688 1689\n67 68\n3447 3449\n414 417\n474 477\n2319 2320\n3321 3325\n317 322\n268 269\n968 969\n2732 2737\n3093 3098\n2367 2370\n559 560\n585 587\n3060 3061\n2359 2360\n250 254\n2751 2755\n2629 2631\n335 338\n1976 1981\n2587 2591\n213 216\n1079 1082\n2895 2898\n3829 3831\n3427 3431\n41 45\n1441 1443\n1801 1806\n3562 3564\n1735 1739\n1815 1819\n1203 1205\n749 750\n2704 2705\n3817 3818\n2961 2963\n2820 2822\n3572 3577\n1647 1651\n1924 1927\n2951 2953\n3954 3957\n3245 3246\n2913 2915\n2602 2604\n2743 2746\n588 592\n3381 3386\n1307 1310\n2300 2302\n39 40\n514 519\n3781 3784\n1067 1071\n3389 3391\n943 947\n31 34\n94 99\n2523 2527\n3733 3737\n2073 2077\n866 869\n1722 1726\n2266 2270\n2799 2800\n3535 3537\n1669 1672\n1206 1209\n2998 3000\n2362 2367\n1619 1623\n11 12\n1758 1763\n2209 2210\n641 646\n3084 3085\n2384 2387\n2390 2395\n3915 3920\n1988 1991\n770 772\n1287 1288\n2332 2333\n3803 3804\n3694 3696\n3274 3277\n3442 3444\n2274 2277\n1092 1094\n1173 1177\n2726 2730\n804 809\n1147 1149\n1634 1638\n3220 3224\n2545 2549\n2102 2106\n3637 3640\n3805 3810\n3660 3662\n2710 2713\n908 913\n1892 1897\n2786 2791\n3664 3667\n3235 3236\n471 473\n281 283\n3773 3777\n3885 3890\n3393 3395\n2180 2185\n3317 3318\n1839 1843\n3675 3678\n1772 1775\n470 471\n3152 3153\n2467 2469\n2840 2843\n3512 3516\n2875 2879\n3291 3294\n1776 1777\n3615 3617\n1013 1014\n729 733\n790 791\n1970 1975\n3056 3057\n3957 3962\n2371 2374\n2173 2177\n1536 1541\n2680 2683\n2195 2200\n3456 3458\n923 927\n1313 1316\n753 754\n865 866\n1517 1521\n2149 2150\n1531 1535\n773 778\n2343 2347\n764 765\n2514 2517\n1763 1768\n3554 3556\n3903 3906\n1779 1784\n1470 1475\n1611 1615\n768 769\n3777 3781\n3544 3546\n2973 2975\n3012 3014\n3269 3272\n1932 1937\n1638 1640\n3419 3421\n310 315\n130 134\n197 199\n2403 2405\n965 966\n3652 3655\n502 503\n1849 1854\n3183 3185\n3424 3425\n995 997\n1218 1222\n3343 3347\n3138 3140\n184 188\n798 803\n1452 1454\n3926 3929\n3567 3570\n3362 3364\n569 571\n2622 2627\n200 205\n1340 1344\n2716 2721\n1960 1962\n289 293\n68 73\n1011 1013\n1247 1250\n1402 1406\n225 227\n2907 2910\n869 873\n1524 1529\n1109 1112\n3547 3548\n1298 1301\n2748 2751\n1433 1438\n178 183\n2803 2804\n3525 3526\n1183 1187\n2956 2960\n3166 3170\n2435 2436\n3631 3635\n1388 1390\n572 577\n710 713\n3718 3719\n1028 1031\n1376 1381\n297 298\n1459 1464\n1118 1123\n3347 3348\n1212 1215\n3405 3410\n1062 1067\n617 622\n656 661\n408 412\n3964 3967\n1942 1945\n3188 3192\n2943 2945\n561 564\n2430 2434\n594 595\n2900 2905\n89 92\n3030 3033\n2251 2256\n1143 1144\n287 288\n3110 3114\n3248 3251\n123 126\n1274 1277\n2573 2576\n1698 1702\n602 604\n1571 1574\n757 762\n350 355\n1740 1741",
        expected: "false",
      },
    ],
    hints: [
      "Two meetings [a, b) and [c, d) clash exactly when a < d and c < b.",
      "Comparing every pair works but is quadratic. Is there an order in which clashes can only happen between adjacent meetings?",
      "Sort by start time. Then each meeting only needs to begin no earlier than the previous one ends.",
    ],
    solutions: [
      {
        title: "Compare every pair",
        order: 1,
        intuition:
          "Apply the overlap test to every pair of meetings. Any clash means the answer is false.",
        approach: [
          "For every pair (i, j) with i < j, check whether start_i < end_j and start_j < end_i.",
          "Return false on the first clash, true if none is found.",
        ],
        code: {
          PYTHON: `def canAttendAll(meetings: List[List[int]]) -> bool:
    n = len(meetings)
    for i in range(n):
        for j in range(i + 1, n):
            a, b = meetings[i]
            c, d = meetings[j]
            if a < d and c < b:
                return False
    return True`,
          JAVA: `class Solution {
    public boolean canAttendAll(int[][] meetings) {
        for (int i = 0; i < meetings.length; i++) {
            for (int j = i + 1; j < meetings.length; j++) {
                if (meetings[i][0] < meetings[j][1] && meetings[j][0] < meetings[i][1]) return false;
            }
        }
        return true;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        edgeCases: ["No meetings at all."],
        commonMistakes: [
          "Using <= in the overlap test, which wrongly flags back-to-back meetings.",
        ],
      },
      {
        title: "Optimal: sort by start, check neighbours",
        order: 2,
        intuition:
          "After sorting by start, if meeting k clashes with some earlier meeting, it must also clash with meeting k - 1 or the clash would have been caught earlier — the previous meeting's end is the latest constraint that matters. So one pass over adjacent pairs is enough.",
        approach: [
          "Sort the meetings by start time.",
          "For each consecutive pair, if the next start is before the previous end, return false.",
          "Otherwise return true.",
        ],
        code: {
          PYTHON: `def canAttendAll(meetings: List[List[int]]) -> bool:
    ordered = sorted(meetings)

    for k in range(1, len(ordered)):
        if ordered[k][0] < ordered[k - 1][1]:
            return False  # starts before the previous one is over

    return True`,
          JAVA: `class Solution {
    public boolean canAttendAll(int[][] meetings) {
        int[][] ordered = meetings.clone();
        Arrays.sort(ordered, (a, b) -> Integer.compare(a[0], b[0]));

        for (int k = 1; k < ordered.length; k++) {
            if (ordered[k][0] < ordered[k - 1][1]) return false;
        }
        return true;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n) for the sorted copy",
        edgeCases: [
          "Back-to-back meetings that share a boundary minute.",
          "A long meeting that swallows a later short one.",
          "Zero or one meeting.",
        ],
        commonMistakes: [
          "Forgetting to sort first — the input is in request order, not time order.",
          "Treating a shared boundary as a clash.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "balanced-step-pieces",
    title: "Balanced Dance Phrases",
    difficulty: "EASY",
    learningObjective:
      "See that cutting at the earliest valid point never reduces how many cuts are possible later.",
    topics: ["greedy", "strings"],
    patterns: ["greedy"],
    statement: [
      rich(
        "A choreographer writes a routine as a string of steps: ",
        { code: "L" },
        " for a step left and ",
        { code: "R" },
        " for a step right. A phrase is balanced when it contains the same number of L and R steps. The full routine is balanced."
      ),
      para(
        "Cut the routine into consecutive pieces so that every piece is balanced, and return the largest number of pieces possible."
      ),
      example(
        'steps = "RLRRLLRLRL"',
        "4",
        [
          { state: "RL | RRLLRLRL", note: "balance returns to 0 after 2 steps — cut" },
          { state: "RL | RRLL | RLRL", note: "balance hits 0 again after RRLL — cut" },
          { state: "RL | RRLL | RL | RL", note: "4 pieces" },
        ],
        "Cut every time the balance returns to zero"
      ),
    ],
    constraints: [
      "2 ≤ steps.length ≤ 1000",
      "steps contains only 'L' and 'R', with equal counts of each.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["steps"],
      returns: "int",
      functionName: "maxBalancedPieces",
    },
    tests: [
      {
        input: "RLRRLLRLRL",
        expected: "4",
        isSample: true,
        explanation: "RL | RRLL | RL | RL.",
      },
      {
        input: "LLLRRR",
        expected: "1",
        isSample: true,
        explanation: "The balance only returns to zero at the very end.",
      },
      {
        input: "LR",
        expected: "1",
      },
      {
        input: "RL",
        expected: "1",
      },
      {
        input: "LRLRLR",
        expected: "3",
      },
      {
        input: "RRLLRRLL",
        expected: "2",
      },
      {
        input: "LLRRRLLR",
        expected: "3",
      },
      {
        input:
          "LLRLLRRLLLRRLLRLRRRRLRRRRRLRRRLRRLLLRLLLRRLLLRLLLRRLRRLRLRRLLRRRRRLLLRRRLLLLRLRRLLRRRLRLLLRRRLLLLLLLLLLLRRLLLLLRLRRLLRLLLLRLRRRRLRRLRRLRLRLLLLLRRLRRRLRLRRRLRLRLLLLRLLLLRRLLLRLLLRRRLLLLRLRLLRLRRLRLRRRLLLLLRLRLRLLRRRLLRRLRRLRLLRRLRLRLRLLRLRLLLLLLLLLRRRRRLRLRLRRRRRLLRLRRRLRLRRLLRRLLLRLLRRRLRLRRLRRLLRLRLRLLLRRRRRRLRRLLRLLRLLLLLLLRRRRLLRLRRRLRRLRLLLRLLLLLRRLRRLLRLRLRLLRRLRLLRLRRRLLRRLRLRLLRRRLRRRRRRRLLLRRRRLLLRRRLLLRLLLRLRLLRLLRLRRLLRRLRRLLLRRLRLRLLLLRLLLRLRLLRRRLRRRRRRLLRLLLLLLLRRRLLLRRLRRLLRRLLLLLRRRLRLLRLRRRLLRLLLRRLRRLLRRRRLLLLRLLLRRRRLLLLLRRLRLRLRLLLRRLRLLRRRLRRRLRRLLLLLRRRRRRRRLRLRLRRRLLRLRLLLLLLLRLLLRRLRRLLRLRRRLRRLRRLRLRRRLLLLLLRLLLRRLLRRLRRLLRLRLLRLLLRLLRRLLRRRRRRRLLLLLLLRRLLRRRLRLLLLRLRLLRLRLLLRRRRRRLRRRRRLLLRRLRRRRLLRRRRRRRLRRRRLRRRRLRRRRRLLRRLLLLLRLLLLRLRLRRRRLLLRLRLLLRRRLLRRRRLLLLRLLRLLLRLRRLLRRRLRRLLRLRRLRRLLRRRRRLRLLLRRRRRLLLLRLLRLLRRRRRRRLLRRLLLRRLLRLRLRLRRLLRLRLRRRRRRLRLRRLLRLLRRLRLLLLLLRLLLLLRLLLLLRLRRRRRLLRRRRRLLRRRLLRRLLRRLLRLRLRLLLRLRLRLLLRLLLLRLLRLLRLRRLLRRRRRLRRLRRRLLLRRLLRLRRLRRRRRLRRLLLRLLLRLRLRLLRLLRRRRRRLLLRLLLLLLRLLRLLRRRLLLLLRLRRRRLRRRRLLRLLLLRLLRLRRLRRRLRLLRRLLLLRLRLRRRLLLRRLLLRRLLRLRRRLRRLLLLLRLLLRRRLRLRLRLLRRLRLLLLLRLLRLLLLRLLLLLLRLRLRRLRRLRLRLRLLRRRRRRLRRRLRRRRRLLLRLRLLRLRRLLLRRRRRRLRLLRRRLRLLRLLRLLLLLLRRLLRRLLRLRLLLRLRRLLRLRRLLRLRRRLLRRLLRRRLLRRRLLRLRRLLRRRRLRLRRLLLRRRRRRLLLLRLRRLRRRLLRLRLRLLRRRRLLRRLRLLRRLLLRRRRRRRLLLLLRLLLRLRRRRRLLLRRLRRLLRLRLRRRRRRLRRRLRLLLLLRLRLLRRLLRLRRLLLRRLRRRRLRRLLLLLRRLRLLRRLRRRLLRRLLRRRRLRRLLLLLRLLLLRLLRLLRLLRLRRLLRLLRLLRRLRRLLLLRLRRLRLLLLRRRLRRLLRLLRLRLLLRLLLLRRLLRRRRLRLLRRLRLRLLRRRLLRRRRRLLRLRRLRLRLLLRRRRLRRRLLRRLRLRRRLRLRRLLRLLRLLLRLRRRRLRRLRLLRLRLRLLLRLLLLLRRLRLLLRRRRRRRLLLLRRLRLRLRRRRLRLLLRRLRRRRLRRLLRRRLLRRLLRRLLLRRLLRLLRLLLRRLRLRLRRRLLRRLLRRRLLLLLLRRRRLLLRLLLLRLLRRLRRLLRRLLRLLLLRRRLLLRRRRRRRRRRRLRRRLRRLRLLRLLRLLRRLRLLLRRRRLLLRLLRLLRLLLRRRLRLRRRRLLRLLRRLRRLLRRLRLLLRLRRRRLRRLRRRLRRLLRLLLRRRRRLRLLRRRRLRRRLRRRLRRRLRRLLLLLRLRRLRRLLLLLLLLRLRLLLRRRLLLRLRRRRLRRLRRRLRLRRLRLLLRRLRRRRRRLLLLLLLRRRLLRRRRLLRLLLRLLRRLR",
        expected: "26",
      },
    ],
    hints: [
      "Keep a running balance: +1 for L, -1 for R. What does it mean when it returns to 0?",
      "If a prefix is balanced, is the rest of the routine also balanced?",
      "Cutting at the first chance never hurts: count how many times the running balance hits zero.",
    ],
    solutions: [
      {
        title: "Optimal: cut every time the balance returns to zero",
        order: 1,
        intuition:
          "A prefix with equal L and R leaves a remainder that is also balanced, because the whole routine is. Cutting as early as possible therefore never blocks a later cut: any cut a longer first piece could allow is still available afterwards. So the answer is simply the number of positions where the running balance is zero.",
        approach: [
          "Start with balance = 0 and pieces = 0.",
          "For each step add 1 for L, subtract 1 for R.",
          "Whenever the balance is 0, a balanced piece has just ended — count it.",
        ],
        code: {
          PYTHON: `def maxBalancedPieces(steps: str) -> int:
    balance = 0
    pieces = 0

    for step in steps:
        balance += 1 if step == "L" else -1
        if balance == 0:
            pieces += 1  # the earliest possible cut

    return pieces`,
          JAVA: `class Solution {
    public int maxBalancedPieces(String steps) {
        int balance = 0, pieces = 0;
        for (int i = 0; i < steps.length(); i++) {
            balance += steps.charAt(i) == 'L' ? 1 : -1;
            if (balance == 0) pieces++;
        }
        return pieces;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A routine that only balances at the very end — one piece.",
          "Alternating steps — every pair is its own piece.",
        ],
        commonMistakes: [
          "Counting balanced substrings anywhere, rather than consecutive pieces that cover the routine.",
          "Resetting the balance after a cut — unnecessary, since it is already 0.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "sign-flips-max-total",
    title: "Forced Sign Flips",
    difficulty: "EASY",
    learningObjective:
      "Spend operations where they gain the most, then neutralise leftovers by dumping them on the cheapest element.",
    topics: ["greedy", "arrays"],
    patterns: ["greedy"],
    statement: [
      rich(
        "A ledger holds a list of signed adjustments. An auditor must perform ",
        { strong: "exactly" },
        " ",
        { code: "k" },
        " sign flips: each flip picks one entry and multiplies it by -1. The same entry may be flipped more than once."
      ),
      para("Return the largest possible sum of the ledger after all k flips."),
      example(
        "ledger = [-4, -2, 5, -1], k = 2",
        "10",
        [
          { state: "sorted: -4 -2 -1 5", note: "most negative first" },
          { state: "4 -2 -1 5", note: "flip -4 (gains 8)" },
          { state: "4 2 -1 5", note: "flip -2 (gains 4); no flips left" },
          { state: "sum = 10", note: "" },
        ],
        "Flip the most damaging entries"
      ),
      example(
        "ledger = [3, -1, 0, 2], k = 3",
        "6",
        [
          { state: "-1 0 2 3", note: "sorted" },
          { state: "1 0 2 3", note: "flip -1; 2 flips left" },
          { state: "flip 0 twice", note: "an even leftover cancels out" },
        ],
        "Leftover flips"
      ),
    ],
    constraints: [
      "1 ≤ ledger.length ≤ 10000",
      "-100 ≤ ledger[i] ≤ 100",
      "1 ≤ k ≤ 10000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["ledger", "k"],
      returns: "int",
      functionName: "maxSumAfterFlips",
    },
    tests: [
      {
        input: "3 -1 0 2\n3",
        expected: "6",
        isSample: true,
        explanation:
          "Flip -1 once, then spend the other two flips on 0: 1 + 0 + 2 + 3 = 6.",
      },
      {
        input: "-4 -2 5 -1\n2",
        expected: "10",
        isSample: true,
        explanation: "Flip -4 and -2: 4 + 2 + 5 - 1 = 10.",
      },
      {
        input: "5\n1",
        expected: "-5",
      },
      {
        input: "5\n2",
        expected: "5",
      },
      {
        input: "-5\n3",
        expected: "5",
      },
      {
        input: "0 -3\n5",
        expected: "3",
      },
      {
        input: "-1 -2 -3\n3",
        expected: "6",
      },
      {
        input: "-1 -2 -3\n4",
        expected: "4",
      },
      {
        input: "2 2 2\n7",
        expected: "2",
      },
      {
        input:
          "-54 48 63 57 67 -96 98 -12 -25 80 85 -23 85 -37 100 -65 -52 23 82 85 -59 -12 66 -75 75 -31 43 21 21 37 -72 97 -9 -91 -81 89 89 -17 -60 72 3 7 49 4 -54 -69 -72 -29 57 64 69 -56 -20 -29 69 84 88 80 -71 -100 -46 17 75 -68 -17 9 36 -45 12 58 -4 -33 4 4 -63 -81 87 -17 66 -62 -88 7 -98 -3 25 -38 37 -42 -92 51 -57 -13 -40 75 13 10 -62 94 -20 13 -62 95 66 40 52 -72 47 95 67 26 30 0 2 62 -88 38 -75 58 31 -29 96 -23 33 30 -43 -3 -89 -87 -73 -65 5 -37 6 -38 -91 -8 -85 -8 58 26 4 -45 -5 -86 -12 2 -21 73 10 -45 -15 14 -55 75 -25 -7 16 -21 -89 73 11 -70 -70 -14 -8 71 -35 -33 -9 -44 -18 -54 14 -80 -45 90 -17 95 -31 41 68 73 73 -19 22 -43 -8 82 90 -6 -95 26 67 65 -32 -24 -73 22 -98 15 100 37 64 93 -80 58 -6 -94 -17 48 -84 -41 67 99 -32 -13 18 -8 17 -36 -87 42 -3 -100 91 -26 -46 -98 -29 28 77 -76 17 -31 20 -46 90 97 1 7 -78 -8 -80 100 57 25 38 -6 -25 44 -81 56 -96 -6 -47 -96 4 48 -1 27 25 53 -28 -17 47 65 -26 28 47 38 -82 71 -80 96 37 37 66 80 90 -7 -64 94 37 11 -98 24 -74 84 -44 -63 -73 -26 -19 70 59 41 -68 82 -71 -100 88 81 39 4 82 32 -2 32 -57 82 14 -13 -32 39 -12 12 89 11 36 -85 -32 -99 25 30 -20 -45 -13 -76 2 61 -76 27 12 -52 -23 -17 77 41 59 26 -58 -61 -12 8 -56 92 -65 81 32 60 38 99 60 89 -93 -42 -97 -60 72 83 -32 95 19 -56 76 48 42 -2 53 38 -82 -10 -56 11 7 2 84 -55 13 -30 -5 -67 84 -94 -58 39 -3 -76 7 95 38 -5 98 -55 7 -28 -89 85 22 6 -98 2 -96 -74 33 6 38 -4 72 -16 70 44 39 -53 62 34 9 39 92 -39 -42 98 63 64 -94 -75 55 -63 -21 -56 -83 33 -98 63 -51 -24 -50 32 29 6 39 -47 5 53 24 -5 98 -46 37 -66 73 -46 -29 -96 -29 13 42 18 23 56 9 -34 21 -25 -53 90 -68 84 -3 5 32 -79 -74 -44 -59 90 -12 -86 5 -40 41 53 91 13 -64 -89 -10 -38 92 50 -63 -62 8 86 -37 -56 78 89 -59 25 79 13 41 -18 -100 -96 -22 98 18 43 -24 -3 53 -69 -67 -23 -27 19 0 59 24 79 56 74 53 42 -67 -89 -21 25 68 -6 -50 -93 -84 93 -79 -27 44 93 -77 71 31 71 -85 15 15 26 -37 -99 3 -23 -77 84 78 -42 -98 -97 -61 58 12 94 -12 -9 100 -37 4 47 94 -22 10 91 -18 11 99 43 84 -4 -51 13 -23 22 10 -50 15 27 -39 84 76 0 -10 -69 30 16 -14 97 89 36 70 -52 -26 98 -15 90 17 -90 8 -74 5 -77 -25 -86 -60 92 -96 21 -4 38 95 91 -81 -83 58 76 -23 -73 59 69 43 -16 91 -79 55 33 -60 74 -55 45 -95 73 17 46 51 -74 38 42 89 -85 -99 -81 65 66 -83 70 90 -62 -29 70 -21 9 79 -23 46 -49 42 43 17 -76 -71 -71 -35 9 -45 -55 -23 67 76 59 30 -24 73 -84 -73 -40 17 27 -66 95 66 -71 -59 -85 24 1 91 23 29 -34 -82 51 36 67 -77 -32 -41 -22 -79 85 89 48 79 16 -11 -75 80 56 -25 31 92 -62 -76 64 79 69 88 -72 -92 76 34 17 98 -80 70 68 -54 -31 -14 13 -31 -91 76 80 -23 -71 71 55 -11 82 72 68 -70 -3 76 -46 42 -49 -93 -24 78 47 -32 -65 -24 -73 22 96 -78 42 -57 -32 86 -95 23 -67 15 49 -48 31 -56 -8 55 97 -17 91 -32 -84 -50 -22 85 78 -25 -45 -39 -41 82 28 -29 -50 86 43 19 58 84 -29 -8 88 -8 -50 -91 20 3 7 -67 -83 32 83 8 -8 -77 65 -73 -34 -81 -35 24 -97 46 -50 -13 -91 -43 81 56 -5 85 -99 -42 -13 -75 16 86 -79 -4 28 -4 -58 54 -64 -25 14 -97 -89 -95 -65 -87 27 15 -22 -34 37 79 12 -27 -100 -2 -1 -29 -53 88 -85 -1 30 82 32 33 42 -63 -12 67 -51 22 30 -53 54 28 63 -15 -2 -36 35 -90 -42 44 98 96 18 -31 -100 99 -26 25 -88 -87 92 -51 -7 -2 -62 60 18 92 -38 13 -93 -72 -38 10 40 -28 6 38 86 -41 55 -7 -96 -79 65 63 -57 35 11 58 -18 13 96 -76 55 -89 64 -19 -76 -9 -93 -70 -91 64 71 -52 4 -4 42 -77 14 -78 23 83 25 14 18 51 -58 -57 43 -35 -88 -43 -46 88 71 25 84 -61 69 47 59 -73 84 83 58 0 30 12 92 66 -5 23 90 44 -3 79 -48 69 21 -7 -27 -57 46 -51 36 92 -10 51 5 -23 -64 25 6 -77 76 -53 56 -58 100 28 54 -73 -37 1 -97 -33 -99 84 65 -12 81 -61 -82 55 -22 -30 -82 -55 68 29 66 86 97 12 -91 86 11 -8 -13 -85 -3 -33 -59 23 -22 72 77 -74 -60 -74 -74 51 7 68 5 -86 65 -45 43 -89 34 -96 76 13 72 19 -58 92 -39 11 -14 -99 -69 45 80 9 -49 96 56 74 -80 -88 47 29 -75 17 -93 -8 -53 34 35 41 3 26 -22 35 -20 -23 53 -45 52 -55 3 -65 30 61 80 63 73 22 30 52 -49 -50 56 1 -66 -67 15 -35 -51 44 -58 12 21 48 64 -4 -27 -76 -62 80 -29 78 -27 39 44 -9 38 -26 75 -76 -91 64 97 12 19 63 -35 -50 -94 -99 100 -49 63 -79 63 -22 82 41 -15 6 -3 -40 7 -41 40 76 -14 -99 -65 -89 -48 -72 -97 -35 -1 26 11 -67 -79 85 -61 -90 -74 -30 -70 -31 71 -92 -41 -37 68 22 85 -17 -5 -69 98 5 -72 -70 26 -62 -75 10 79 65 -6 -71 -86 56 66 47 22 10 -26 72 82 72 92 57 -58 42 64 6 -38 -31 23 15 51 29 17 85 22 54 -38 11 81 27 -98 -69 -75 -53 -11 10 22 -68 -54 -15 48 96 -100 -91 34 -68 -58 90 9 -89 -31 7 70 60 -95 61 33 31 -67 -2 22 -10 62 89 88 -55 -35 18 -40 100 -74 -78 31 -63 59 -72 -13 71 -10 -18 35 1 -53 35 85 71 -6 -15 65 92 -15 -57 62 6 92 -50 55 -28 -21 -94 -42 -69 4 88 -53 47 -82 -79 90 -80 37 0 -72 -78 -12 -59 69 -25 48 -36 98 -48 63 -18 -80 13 7 -80 -95 -85 25 90 -16 -34 -39 84 91 -54 59 -65 1 -61 92 72 -72 -36 -33 -90 42 0 -60 49 40 -82 -100 -17 -71 17 27 82 -65 -34 35 -89 -37 -20 -32 35 -77 -67 72 23 -84 16 -100 1 -79 -18 7 35 67 -82 -13 38 43 -90 94 78 15 90 8 -26 -17 -19 76 -26 85 24 -67 18 -26 -53 72 5 -38 87 12 -2 55 89 -61 38 -99 -77 61 31 -96 30 -57 82 -49 -57 82 97 -8 4 92 38 28 -58 10 -63 -65 59 -5 99 9 19 61 -68 -89 28 -97 47 41 77 -58 75 21 92 -13 -68 66 9 85 81 70 65 82 -97 66 13 -11 -25 31 80 100 -48 -32 -64 68 4 28 68 -68 -64 -90 20 -37 64 -50 -50 34 -40 10 49 -3 18 53 62 3 5 -90 -71 77 -58 -65 -77 -78 91 -93 30 -34 -24 63 29 74 57 -77 -6 -38 -96 40 81 -64 -55 -95 -71 53 70 16 -90 71 -40 32 56 54 -70 -62 12 -53 37 67 -46 -71 9 63 -53 -47 38 0 -29 -38 22 45 53 77 -80 -41 31 85 -86 35 74 67 34 78 76 -24 93 63 74 30 17 -68 -10 75 -49 -36 61 45 62 9 -25 64 6 34 72 -14 91 -76 69 47 -27 -61 -36 96 -16 -88 -21 43 68 -93 95 -40 -3 1 30 29 -35 53 -82 -36 -70 -85 19 45 10 79 -14 32 -41 -66 51 -96 57 -27 63 -62 95 7 4 -27 -17 87 90 -47 33 -11 -1 1 -69 24 0 87 -5 -65 -51 53 -10 -59 42 34 -70 -7 -42 -69 -70 56 -51 87 36 24 48 100 -88 -69 4 42 29 -68 60 60 -62 25 -2 -8 -22 82 -23 94 83 -50 55 -63 44 60 74 -30 14 55 -66 -35 87 -81 67 -81 28 5 13 93 -84 52 -98 48 -6 -67 -60 80 35 -55 -41 -83 14 -94 -1 -98 -98 -91 48 50 -99 36 93 -44 30 22 -8 45 71 -83 -99 -90 -64 -36 -67 -45 97 53 -1 -87 -40 97 26 84 -65 82 -22 8 -89 56 -88 88 49 -49 10 85 75 -75 -56 -88 -49 -9 -64 8 25 32 -27 -39 67 -10 -97 40 73 -63 -74 -99 -55 -100 -86 4 47 -92 -58 42 74 -20 19 25 -32 -37 -86 -72 31 38 -55 98 48 -50 -9 6 11 80 34 -74 52 -88 72 -16 0 -85 -99 77 -70 28 5 -73 -61 70 -40 17 -76 50 -90 -6 66 17 -27 -32 86 51 -66 38 -27 83 98 -64 7 -19 44 -31 10 -25 38 20 -65 -12 0 -99 -66 -20 39 -6 -92 -19 -47 81 90 32 -51 44 63 21 50 83 -76 86 60 -17 21 90 34 66 7 -96 73 30 0 -48 70 -38 -1 89 72 34 69 28 82 75 90 36 -18 -21 -20 -15 -11 13 23 37 8 85 -18 -89 85 -44 -34 91 -60 55 -42 -20 71 17 38 -3 -53 98 -10 66 4 -78 65 -73 99 57 -93 -79 -64 94 -21 -64 -47 -94 -51 -14 -69 -79 -7 -61 -97 -49 33 23 40 58 -93 -71 -99 66 92 31 -74 -70 -53 -8 97 42 -84 -97 -88 52 40 -72 -26 65 81 12 60 -59 -44 70 13 -8 90 2 -60 62 30 100 -46 4 -15 -12 -7 -59 63 -55 49 11 -82 -96 -53 15 26 -22\n1500",
        expected: "101177",
      },
    ],
    hints: [
      "Flipping a negative value v gains 2·|v|. Which negative should go first?",
      "Two flips on the same entry cancel out. What does that say about leftover flips once there are no negatives?",
      "If an odd number of flips remain, one entry must end up negated. Pick the one with the smallest absolute value.",
    ],
    solutions: [
      {
        title: "Simulate: always flip the current minimum",
        order: 1,
        intuition:
          "At every moment, flipping the smallest value is the best single move: it either removes the largest negative or, if nothing is negative, costs the least. Doing that k times is correct, but each step scans the list.",
        approach: [
          "Repeat k times: find the index of the minimum value and negate it.",
          "Return the sum.",
        ],
        code: {
          PYTHON: `def maxSumAfterFlips(ledger: List[int], k: int) -> int:
    values = list(ledger)
    for _ in range(k):
        i = values.index(min(values))
        values[i] = -values[i]
    return sum(values)`,
          JAVA: `class Solution {
    public int maxSumAfterFlips(int[] ledger, int k) {
        int[] values = ledger.clone();
        for (int step = 0; step < k; step++) {
            int min = 0;
            for (int i = 1; i < values.length; i++) if (values[i] < values[min]) min = i;
            values[min] = -values[min];
        }
        int sum = 0;
        for (int v : values) sum += v;
        return sum;
    }
}`,
        },
        timeComplexity: "O(n · k)",
        spaceComplexity: "O(n)",
        edgeCases: ["k much larger than the number of negatives."],
        commonMistakes: [
          "Flipping the largest absolute value instead of the smallest value.",
        ],
      },
      {
        title: "Optimal: sort once, flip negatives, settle the parity",
        order: 2,
        intuition:
          "Sorted ascending, the negatives sit at the front with the most damaging first. Flip them in order while flips remain. Whatever is left over can be spent in pairs on any entry for free; only an odd leftover costs anything, and the cheapest entry to sacrifice is the one with the smallest absolute value — which is the minimum of the array after the negatives have been flipped.",
        approach: [
          "Sort the ledger.",
          "Walk from the left; while k > 0 and the value is negative, negate it and decrement k.",
          "Sum the result.",
          "If k is odd, subtract twice the smallest value now in the array.",
        ],
        code: {
          PYTHON: `def maxSumAfterFlips(ledger: List[int], k: int) -> int:
    values = sorted(ledger)

    for i in range(len(values)):
        if k > 0 and values[i] < 0:
            values[i] = -values[i]
            k -= 1

    total = sum(values)
    if k % 2 == 1:
        # One flip cannot be cancelled: sacrifice the smallest entry.
        total -= 2 * min(values)
    return total`,
          JAVA: `class Solution {
    public int maxSumAfterFlips(int[] ledger, int k) {
        int[] values = ledger.clone();
        Arrays.sort(values);

        for (int i = 0; i < values.length && k > 0 && values[i] < 0; i++) {
            values[i] = -values[i];
            k--;
        }

        int total = 0, smallest = Integer.MAX_VALUE;
        for (int v : values) {
            total += v;
            smallest = Math.min(smallest, v);
        }
        if (k % 2 == 1) total -= 2 * smallest;
        return total;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A zero in the ledger soaks up any leftover flips at no cost.",
          "More negatives than flips — only the most negative are flipped.",
          "A single entry with an odd k.",
        ],
        commonMistakes: [
          "Taking the minimum before flipping the negatives, which may pick an entry that is no longer smallest.",
          "Ignoring the parity of the leftover flips.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "consolidate-booked-slots",
    title: "Consolidate Booked Slots",
    difficulty: "MEDIUM",
    learningObjective:
      "Sort intervals by start so overlapping ones become adjacent, then sweep once while extending a current block.",
    topics: ["intervals", "arrays"],
    patterns: ["merge-intervals"],
    statement: [
      para(
        "A shared workshop keeps a log of booked time slots. Each row [start, end] is a closed range of hours: the bench is busy from start through end, inclusive. The log is in no particular order and slots often overlap."
      ),
      para(
        "Merge the log into the fewest non-overlapping busy blocks, where two slots belong to the same block if they overlap or touch (one ends at the hour another starts). Return the blocks sorted by start, flattened into one list: start₁, end₁, start₂, end₂, …"
      ),
      example(
        "slots = [[1, 3], [8, 10], [2, 6], [15, 18]]",
        "[1, 6, 8, 10, 15, 18]",
        [
          { state: "[1,3] [2,6] [8,10] [15,18]", note: "sorted by start" },
          { state: "block [1,3]", note: "open the first block" },
          { state: "block [1,6]", note: "2 ≤ 3, so [2,6] extends it" },
          { state: "[1,6] | [8,10]", note: "8 > 6 — close the block, open a new one" },
          { state: "[1,6] | [8,10] | [15,18]", note: "flatten: 1 6 8 10 15 18" },
        ],
        "One sweep after sorting"
      ),
    ],
    constraints: [
      "1 ≤ slots.length ≤ 10000",
      "0 ≤ start ≤ end ≤ 1000000",
      "Return value: blocks flattened as [s1, e1, s2, e2, ...], sorted by start.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["slots"],
      returns: "int[]",
      functionName: "mergeSlots",
    },
    tests: [
      {
        input: "4\n1 3\n8 10\n2 6\n15 18",
        expected: "1 6 8 10 15 18",
        isSample: true,
        explanation: "[1,3] and [2,6] merge into [1,6]; the others stand alone.",
      },
      {
        input: "2\n4 5\n1 4",
        expected: "1 5",
        isSample: true,
        explanation: "The slots touch at hour 4, so they merge into [1,5].",
      },
      {
        input: "1\n7 9",
        expected: "7 9",
      },
      {
        input: "3\n1 10\n2 3\n4 5",
        expected: "1 10",
      },
      {
        input: "2\n5 5\n5 5",
        expected: "5 5",
      },
      {
        input: "2\n1 2\n3 4",
        expected: "1 2 3 4",
      },
      {
        input: "4\n6 8\n1 9\n2 4\n4 7",
        expected: "1 9",
      },
      {
        input: "3\n0 0\n1 1\n0 1",
        expected: "0 1",
      },
      {
        input:
          "1500\n53674 53705\n16184 16220\n17288 17342\n87791 87811\n99632 99641\n54281 54330\n15686 15725\n72 130\n40615 40623\n81088 81102\n49819 49853\n18106 18131\n66172 66178\n97984 97985\n3106 3116\n735 765\n33735 33757\n2579 2611\n44794 44807\n4847 4861\n2860 2876\n6058 6085\n63017 63070\n96352 96410\n61107 61150\n82647 82691\n38306 38318\n83810 83862\n64383 64443\n27378 27433\n19364 19364\n50761 50778\n46302 46320\n52705 52753\n25564 25594\n22525 22578\n5613 5617\n92067 92079\n45360 45413\n51253 51267\n42975 42983\n17425 17457\n63171 63175\n7169 7227\n38529 38556\n52283 52295\n93817 93859\n92493 92539\n75908 75937\n83274 83319\n642 650\n92692 92714\n88695 88736\n44649 44658\n59445 59475\n7194 7231\n99184 99219\n59221 59243\n31267 31272\n77153 77178\n560 596\n29380 29408\n2558 2593\n20196 20237\n11451 11510\n21264 21273\n10973 11022\n51451 51505\n70466 70466\n52997 53022\n69909 69968\n36242 36250\n75893 75947\n48325 48349\n53581 53608\n73090 73099\n47173 47189\n14780 14798\n39983 40040\n88860 88897\n52624 52656\n56428 56470\n45471 45512\n69466 69486\n25606 25608\n21670 21719\n30957 30972\n26991 26993\n40552 40606\n70345 70348\n18768 18826\n72269 72313\n98342 98355\n90376 90382\n12381 12414\n16787 16810\n82172 82188\n14864 14871\n76097 76155\n22528 22541\n23491 23530\n12069 12111\n16489 16505\n3098 3123\n20501 20524\n36020 36047\n78837 78887\n4432 4492\n80002 80056\n54782 54798\n66452 66497\n426 450\n92626 92654\n38181 38206\n55966 55984\n38494 38523\n40577 40611\n77694 77728\n31542 31563\n50371 50412\n43864 43892\n27553 27608\n36397 36438\n64527 64557\n4852 4912\n29080 29112\n15742 15768\n60323 60378\n8899 8937\n49386 49435\n18990 18994\n92455 92465\n1557 1612\n45121 45164\n5550 5573\n39082 39117\n99189 99219\n13432 13483\n37301 37308\n93324 93363\n65205 65230\n32658 32706\n50662 50704\n42423 42470\n3719 3778\n94294 94315\n6674 6721\n38392 38422\n37209 37267\n38404 38437\n71179 71180\n42508 42541\n77088 77145\n6518 6518\n47652 47662\n86028 86045\n96978 96989\n20473 20474\n84628 84634\n83910 83918\n81416 81426\n48993 49002\n75027 75030\n54655 54659\n96471 96473\n50788 50820\n92241 92295\n23172 23181\n39038 39038\n32722 32747\n55821 55847\n10951 10969\n17063 17086\n24290 24291\n75982 75996\n71041 71090\n97636 97660\n25201 25250\n42072 42091\n32755 32793\n39506 39508\n33115 33164\n63202 63253\n54930 54974\n14373 14429\n53995 54018\n63916 63948\n85845 85849\n27605 27652\n53115 53124\n3136 3176\n77094 77141\n19324 19381\n98875 98896\n18196 18247\n61441 61492\n19260 19270\n79594 79613\n48216 48240\n16918 16976\n70264 70297\n27941 27971\n61409 61416\n39375 39420\n78907 78966\n59849 59890\n94034 94072\n66939 66994\n40233 40268\n18766 18771\n58804 58833\n1518 1577\n22278 22336\n7109 7115\n95918 95918\n25605 25618\n74637 74681\n2473 2522\n77907 77934\n77768 77771\n50358 50383\n59377 59393\n15834 15837\n93338 93363\n13466 13506\n27043 27087\n94997 95006\n2152 2154\n84731 84766\n49561 49617\n87703 87717\n8644 8652\n51194 51211\n99103 99122\n84397 84443\n35196 35245\n95781 95831\n52331 52338\n92480 92499\n93308 93319\n19712 19764\n52458 52488\n31120 31133\n76557 76561\n84949 84956\n2142 2186\n79450 79504\n68622 68639\n41880 41903\n98337 98356\n911 941\n95297 95336\n1292 1349\n54099 54148\n76945 76990\n19036 19036\n58438 58482\n48909 48918\n56853 56908\n82451 82459\n40641 40642\n38324 38325\n75934 75950\n65528 65539\n19695 19728\n79082 79108\n1702 1713\n16851 16901\n34143 34188\n61610 61634\n93677 93718\n35133 35168\n80265 80275\n34936 34981\n90324 90361\n68451 68510\n41488 41498\n86097 86151\n68918 68947\n70451 70468\n77935 77968\n9348 9405\n72591 72624\n73469 73498\n42266 42317\n9233 9282\n73128 73143\n30246 30268\n50602 50615\n77640 77673\n84478 84514\n67386 67422\n12280 12337\n69863 69915\n32334 32360\n91659 91718\n73876 73889\n11109 11124\n36066 36110\n53675 53723\n76783 76790\n6890 6906\n73147 73189\n24611 24616\n71282 71328\n19825 19870\n66065 66080\n31343 31386\n71336 71346\n28328 28335\n19706 19753\n9689 9721\n10376 10413\n47455 47474\n80170 80213\n39119 39124\n75399 75438\n37779 37809\n76455 76493\n40310 40320\n16953 16971\n70479 70533\n47670 47693\n48046 48069\n94028 94034\n80862 80910\n96826 96834\n53635 53638\n91933 91968\n25973 25982\n53358 53368\n35712 35765\n23586 23591\n78995 79030\n42869 42886\n78595 78628\n53694 53725\n994 1013\n37829 37852\n53789 53806\n7066 7074\n4739 4786\n4954 4979\n8103 8134\n1624 1654\n37986 38010\n93970 93994\n42614 42628\n16164 16212\n25123 25154\n89517 89556\n13310 13332\n50675 50725\n88485 88513\n29 45\n72054 72061\n61802 61818\n44691 44734\n72880 72924\n6877 6923\n67162 67211\n61857 61913\n29885 29901\n60392 60425\n88519 88552\n69481 69486\n87751 87798\n340 394\n79929 79929\n35967 35980\n52059 52115\n65883 65918\n37780 37817\n37155 37194\n77525 77572\n42423 42483\n99958 99981\n68069 68109\n10764 10770\n88858 88901\n51500 51503\n59803 59845\n92301 92309\n27316 27343\n41552 41612\n82281 82281\n98852 98897\n90017 90059\n89189 89245\n1069 1069\n68476 68491\n91225 91235\n9752 9754\n39582 39618\n68309 68330\n63768 63788\n1037 1053\n35213 35227\n42237 42287\n32602 32611\n5784 5816\n26989 26996\n85229 85278\n17118 17178\n75343 75383\n39257 39305\n82729 82761\n33377 33407\n99142 99142\n44072 44088\n24528 24577\n10425 10481\n55970 56000\n39552 39593\n54299 54356\n81106 81129\n63022 63073\n84999 85018\n84909 84912\n23202 23233\n14818 14861\n76013 76021\n42284 42330\n11080 11139\n93501 93512\n60235 60274\n42337 42382\n35311 35343\n72356 72362\n66085 66091\n39429 39479\n14030 14036\n28351 28387\n62910 62958\n6095 6128\n37868 37926\n23387 23443\n58245 58265\n69095 69151\n76217 76261\n5817 5863\n21274 21274\n1400 1415\n79220 79273\n61500 61529\n63871 63931\n87957 87975\n98355 98365\n9133 9150\n92041 92099\n39393 39438\n42499 42541\n88194 88197\n41896 41896\n87291 87334\n99557 99610\n58091 58114\n44258 44277\n53922 53932\n45450 45465\n68969 68989\n53753 53811\n9168 9176\n52372 52377\n28654 28658\n15606 15634\n70287 70324\n55131 55146\n26974 27008\n2962 2973\n21108 21109\n53340 53380\n25439 25488\n19219 19245\n25471 25499\n63519 63540\n45465 45502\n38217 38262\n50414 50460\n77389 77434\n34577 34598\n71907 71945\n27461 27495\n83280 83299\n13200 13239\n48076 48109\n28686 28696\n88592 88599\n58904 58959\n54376 54389\n52069 52082\n22171 22219\n58774 58800\n76336 76347\n54331 54339\n13088 13117\n3322 3358\n17317 17318\n57128 57188\n5790 5805\n42483 42501\n24228 24266\n78169 78197\n55135 55161\n99654 99691\n84387 84432\n14785 14818\n30364 30423\n25424 25440\n82172 82206\n93871 93899\n65789 65841\n97832 97833\n62138 62198\n66443 66443\n70470 70493\n97762 97783\n38053 38077\n22794 22800\n77255 77257\n98747 98783\n17993 18013\n65237 65255\n79583 79601\n9133 9162\n14484 14540\n72375 72420\n11275 11310\n40552 40563\n48324 48351\n64297 64338\n60181 60211\n18689 18741\n30471 30514\n56093 56098\n38055 38111\n60162 60218\n28549 28550\n50202 50213\n80514 80558\n16372 16376\n15267 15292\n84142 84177\n45212 45262\n11206 11224\n51853 51863\n82950 82963\n86529 86564\n73624 73655\n11780 11786\n83903 83936\n34404 34448\n97580 97614\n34359 34410\n62277 62298\n83946 84002\n35594 35639\n25056 25066\n37207 37257\n73067 73124\n6813 6835\n11706 11710\n4894 4912\n61005 61052\n92942 92984\n87626 87649\n55213 55225\n44585 44595\n18964 18989\n63406 63433\n97823 97840\n22635 22689\n88700 88742\n42082 42124\n79083 79101\n46953 46998\n51778 51792\n90549 90589\n83058 83104\n69515 69575\n3309 3320\n275 316\n93523 93531\n20504 20538\n13955 13998\n50253 50266\n12946 12987\n79594 79651\n99879 99890\n861 904\n71492 71529\n62866 62923\n57759 57806\n94745 94781\n86087 86136\n54063 54122\n95280 95312\n45260 45291\n94748 94782\n52292 52316\n91727 91746\n61198 61255\n82641 82642\n97469 97495\n26841 26884\n92493 92506\n65278 65286\n94803 94803\n42820 42863\n79918 79945\n48227 48255\n73137 73154\n75955 75963\n13929 13939\n5594 5648\n27149 27175\n66834 66853\n62579 62621\n14526 14530\n89493 89523\n90717 90732\n50389 50411\n54421 54473\n26064 26110\n31376 31387\n3868 3900\n91398 91445\n9576 9593\n61074 61092\n58235 58270\n96374 96414\n45453 45453\n2131 2142\n969 1008\n55313 55351\n13195 13222\n17504 17508\n22799 22849\n25137 25193\n54446 54502\n76923 76928\n88427 88456\n57384 57415\n64202 64256\n94811 94855\n17021 17075\n25166 25194\n74962 75010\n29350 29403\n33364 33391\n75704 75757\n4844 4903\n24998 25058\n20586 20613\n28539 28567\n88224 88225\n30523 30559\n2073 2085\n28491 28527\n42557 42578\n46719 46758\n51002 51053\n83648 83674\n34201 34225\n17522 17529\n9338 9355\n69859 69899\n2824 2866\n37438 37463\n64471 64473\n6479 6508\n74271 74287\n26869 26917\n97105 97122\n8926 8929\n97164 97216\n25766 25806\n81477 81479\n90735 90738\n83466 83517\n8295 8312\n39042 39042\n47561 47603\n38498 38499\n39463 39492\n38815 38872\n96996 97009\n51451 51495\n56416 56445\n20934 20994\n95109 95160\n60578 60632\n58497 58540\n55653 55699\n35465 35469\n62686 62715\n10344 10387\n75584 75643\n60803 60842\n25475 25531\n25166 25205\n70724 70756\n37518 37544\n41212 41272\n17848 17880\n88798 88825\n73465 73475\n91849 91871\n99135 99187\n66305 66324\n32318 32356\n78649 78699\n46983 47036\n8744 8790\n4589 4612\n55168 55179\n50547 50569\n13125 13146\n31930 31932\n71406 71449\n25500 25515\n28683 28715\n99009 99044\n21751 21783\n75737 75772\n62855 62896\n96949 96958\n63819 63854\n2584 2596\n89276 89280\n51620 51630\n70065 70104\n97634 97688\n44669 44701\n74007 74034\n37672 37689\n80638 80687\n29628 29648\n58133 58191\n64516 64545\n23792 23833\n59094 59141\n91699 91718\n72511 72522\n78415 78451\n10417 10451\n62972 62990\n17848 17908\n1831 1857\n55742 55767\n10914 10940\n55445 55485\n40233 40293\n52467 52512\n58115 58175\n55080 55130\n23395 23419\n2558 2585\n70750 70793\n90961 91008\n76946 76995\n96753 96800\n38583 38627\n57583 57603\n6710 6764\n90402 90459\n52231 52267\n17376 17428\n83689 83717\n6893 6914\n9607 9660\n72711 72736\n22263 22263\n87363 87387\n82339 82374\n12198 12202\n21790 21849\n81108 81108\n11726 11785\n43697 43738\n107 127\n59515 59566\n21375 21435\n61084 61127\n2251 2259\n71891 71948\n62027 62032\n54269 54292\n82481 82536\n86622 86641\n42820 42869\n59383 59419\n14440 14441\n48730 48740\n85532 85550\n56056 56063\n95898 95924\n72657 72688\n6821 6858\n48073 48095\n9015 9062\n18123 18153\n53790 53836\n90210 90242\n81062 81072\n64174 64177\n7820 7878\n11354 11366\n30433 30471\n73387 73391\n58028 58062\n95471 95527\n33937 33958\n14080 14100\n94021 94037\n55858 55914\n70292 70314\n86684 86711\n47253 47272\n95835 95860\n17455 17458\n21957 21970\n38602 38620\n30469 30482\n59318 59376\n6002 6012\n93472 93472\n84659 84713\n15437 15482\n71066 71089\n16524 16584\n190 247\n49704 49748\n58033 58043\n89666 89704\n65441 65484\n81049 81084\n82884 82891\n21623 21656\n11348 11377\n75853 75862\n89780 89820\n93413 93470\n91897 91913\n98138 98149\n71161 71216\n87569 87573\n6844 6847\n14565 14574\n12512 12541\n3792 3844\n10650 10664\n59086 59096\n24769 24775\n3860 3880\n42628 42645\n16389 16401\n15996 15999\n41447 41480\n96937 96943\n19380 19393\n59851 59880\n40044 40099\n51796 51852\n25873 25885\n77148 77196\n23350 23391\n20022 20080\n10622 10624\n24368 24389\n63420 63443\n3781 3805\n2418 2431\n69260 69298\n83280 83327\n11491 11544\n28702 28703\n45317 45335\n49305 49352\n67411 67420\n31853 31895\n81406 81453\n73366 73424\n44506 44543\n16307 16308\n70368 70374\n45901 45918\n15587 15636\n59317 59359\n50784 50843\n87112 87151\n25836 25894\n10518 10548\n32755 32770\n73609 73667\n20780 20792\n30209 30242\n5219 5242\n61654 61701\n32128 32177\n26008 26030\n53260 53266\n23722 23758\n83969 83973\n28666 28666\n46797 46850\n29609 29657\n7786 7833\n45617 45637\n32364 32392\n80067 80122\n10214 10214\n17168 17221\n64558 64601\n44538 44597\n86552 86601\n70400 70448\n56733 56757\n20089 20132\n58141 58173\n41577 41592\n74364 74372\n61788 61799\n45479 45537\n37857 37869\n67627 67632\n93301 93317\n48783 48807\n92031 92060\n36115 36124\n40302 40304\n74393 74411\n37154 37208\n50251 50258\n53902 53906\n34203 34226\n7171 7214\n3170 3209\n52987 52998\n95665 95678\n34290 34303\n88109 88163\n79692 79708\n1732 1760\n64295 64316\n64101 64153\n86335 86363\n78817 78824\n46748 46773\n92117 92171\n6410 6441\n40868 40905\n93692 93692\n90327 90332\n63291 63347\n44533 44533\n16608 16615\n14175 14188\n77941 77995\n61019 61028\n19058 19069\n20059 20109\n50982 51024\n77448 77502\n5203 5236\n40726 40761\n8195 8225\n47961 48004\n74903 74946\n99953 99973\n69316 69340\n21828 21886\n28826 28886\n41911 41927\n77247 77273\n28102 28110\n93384 93417\n24348 24394\n88773 88820\n47772 47799\n16806 16808\n7487 7514\n62706 62730\n86173 86209\n50802 50811\n22797 22844\n1097 1141\n18488 18542\n31878 31926\n35541 35544\n41047 41052\n16655 16680\n41829 41878\n37878 37881\n40771 40818\n51969 51994\n81248 81275\n74813 74828\n75435 75455\n12915 12960\n61471 61524\n54497 54518\n96265 96308\n30225 30282\n25851 25910\n6128 6137\n55015 55068\n91200 91212\n92260 92280\n52980 52983\n68300 68310\n29840 29872\n24244 24271\n90093 90116\n53506 53521\n76760 76814\n37202 37221\n53436 53495\n705 711\n62725 62770\n82725 82768\n53606 53614\n6191 6216\n13360 13367\n79729 79741\n79142 79177\n11866 11874\n9132 9171\n4906 4908\n89994 90013\n25294 25311\n73011 73059\n22525 22530\n4184 4190\n79101 79125\n76433 76489\n60081 60095\n43569 43580\n57412 57426\n75621 75622\n69134 69176\n8460 8468\n28232 28257\n90707 90723\n93558 93569\n55974 55974\n48568 48571\n9155 9170\n15175 15204\n95458 95486\n31318 31357\n97467 97492\n11467 11481\n8840 8878\n32715 32758\n67887 67918\n66198 66199\n79746 79791\n33482 33517\n90549 90555\n28441 28473\n22611 22611\n69373 69398\n79818 79869\n77547 77566\n10754 10806\n80634 80686\n39533 39564\n91094 91129\n94346 94350\n40671 40720\n78002 78034\n87116 87154\n33102 33150\n90231 90268\n6883 6924\n57902 57938\n30127 30153\n78350 78356\n80569 80597\n45222 45238\n76696 76745\n33893 33921\n25589 25611\n43942 43965\n84899 84923\n17060 17061\n64941 64945\n35416 35444\n81354 81391\n60360 60393\n53260 53266\n83884 83887\n67242 67267\n23776 23776\n81520 81542\n67278 67294\n30075 30126\n73490 73493\n26687 26690\n92525 92573\n27187 27216\n77011 77045\n67448 67506\n69412 69414\n61998 62054\n78028 78074\n66585 66628\n19832 19886\n29759 29809\n98766 98821\n14007 14030\n49442 49467\n22699 22732\n8526 8536\n69944 69951\n36019 36061\n89577 89610\n85998 86001\n7910 7916\n7890 7933\n64763 64800\n48747 48758\n39164 39188\n60274 60288\n4800 4844\n7380 7388\n74724 74739\n92548 92557\n4089 4099\n84231 84263\n5765 5819\n34468 34470\n85375 85390\n94404 94458\n35740 35795\n99250 99307\n65668 65726\n16566 16566\n45730 45761\n1568 1602\n82249 82303\n81229 81275\n76462 76493\n65992 66044\n10724 10774\n29073 29102\n93326 93349\n43130 43153\n8619 8654\n27271 27302\n55772 55781\n25246 25299\n18943 18981\n31710 31710\n91342 91383\n63901 63917\n69921 69942\n21338 21348\n87958 88010\n99101 99155\n29308 29358\n79801 79805\n23088 23138\n36464 36492\n80119 80153\n35027 35034\n3731 3738\n74813 74852\n82906 82910\n34353 34355\n27083 27130\n84928 84935\n28232 28254\n63857 63875\n43474 43495\n43276 43324\n91775 91820\n79351 79390\n17780 17784\n88412 88418\n13708 13756\n90963 90964\n90117 90162\n71832 71855\n56805 56818\n39211 39219\n85770 85807\n44473 44505\n17328 17362\n6869 6928\n82636 82656\n38421 38456\n20880 20932\n88804 88830\n21317 21344\n91223 91239\n39252 39265\n9304 9308\n21856 21868\n22574 22575\n9627 9648\n88012 88018\n47002 47028\n48484 48531\n54233 54284\n22661 22691\n48328 48340\n77292 77301\n53802 53851\n62114 62117\n24681 24719\n28880 28902\n29572 29622\n71485 71521\n65630 65644\n20237 20265\n22405 22455\n72233 72234\n40630 40641\n87433 87490\n66559 66562\n25175 25206\n25502 25560\n23579 23598\n13233 13261\n2461 2512\n30253 30308\n53451 53497\n86611 86621\n90893 90942\n52484 52533\n43672 43723\n8459 8509\n29613 29637\n29549 29588\n64810 64820\n47241 47298\n88542 88549\n96689 96748\n16027 16063\n55416 55421\n28428 28477\n85267 85296\n3502 3548\n99296 99344\n5288 5338\n5754 5772\n29891 29899\n21381 21410\n87896 87950\n42099 42126\n71166 71205\n42190 42204\n10373 10423\n65569 65599\n68942 68989\n6229 6229\n53291 53328\n20815 20875\n51013 51047\n44277 44321\n68312 68319\n14513 14523\n82982 82988\n45742 45778\n45500 45535\n79655 79655\n57887 57933\n21212 21227\n21996 22047\n6178 6179\n56283 56284\n735 770\n39145 39147\n56734 56750\n16994 17013\n54731 54735\n85931 85953\n67532 67565\n68584 68617\n95058 95067\n15249 15308\n47676 47693\n70275 70331\n76283 76316\n54796 54830\n87445 87480\n56398 56454\n86189 86212\n53182 53190\n99779 99813\n44169 44202\n89801 89861\n89206 89239\n20220 20252\n3941 3950\n43014 43066\n17249 17255\n66878 66914\n206 265\n14966 14993\n4435 4437\n53328 53386\n30756 30790\n77472 77505\n70135 70163\n15027 15079\n36429 36464\n73383 73397\n42135 42160\n81879 81902\n91567 91588\n45531 45539\n83141 83183\n11569 11620\n93241 93264\n27294 27340\n82971 82977\n45768 45797\n33536 33537\n15011 15046\n79879 79926\n271 329\n84443 84463\n80177 80180\n8294 8322\n33544 33557\n4314 4322\n15880 15939\n76990 77001\n20054 20070\n55463 55517\n92002 92041\n3907 3966\n66004 66045\n55302 55338\n89995 90053\n23660 23668\n22198 22199\n60541 60565\n37742 37748\n21715 21772\n42473 42505\n10141 10180\n86128 86159\n17878 17894\n3688 3693\n79331 79361\n39123 39163\n18513 18516\n46140 46145\n1348 1388\n47279 47337\n50837 50848\n20595 20629\n25811 25823\n59101 59142\n19496 19518\n97973 97994\n62392 62429\n99834 99872\n97540 97544\n65939 65997\n37828 37863\n44061 44118\n64475 64508\n24871 24904\n40679 40716\n95676 95697\n18546 18564\n8109 8162\n13276 13335\n12693 12751\n42720 42776\n48908 48957\n65679 65695\n71871 71912\n89991 90029\n31827 31837\n47305 47356\n80326 80332\n64495 64553\n53576 53615\n34986 35009\n60975 61014\n86621 86660\n14207 14207\n18638 18680\n64720 64774\n9079 9114\n2920 2967\n10832 10865\n16710 16762\n2949 2957\n23402 23452\n9420 9422\n50121 50159\n15198 15244\n86111 86147\n87696 87712\n58333 58339\n84213 84215\n12557 12598\n47687 47727\n14024 14044\n86380 86423\n31926 31926\n83459 83493\n55028 55053\n28411 28445\n98603 98659\n22233 22268\n3596 3603\n53189 53231\n75884 75891\n34257 34311\n95353 95413\n15712 15743\n22192 22221\n77668 77677\n84525 84578\n81414 81474\n26583 26584\n41794 41794\n31540 31581\n69170 69226\n61270 61297\n66071 66124\n29552 29612\n84014 84035\n81398 81407\n71097 71119\n38231 38231\n24975 24978\n93699 93726\n66479 66491\n54994 55026\n24854 24871\n60793 60830\n18222 18258\n18297 18357\n98031 98039\n36300 36303\n22409 22465\n86303 86335\n83499 83501\n62076 62086\n53587 53613\n75702 75751\n65354 65409\n8247 8268\n40743 40803\n90224 90276\n80802 80839\n54562 54600\n19550 19591\n76429 76450\n85581 85614\n48766 48779\n49824 49832\n50871 50885\n31586 31596\n78001 78020\n88774 88810\n75148 75195\n3762 3766\n95185 95231\n39198 39233\n31114 31131\n30762 30774\n63284 63322\n17774 17810\n81914 81945\n22768 22800\n96095 96117\n24153 24198\n41121 41179\n86411 86423\n16878 16884\n44606 44662\n64141 64172\n57774 57802\n7586 7609\n50166 50181\n68031 68031\n48745 48785\n32247 32283\n64972 65028\n33317 33329\n21185 21193\n52999 53007\n5464 5497\n72437 72468\n73925 73979\n26231 26250\n53511 53515\n59076 59128\n40060 40115\n17475 17516",
        expected:
          "29 45 72 130 190 265 271 329 340 394 426 450 560 596 642 650 705 711 735 770 861 904 911 941 969 1013 1037 1053 1069 1069 1097 1141 1292 1388 1400 1415 1518 1612 1624 1654 1702 1713 1732 1760 1831 1857 2073 2085 2131 2186 2251 2259 2418 2431 2461 2522 2558 2611 2824 2876 2920 2973 3098 3123 3136 3209 3309 3320 3322 3358 3502 3548 3596 3603 3688 3693 3719 3778 3781 3844 3860 3900 3907 3966 4089 4099 4184 4190 4314 4322 4432 4492 4589 4612 4739 4786 4800 4912 4954 4979 5203 5242 5288 5338 5464 5497 5550 5573 5594 5648 5754 5863 6002 6012 6058 6085 6095 6137 6178 6179 6191 6216 6229 6229 6410 6441 6479 6508 6518 6518 6674 6764 6813 6858 6869 6928 7066 7074 7109 7115 7169 7231 7380 7388 7487 7514 7586 7609 7786 7878 7890 7933 8103 8162 8195 8225 8247 8268 8294 8322 8459 8509 8526 8536 8619 8654 8744 8790 8840 8878 8899 8937 9015 9062 9079 9114 9132 9176 9233 9282 9304 9308 9338 9405 9420 9422 9576 9593 9607 9660 9689 9721 9752 9754 10141 10180 10214 10214 10344 10481 10518 10548 10622 10624 10650 10664 10724 10806 10832 10865 10914 10940 10951 10969 10973 11022 11080 11139 11206 11224 11275 11310 11348 11377 11451 11544 11569 11620 11706 11710 11726 11786 11866 11874 12069 12111 12198 12202 12280 12337 12381 12414 12512 12541 12557 12598 12693 12751 12915 12987 13088 13117 13125 13146 13195 13261 13276 13335 13360 13367 13432 13506 13708 13756 13929 13939 13955 13998 14007 14044 14080 14100 14175 14188 14207 14207 14373 14429 14440 14441 14484 14540 14565 14574 14780 14861 14864 14871 14966 14993 15011 15079 15175 15244 15249 15308 15437 15482 15587 15636 15686 15768 15834 15837 15880 15939 15996 15999 16027 16063 16164 16220 16307 16308 16372 16376 16389 16401 16489 16505 16524 16584 16608 16615 16655 16680 16710 16762 16787 16810 16851 16901 16918 16976 16994 17013 17021 17086 17118 17221 17249 17255 17288 17362 17376 17458 17475 17516 17522 17529 17774 17810 17848 17908 17993 18013 18106 18153 18196 18258 18297 18357 18488 18542 18546 18564 18638 18680 18689 18741 18766 18826 18943 18989 18990 18994 19036 19036 19058 19069 19219 19245 19260 19270 19324 19393 19496 19518 19550 19591 19695 19764 19825 19886 20022 20132 20196 20265 20473 20474 20501 20538 20586 20629 20780 20792 20815 20875 20880 20932 20934 20994 21108 21109 21185 21193 21212 21227 21264 21273 21274 21274 21317 21348 21375 21435 21623 21656 21670 21783 21790 21886 21957 21970 21996 22047 22171 22221 22233 22268 22278 22336 22405 22465 22525 22578 22611 22611 22635 22691 22699 22732 22768 22849 23088 23138 23172 23181 23202 23233 23350 23452 23491 23530 23579 23598 23660 23668 23722 23758 23776 23776 23792 23833 24153 24198 24228 24271 24290 24291 24348 24394 24528 24577 24611 24616 24681 24719 24769 24775 24854 24904 24975 24978 24998 25066 25123 25311 25424 25560 25564 25618 25766 25806 25811 25823 25836 25910 25973 25982 26008 26030 26064 26110 26231 26250 26583 26584 26687 26690 26841 26917 26974 27008 27043 27130 27149 27175 27187 27216 27271 27343 27378 27433 27461 27495 27553 27652 27941 27971 28102 28110 28232 28257 28328 28335 28351 28387 28411 28477 28491 28527 28539 28567 28654 28658 28666 28666 28683 28715 28826 28902 29073 29112 29308 29408 29549 29657 29759 29809 29840 29872 29885 29901 30075 30126 30127 30153 30209 30308 30364 30423 30433 30514 30523 30559 30756 30790 30957 30972 31114 31133 31267 31272 31318 31387 31540 31581 31586 31596 31710 31710 31827 31837 31853 31926 31930 31932 32128 32177 32247 32283 32318 32360 32364 32392 32602 32611 32658 32706 32715 32793 33102 33164 33317 33329 33364 33407 33482 33517 33536 33537 33544 33557 33735 33757 33893 33921 33937 33958 34143 34188 34201 34226 34257 34311 34353 34355 34359 34448 34468 34470 34577 34598 34936 34981 34986 35009 35027 35034 35133 35168 35196 35245 35311 35343 35416 35444 35465 35469 35541 35544 35594 35639 35712 35795 35967 35980 36019 36061 36066 36110 36115 36124 36242 36250 36300 36303 36397 36492 37154 37267 37301 37308 37438 37463 37518 37544 37672 37689 37742 37748 37779 37817 37828 37926 37986 38010 38053 38111 38181 38206 38217 38262 38306 38318 38324 38325 38392 38456 38494 38523 38529 38556 38583 38627 38815 38872 39038 39038 39042 39042 39082 39117 39119 39163 39164 39188 39198 39233 39252 39305 39375 39492 39506 39508 39533 39618 39983 40040 40044 40115 40233 40293 40302 40304 40310 40320 40552 40611 40615 40623 40630 40642 40671 40720 40726 40818 40868 40905 41047 41052 41121 41179 41212 41272 41447 41480 41488 41498 41552 41612 41794 41794 41829 41878 41880 41903 41911 41927 42072 42126 42135 42160 42190 42204 42237 42330 42337 42382 42423 42541 42557 42578 42614 42645 42720 42776 42820 42886 42975 42983 43014 43066 43130 43153 43276 43324 43474 43495 43569 43580 43672 43738 43864 43892 43942 43965 44061 44118 44169 44202 44258 44321 44473 44505 44506 44597 44606 44662 44669 44734 44794 44807 45121 45164 45212 45291 45317 45335 45360 45413 45450 45539 45617 45637 45730 45797 45901 45918 46140 46145 46302 46320 46719 46773 46797 46850 46953 47036 47173 47189 47241 47356 47455 47474 47561 47603 47652 47662 47670 47727 47772 47799 47961 48004 48046 48069 48073 48109 48216 48255 48324 48351 48484 48531 48568 48571 48730 48740 48745 48807 48908 48957 48993 49002 49305 49352 49386 49435 49442 49467 49561 49617 49704 49748 49819 49853 50121 50159 50166 50181 50202 50213 50251 50266 50358 50412 50414 50460 50547 50569 50602 50615 50662 50725 50761 50778 50784 50848 50871 50885 50982 51053 51194 51211 51253 51267 51451 51505 51620 51630 51778 51792 51796 51852 51853 51863 51969 51994 52059 52115 52231 52267 52283 52316 52331 52338 52372 52377 52458 52533 52624 52656 52705 52753 52980 52983 52987 53022 53115 53124 53182 53231 53260 53266 53291 53386 53436 53497 53506 53521 53576 53615 53635 53638 53674 53725 53753 53851 53902 53906 53922 53932 53995 54018 54063 54148 54233 54356 54376 54389 54421 54518 54562 54600 54655 54659 54731 54735 54782 54830 54930 54974 54994 55068 55080 55130 55131 55161 55168 55179 55213 55225 55302 55351 55416 55421 55445 55517 55653 55699 55742 55767 55772 55781 55821 55847 55858 55914 55966 56000 56056 56063 56093 56098 56283 56284 56398 56470 56733 56757 56805 56818 56853 56908 57128 57188 57384 57426 57583 57603 57759 57806 57887 57938 58028 58062 58091 58114 58115 58191 58235 58270 58333 58339 58438 58482 58497 58540 58774 58800 58804 58833 58904 58959 59076 59142 59221 59243 59317 59376 59377 59419 59445 59475 59515 59566 59803 59845 59849 59890 60081 60095 60162 60218 60235 60288 60323 60425 60541 60565 60578 60632 60793 60842 60975 61052 61074 61150 61198 61255 61270 61297 61409 61416 61441 61529 61610 61634 61654 61701 61788 61799 61802 61818 61857 61913 61998 62054 62076 62086 62114 62117 62138 62198 62277 62298 62392 62429 62579 62621 62686 62770 62855 62958 62972 62990 63017 63073 63171 63175 63202 63253 63284 63347 63406 63443 63519 63540 63768 63788 63819 63854 63857 63948 64101 64172 64174 64177 64202 64256 64295 64338 64383 64443 64471 64473 64475 64557 64558 64601 64720 64800 64810 64820 64941 64945 64972 65028 65205 65230 65237 65255 65278 65286 65354 65409 65441 65484 65528 65539 65569 65599 65630 65644 65668 65726 65789 65841 65883 65918 65939 66045 66065 66124 66172 66178 66198 66199 66305 66324 66443 66443 66452 66497 66559 66562 66585 66628 66834 66853 66878 66914 66939 66994 67162 67211 67242 67267 67278 67294 67386 67422 67448 67506 67532 67565 67627 67632 67887 67918 68031 68031 68069 68109 68300 68330 68451 68510 68584 68617 68622 68639 68918 68989 69095 69226 69260 69298 69316 69340 69373 69398 69412 69414 69466 69486 69515 69575 69859 69968 70065 70104 70135 70163 70264 70331 70345 70348 70368 70374 70400 70448 70451 70468 70470 70533 70724 70793 71041 71090 71097 71119 71161 71216 71282 71328 71336 71346 71406 71449 71485 71529 71832 71855 71871 71948 72054 72061 72233 72234 72269 72313 72356 72362 72375 72420 72437 72468 72511 72522 72591 72624 72657 72688 72711 72736 72880 72924 73011 73059 73067 73124 73128 73189 73366 73424 73465 73498 73609 73667 73876 73889 73925 73979 74007 74034 74271 74287 74364 74372 74393 74411 74637 74681 74724 74739 74813 74852 74903 74946 74962 75010 75027 75030 75148 75195 75343 75383 75399 75455 75584 75643 75702 75772 75853 75862 75884 75891 75893 75950 75955 75963 75982 75996 76013 76021 76097 76155 76217 76261 76283 76316 76336 76347 76429 76493 76557 76561 76696 76745 76760 76814 76923 76928 76945 77001 77011 77045 77088 77145 77148 77196 77247 77273 77292 77301 77389 77434 77448 77505 77525 77572 77640 77677 77694 77728 77768 77771 77907 77934 77935 77995 78001 78074 78169 78197 78350 78356 78415 78451 78595 78628 78649 78699 78817 78824 78837 78887 78907 78966 78995 79030 79082 79125 79142 79177 79220 79273 79331 79390 79450 79504 79583 79651 79655 79655 79692 79708 79729 79741 79746 79791 79801 79805 79818 79869 79879 79945 80002 80056 80067 80153 80170 80213 80265 80275 80326 80332 80514 80558 80569 80597 80634 80687 80802 80839 80862 80910 81049 81084 81088 81102 81106 81129 81229 81275 81354 81391 81398 81474 81477 81479 81520 81542 81879 81902 81914 81945 82172 82206 82249 82303 82339 82374 82451 82459 82481 82536 82636 82691 82725 82768 82884 82891 82906 82910 82950 82963 82971 82977 82982 82988 83058 83104 83141 83183 83274 83327 83459 83517 83648 83674 83689 83717 83810 83862 83884 83887 83903 83936 83946 84002 84014 84035 84142 84177 84213 84215 84231 84263 84387 84463 84478 84514 84525 84578 84628 84634 84659 84713 84731 84766 84899 84923 84928 84935 84949 84956 84999 85018 85229 85296 85375 85390 85532 85550 85581 85614 85770 85807 85845 85849 85931 85953 85998 86001 86028 86045 86087 86159 86173 86212 86303 86363 86380 86423 86529 86601 86611 86660 86684 86711 87112 87154 87291 87334 87363 87387 87433 87490 87569 87573 87626 87649 87696 87717 87751 87811 87896 87950 87957 88010 88012 88018 88109 88163 88194 88197 88224 88225 88412 88418 88427 88456 88485 88513 88519 88552 88592 88599 88695 88742 88773 88830 88858 88901 89189 89245 89276 89280 89493 89556 89577 89610 89666 89704 89780 89861 89991 90059 90093 90116 90117 90162 90210 90276 90324 90361 90376 90382 90402 90459 90549 90589 90707 90732 90735 90738 90893 90942 90961 91008 91094 91129 91200 91212 91223 91239 91342 91383 91398 91445 91567 91588 91659 91718 91727 91746 91775 91820 91849 91871 91897 91913 91933 91968 92002 92099 92117 92171 92241 92295 92301 92309 92455 92465 92480 92573 92626 92654 92692 92714 92942 92984 93241 93264 93301 93319 93324 93363 93384 93470 93472 93472 93501 93512 93523 93531 93558 93569 93677 93726 93817 93859 93871 93899 93970 93994 94021 94072 94294 94315 94346 94350 94404 94458 94745 94782 94803 94803 94811 94855 94997 95006 95058 95067 95109 95160 95185 95231 95280 95336 95353 95413 95458 95527 95665 95697 95781 95831 95835 95860 95898 95924 96095 96117 96265 96308 96352 96414 96471 96473 96689 96748 96753 96800 96826 96834 96937 96943 96949 96958 96978 96989 96996 97009 97105 97122 97164 97216 97467 97495 97540 97544 97580 97614 97634 97688 97762 97783 97823 97840 97973 97994 98031 98039 98138 98149 98337 98365 98603 98659 98747 98821 98852 98897 99009 99044 99101 99219 99250 99344 99557 99610 99632 99641 99654 99691 99779 99813 99834 99872 99879 99890 99953 99981",
      },
    ],
    hints: [
      "Two closed ranges [a, b] and [c, d] belong together when a ≤ d and c ≤ b.",
      "Merging any overlapping pair and repeating until nothing changes is correct, but slow. Which order makes the merge candidates sit next to each other?",
      "After sorting by start, the next slot can only join the block you are currently building — never an earlier, closed one.",
      "Keep the current block's end. If the next start is ≤ that end, stretch the end to the max; otherwise emit the block and start fresh.",
    ],
    solutions: [
      {
        title: "Merge any overlapping pair until stable",
        order: 1,
        intuition:
          "The definition suggests a direct procedure: find two slots that overlap, replace them with their union, and repeat. When no pair overlaps, the remaining slots are the blocks. It works, but every merge restarts a quadratic search.",
        approach: [
          "Copy the slots into a working list.",
          "Search all pairs for an overlap; if found, replace the pair with its union and restart the search.",
          "When a full search finds nothing, sort the blocks by start and flatten them.",
        ],
        code: {
          PYTHON: `def mergeSlots(slots: List[List[int]]) -> List[int]:
    blocks = [list(s) for s in slots]
    merged = True
    while merged:
        merged = False
        for i in range(len(blocks)):
            for j in range(i + 1, len(blocks)):
                a, b = blocks[i], blocks[j]
                if a[0] <= b[1] and b[0] <= a[1]:
                    blocks[i] = [min(a[0], b[0]), max(a[1], b[1])]
                    blocks.pop(j)
                    merged = True
                    break
            if merged:
                break

    out = []
    for start, end in sorted(blocks):
        out += [start, end]
    return out`,
          JAVA: `class Solution {
    public int[] mergeSlots(int[][] slots) {
        List<int[]> blocks = new ArrayList<>();
        for (int[] s : slots) blocks.add(new int[] {s[0], s[1]});

        boolean merged = true;
        while (merged) {
            merged = false;
            search:
            for (int i = 0; i < blocks.size(); i++) {
                for (int j = i + 1; j < blocks.size(); j++) {
                    int[] a = blocks.get(i), b = blocks.get(j);
                    if (a[0] <= b[1] && b[0] <= a[1]) {
                        blocks.set(i, new int[] {Math.min(a[0], b[0]), Math.max(a[1], b[1])});
                        blocks.remove(j);
                        merged = true;
                        break search;
                    }
                }
            }
        }

        blocks.sort((x, y) -> Integer.compare(x[0], y[0]));
        int[] out = new int[blocks.size() * 2];
        for (int k = 0; k < blocks.size(); k++) {
            out[2 * k] = blocks.get(k)[0];
            out[2 * k + 1] = blocks.get(k)[1];
        }
        return out;
    }
}`,
        },
        timeComplexity: "O(n³) in the worst case",
        spaceComplexity: "O(n)",
        edgeCases: ["A single slot.", "Slots that only touch at a boundary."],
        commonMistakes: [
          "Forgetting to restart after a merge, so a newly widened block misses partners.",
        ],
      },
      {
        title: "Optimal: sort by start, extend or emit",
        order: 2,
        intuition:
          "Sorted by start, every slot that could join the current block appears before any slot that cannot: once a start exceeds the block's end, all later starts do too. So the block can be closed for good, and a single sweep builds every block.",
        approach: [
          "Sort the slots by start.",
          "Open a block with the first slot.",
          "For each next slot, if its start ≤ the block's end, set end = max(end, slot end).",
          "Otherwise append the block to the output and open a new one with this slot.",
          "Append the final block.",
        ],
        code: {
          PYTHON: `def mergeSlots(slots: List[List[int]]) -> List[int]:
    blocks = []
    for start, end in sorted(slots):
        if blocks and start <= blocks[-1][1]:
            # Overlaps or touches the open block: stretch it.
            blocks[-1][1] = max(blocks[-1][1], end)
        else:
            blocks.append([start, end])

    out = []
    for start, end in blocks:
        out += [start, end]
    return out`,
          JAVA: `class Solution {
    public int[] mergeSlots(int[][] slots) {
        int[][] ordered = slots.clone();
        Arrays.sort(ordered, (a, b) -> Integer.compare(a[0], b[0]));

        List<int[]> blocks = new ArrayList<>();
        for (int[] slot : ordered) {
            if (!blocks.isEmpty() && slot[0] <= blocks.get(blocks.size() - 1)[1]) {
                int[] last = blocks.get(blocks.size() - 1);
                last[1] = Math.max(last[1], slot[1]);
            } else {
                blocks.add(new int[] {slot[0], slot[1]});
            }
        }

        int[] out = new int[blocks.size() * 2];
        for (int k = 0; k < blocks.size(); k++) {
            out[2 * k] = blocks.get(k)[0];
            out[2 * k + 1] = blocks.get(k)[1];
        }
        return out;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A slot contained entirely inside another — the end must not shrink.",
          "Zero-length slots such as [5, 5].",
          "Slots that touch at one hour, which merge.",
        ],
        commonMistakes: [
          "Setting end = slot end instead of max(end, slot end), which truncates a block when a short slot sits inside a long one.",
          "Forgetting to emit the last open block.",
          "Using < instead of ≤, which leaves touching slots unmerged.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "slot-in-a-booking",
    title: "Slot In a New Booking",
    difficulty: "MEDIUM",
    learningObjective:
      "Exploit an already sorted, disjoint interval list to insert in one linear pass with three phases: before, overlapping, after.",
    topics: ["intervals", "arrays"],
    patterns: ["merge-intervals"],
    statement: [
      para(
        "A recording studio's calendar is a list of booked blocks, sorted by start, with no two blocks overlapping or touching. Each block [start, end] is closed: both ends are booked."
      ),
      para(
        "A new booking arrives. Add it to the calendar, merging it with every block it overlaps or touches, and return the updated calendar flattened into one list: start₁, end₁, start₂, end₂, … The result must still be sorted and disjoint."
      ),
      example(
        "calendar = [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], booking = [4, 8]",
        "[1, 2, 3, 10, 12, 16]",
        [
          { state: "[1,2]", note: "ends before 4 — copy unchanged" },
          {
            state: "[3,5] [6,7] [8,10]",
            note: "each reaches into [4,8] — absorb them",
          },
          { state: "merged [3,10]", note: "start = min(3,4), end = max(10,8)" },
          { state: "[12,16]", note: "starts after 10 — copy unchanged" },
        ],
        "Before, overlapping, after"
      ),
    ],
    constraints: [
      "0 ≤ calendar.length ≤ 10000",
      "calendar is sorted by start; blocks neither overlap nor touch",
      "0 ≤ start ≤ end ≤ 1000000 for every block and for the booking",
      "Return value: blocks flattened as [s1, e1, s2, e2, ...].",
    ],
    signature: {
      params: ["int[][]", "int[]"],
      paramNames: ["calendar", "booking"],
      returns: "int[]",
      functionName: "insertBooking",
    },
    tests: [
      {
        input: "2\n1 3\n6 9\n2 5",
        expected: "1 5 6 9",
        isSample: true,
        explanation: "[2,5] overlaps [1,3], giving [1,5]; [6,9] is untouched.",
      },
      {
        input: "5\n1 2\n3 5\n6 7\n8 10\n12 16\n4 8",
        expected: "1 2 3 10 12 16",
        isSample: true,
        explanation: "[3,5], [6,7] and [8,10] all fold into [3,10].",
      },
      {
        input: "0\n4 8",
        expected: "4 8",
      },
      {
        input: "1\n5 7\n1 2",
        expected: "1 2 5 7",
      },
      {
        input: "1\n5 7\n8 9",
        expected: "5 7 8 9",
      },
      {
        input: "1\n1 5\n2 3",
        expected: "1 5",
      },
      {
        input: "1\n1 5\n5 7",
        expected: "1 7",
      },
      {
        input: "2\n1 2\n4 5\n0 10",
        expected: "0 10",
      },
      {
        input: "2\n3 4\n8 9\n5 6",
        expected: "3 4 5 6 8 9",
      },
      {
        input:
          "900\n7 11\n28 41\n59 71\n80 83\n89 89\n102 106\n113 124\n138 147\n149 161\n163 169\n170 182\n196 199\n200 200\n215 229\n243 246\n261 267\n278 282\n285 300\n312 320\n340 350\n355 364\n378 381\n384 388\n393 407\n426 426\n441 443\n459 466\n470 476\n478 478\n493 505\n525 525\n527 529\n539 541\n547 556\n576 583\n585 589\n607 616\n634 645\n648 660\n663 671\n672 676\n694 705\n711 717\n720 721\n730 744\n755 764\n775 777\n781 788\n794 802\n804 813\n828 837\n844 859\n877 886\n889 899\n914 915\n916 927\n941 947\n966 972\n990 991\n997 1004\n1007 1020\n1021 1027\n1036 1046\n1056 1064\n1084 1098\n1107 1120\n1126 1135\n1137 1138\n1155 1160\n1165 1169\n1172 1175\n1186 1196\n1199 1201\n1221 1229\n1241 1253\n1266 1273\n1279 1280\n1287 1288\n1289 1289\n1305 1312\n1316 1318\n1329 1342\n1346 1350\n1362 1374\n1386 1394\n1399 1410\n1421 1436\n1456 1468\n1472 1479\n1485 1490\n1498 1498\n1511 1523\n1531 1536\n1550 1555\n1569 1578\n1596 1598\n1618 1618\n1630 1631\n1638 1653\n1668 1669\n1685 1694\n1713 1713\n1721 1733\n1749 1753\n1768 1775\n1781 1790\n1804 1807\n1826 1837\n1853 1858\n1868 1874\n1884 1896\n1903 1913\n1925 1934\n1945 1951\n1970 1985\n1986 1996\n2009 2023\n2031 2037\n2044 2047\n2057 2063\n2072 2081\n2083 2086\n2087 2090\n2109 2109\n2128 2135\n2151 2153\n2160 2173\n2177 2177\n2184 2198\n2216 2221\n2241 2254\n2258 2272\n2288 2302\n2319 2326\n2333 2336\n2354 2357\n2366 2379\n2396 2406\n2409 2420\n2435 2437\n2449 2455\n2466 2469\n2488 2500\n2507 2509\n2519 2532\n2538 2545\n2546 2549\n2564 2573\n2576 2580\n2581 2581\n2599 2600\n2613 2620\n2634 2645\n2654 2664\n2678 2682\n2700 2712\n2728 2738\n2739 2740\n2760 2763\n2769 2778\n2798 2802\n2818 2832\n2842 2842\n2850 2860\n2862 2877\n2892 2897\n2900 2905\n2924 2928\n2939 2953\n2962 2970\n2978 2992\n3000 3008\n3027 3031\n3038 3040\n3057 3067\n3072 3078\n3082 3096\n3107 3108\n3125 3138\n3152 3166\n3171 3182\n3189 3196\n3215 3220\n3231 3235\n3240 3248\n3250 3252\n3262 3276\n3287 3290\n3306 3308\n3313 3319\n3333 3336\n3345 3357\n3362 3366\n3385 3391\n3403 3416\n3428 3443\n3445 3450\n3454 3465\n3485 3497\n3500 3510\n3526 3528\n3539 3540\n3553 3560\n3572 3583\n3601 3609\n3613 3623\n3641 3645\n3664 3673\n3674 3683\n3695 3710\n3712 3721\n3723 3736\n3741 3756\n3759 3761\n3769 3775\n3787 3788\n3805 3811\n3829 3843\n3852 3860\n3868 3874\n3882 3892\n3898 3912\n3926 3930\n3945 3945\n3965 3971\n3972 3985\n3996 3999\n4019 4025\n4038 4039\n4058 4072\n4076 4076\n4094 4103\n4115 4130\n4140 4142\n4159 4161\n4175 4175\n4183 4198\n4205 4213\n4224 4238\n4255 4260\n4277 4281\n4282 4283\n4302 4310\n4322 4322\n4332 4347\n4350 4361\n4379 4384\n4394 4401\n4417 4421\n4434 4447\n4458 4467\n4482 4490\n4491 4505\n4523 4524\n4536 4547\n4561 4563\n4582 4590\n4599 4606\n4619 4620\n4635 4642\n4651 4659\n4675 4681\n4690 4695\n4704 4710\n4713 4717\n4718 4726\n4733 4736\n4745 4758\n4764 4766\n4784 4786\n4789 4789\n4800 4811\n4831 4846\n4847 4860\n4870 4883\n4903 4914\n4924 4929\n4933 4942\n4950 4954\n4971 4982\n5000 5006\n5011 5014\n5016 5025\n5040 5047\n5066 5073\n5078 5083\n5093 5095\n5098 5105\n5112 5117\n5130 5135\n5151 5156\n5163 5163\n5164 5178\n5185 5198\n5214 5228\n5235 5235\n5248 5261\n5270 5272\n5289 5292\n5311 5312\n5320 5324\n5333 5335\n5354 5364\n5378 5378\n5393 5403\n5411 5411\n5414 5421\n5438 5452\n5455 5455\n5471 5476\n5491 5496\n5509 5513\n5528 5539\n5551 5561\n5563 5570\n5578 5593\n5603 5610\n5613 5617\n5619 5623\n5643 5652\n5658 5672\n5676 5676\n5682 5691\n5697 5712\n5717 5721\n5737 5744\n5764 5764\n5765 5772\n5782 5795\n5799 5809\n5815 5830\n5836 5844\n5845 5846\n5863 5873\n5889 5901\n5913 5915\n5918 5922\n5934 5943\n5948 5956\n5973 5983\n5992 6000\n6005 6011\n6027 6040\n6045 6059\n6065 6077\n6097 6100\n6120 6131\n6135 6135\n6143 6154\n6157 6160\n6162 6164\n6170 6184\n6194 6201\n6217 6221\n6237 6252\n6271 6274\n6278 6292\n6298 6303\n6304 6306\n6315 6330\n6344 6350\n6355 6358\n6375 6378\n6396 6404\n6412 6412\n6431 6434\n6452 6464\n6466 6471\n6477 6484\n6495 6505\n6507 6508\n6514 6523\n6534 6546\n6563 6574\n6581 6592\n6600 6614\n6624 6625\n6628 6632\n6647 6648\n6649 6657\n6668 6670\n6673 6674\n6684 6689\n6703 6718\n6724 6724\n6740 6740\n6760 6775\n6791 6795\n6797 6799\n6815 6822\n6830 6845\n6860 6872\n6876 6886\n6903 6911\n6917 6917\n6925 6927\n6936 6941\n6949 6957\n6962 6967\n6978 6992\n7000 7013\n7028 7040\n7054 7069\n7081 7084\n7090 7102\n7113 7123\n7127 7128\n7139 7153\n7155 7165\n7168 7169\n7171 7172\n7178 7187\n7200 7208\n7222 7234\n7235 7237\n7251 7258\n7271 7283\n7287 7293\n7294 7303\n7315 7326\n7341 7356\n7366 7366\n7372 7387\n7389 7394\n7413 7423\n7432 7433\n7449 7458\n7464 7471\n7474 7478\n7488 7502\n7506 7521\n7536 7546\n7554 7561\n7576 7577\n7595 7598\n7609 7615\n7619 7633\n7635 7643\n7654 7659\n7662 7665\n7667 7682\n7695 7708\n7725 7738\n7751 7762\n7763 7771\n7790 7794\n7809 7816\n7817 7823\n7830 7845\n7857 7871\n7887 7890\n7898 7903\n7912 7925\n7938 7950\n7958 7972\n7982 7993\n8006 8021\n8040 8042\n8046 8048\n8066 8072\n8083 8094\n8103 8116\n8123 8124\n8135 8135\n8154 8155\n8162 8165\n8168 8170\n8175 8181\n8192 8200\n8218 8219\n8228 8233\n8251 8260\n8269 8277\n8295 8299\n8301 8305\n8322 8335\n8352 8363\n8372 8373\n8388 8396\n8402 8402\n8406 8418\n8419 8419\n8435 8449\n8456 8464\n8477 8485\n8493 8507\n8522 8533\n8553 8568\n8581 8590\n8591 8591\n8605 8610\n8616 8628\n8642 8657\n8669 8678\n8683 8697\n8713 8714\n8715 8725\n8730 8738\n8751 8754\n8760 8769\n8778 8793\n8796 8806\n8810 8814\n8815 8818\n8835 8843\n8863 8869\n8873 8881\n8893 8899\n8910 8914\n8926 8936\n8941 8946\n8964 8978\n8981 8987\n9001 9010\n9029 9034\n9053 9055\n9067 9077\n9085 9092\n9107 9119\n9138 9140\n9141 9150\n9168 9174\n9180 9190\n9208 9217\n9231 9243\n9250 9259\n9278 9280\n9284 9290\n9302 9306\n9324 9325\n9343 9355\n9366 9381\n9394 9399\n9400 9409\n9419 9433\n9434 9449\n9458 9470\n9474 9484\n9500 9506\n9516 9520\n9535 9549\n9552 9563\n9580 9591\n9596 9610\n9629 9635\n9655 9669\n9689 9702\n9716 9729\n9741 9748\n9759 9765\n9780 9793\n9810 9812\n9824 9825\n9843 9858\n9873 9878\n9892 9894\n9912 9924\n9942 9943\n9959 9964\n9984 9996\n10000 10014\n10016 10026\n10034 10034\n10043 10054\n10062 10067\n10080 10086\n10091 10100\n10105 10109\n10116 10125\n10134 10145\n10149 10150\n10167 10181\n10186 10193\n10204 10210\n10223 10237\n10247 10249\n10255 10259\n10270 10270\n10290 10297\n10313 10319\n10333 10334\n10339 10345\n10346 10347\n10360 10361\n10374 10382\n10400 10411\n10416 10419\n10437 10451\n10456 10460\n10461 10473\n10486 10491\n10501 10513\n10531 10541\n10545 10555\n10571 10583\n10602 10609\n10624 10630\n10640 10645\n10662 10671\n10675 10679\n10688 10689\n10701 10707\n10727 10741\n10757 10770\n10772 10778\n10780 10791\n10808 10808\n10824 10827\n10839 10849\n10864 10865\n10872 10878\n10894 10900\n10912 10916\n10917 10920\n10932 10938\n10951 10960\n10974 10982\n10997 11002\n11010 11010\n11030 11041\n11053 11061\n11078 11089\n11098 11103\n11108 11109\n11111 11118\n11132 11139\n11141 11147\n11152 11165\n11179 11189\n11208 11208\n11222 11226\n11242 11254\n11263 11275\n11276 11285\n11300 11300\n11320 11331\n11339 11339\n11357 11357\n11369 11369\n11373 11374\n11380 11387\n11399 11406\n11418 11421\n11422 11436\n11446 11458\n11466 11476\n11494 11498\n11511 11521\n11533 11533\n11534 11547\n11549 11558\n11578 11579\n11594 11598\n11613 11628\n11641 11653\n11671 11677\n11696 11699\n11714 11716\n11735 11738\n11742 11753\n11769 11774\n11781 11782\n11791 11805\n11808 11822\n11831 11844\n11852 11862\n11867 11875\n11895 11904\n11916 11924\n11933 11933\n11947 11953\n11969 11977\n11978 11983\n11987 12000\n12009 12017\n12032 12047\n12049 12049\n12060 12071\n12073 12081\n12090 12091\n12099 12108\n12115 12121\n12129 12133\n12150 12164\n12175 12185\n12200 12207\n12214 12220\n12238 12238\n12241 12249\n12269 12271\n12288 12296\n12304 12309\n12317 12320\n12323 12332\n12335 12336\n12352 12364\n12377 12379\n12392 12392\n12406 12409\n12415 12423\n12439 12443\n12462 12470\n12473 12483\n12503 12516\n12523 12535\n12538 12548\n12560 12560\n12565 12567\n12584 12591\n12596 12604\n12609 12622\n12631 12635\n12638 12653\n12662 12666\n12674 12679\n12698 12698\n12715 12728\n12744 12745\n12755 12766\n12784 12796\n12797 12798\n12806 12815\n12835 12838\n12844 12852\n12867 12876\n12879 12892\n12898 12902\n12912 12913\n12923 12933\n12942 12950\n12953 12966\n12986 12996\n12998 13006\n13026 13040\n13049 13049\n13068 13082\n13096 13108\n13124 13128\n13146 13156\n13160 13160\n13166 13171\n13188 13192\n13209 13218\n13223 13226\n13238 13238\n13241 13249\n13269 13282\n13302 13307\n13315 13327\n13333 13334\n13343 13353\n13359 13367\n13387 13399\n13409 13415\n13426 13438\n13451 13463\n13474 13486\n13505 13514\n13530 13541\n13551 13565\n13567 13575\n13576 13583\n13601 13607\n13627 13630\n13639 13646\n13665 13668\n13670 13681\n13696 13710\n13713 13723\n13730 13738\n13758 13767\n13778 13779\n13793 13804\n13823 13827\n13845 13851\n13854 13862\n13879 13888\n13894 13906\n13926 13939\n13951 13955\n13965 13977\n13987 13991\n14009 14014\n14028 14034\n14043 14054\n14056 14062\n14080 14091\n14094 14103\n14118 14124\n14144 14151\n14168 14170\n14178 14192\n14195 14200\n14210 14213\n14221 14231\n14238 14253\n14261 14270\n14289 14291\n14300 14311\n14312 14315\n14328 14332\n14333 14343\n14347 14358\n14369 14383\n14392 14404\n14423 14434\n14442 14447\n14459 14463\n14468 14468\n14480 14487\n14492 14497\n14500 14512\n14517 14532\n14534 14535\n14554 14563\n14580 14583\n14595 14602\n14607 14615\n14628 14639\n14641 14644\n14653 14664\n14678 14684\n14688 14703\n14710 14719\n14737 14740\n14742 14755\n14774 14780\n14782 14792\n14799 14809\n14824 14826\n14844 14856\n14866 14881\n14886 14890\n14910 14917\n14922 14934\n14941 14955\n14958 14967\n14969 14979\n14999 15004\n15024 15026\n15043 15048\n15055 15057\n15064 15077\n15091 15099\n15116 15126\n15136 15146\n15165 15174\n15190 15190\n15194 15194\n15206 15221\n15233 15241\n15260 15273\n15277 15286\n15290 15297\n15317 15321\n15336 15345\n15359 15361\n15376 15377\n15378 15391\n15406 15419\n15428 15440\n15449 15452\n15468 15468\n15477 15484\n15488 15495\n15515 15523\n15535 15547\n15564 15568\n15578 15583\n15597 15601\n15610 15619\n15626 15630\n15636 15643\n15650 15660\n15666 15681\n15691 15699\n15717 15719\n15737 15750\n15768 15774\n15787 15790\n15801 15804\n15805 15813\n15818 15833\n15845 15846\n15858 15865\n15881 15887\n15904 15916\n15918 15925\n15941 15944\n15956 15966\n15972 15982\n15999 16010\n16020 16035\n16054 16068\n16085 16087\n16089 16098\n16113 16124\n16125 16127\n16141 16154\n16169 16170\n5321 10688",
        expected:
          "7 11 28 41 59 71 80 83 89 89 102 106 113 124 138 147 149 161 163 169 170 182 196 199 200 200 215 229 243 246 261 267 278 282 285 300 312 320 340 350 355 364 378 381 384 388 393 407 426 426 441 443 459 466 470 476 478 478 493 505 525 525 527 529 539 541 547 556 576 583 585 589 607 616 634 645 648 660 663 671 672 676 694 705 711 717 720 721 730 744 755 764 775 777 781 788 794 802 804 813 828 837 844 859 877 886 889 899 914 915 916 927 941 947 966 972 990 991 997 1004 1007 1020 1021 1027 1036 1046 1056 1064 1084 1098 1107 1120 1126 1135 1137 1138 1155 1160 1165 1169 1172 1175 1186 1196 1199 1201 1221 1229 1241 1253 1266 1273 1279 1280 1287 1288 1289 1289 1305 1312 1316 1318 1329 1342 1346 1350 1362 1374 1386 1394 1399 1410 1421 1436 1456 1468 1472 1479 1485 1490 1498 1498 1511 1523 1531 1536 1550 1555 1569 1578 1596 1598 1618 1618 1630 1631 1638 1653 1668 1669 1685 1694 1713 1713 1721 1733 1749 1753 1768 1775 1781 1790 1804 1807 1826 1837 1853 1858 1868 1874 1884 1896 1903 1913 1925 1934 1945 1951 1970 1985 1986 1996 2009 2023 2031 2037 2044 2047 2057 2063 2072 2081 2083 2086 2087 2090 2109 2109 2128 2135 2151 2153 2160 2173 2177 2177 2184 2198 2216 2221 2241 2254 2258 2272 2288 2302 2319 2326 2333 2336 2354 2357 2366 2379 2396 2406 2409 2420 2435 2437 2449 2455 2466 2469 2488 2500 2507 2509 2519 2532 2538 2545 2546 2549 2564 2573 2576 2580 2581 2581 2599 2600 2613 2620 2634 2645 2654 2664 2678 2682 2700 2712 2728 2738 2739 2740 2760 2763 2769 2778 2798 2802 2818 2832 2842 2842 2850 2860 2862 2877 2892 2897 2900 2905 2924 2928 2939 2953 2962 2970 2978 2992 3000 3008 3027 3031 3038 3040 3057 3067 3072 3078 3082 3096 3107 3108 3125 3138 3152 3166 3171 3182 3189 3196 3215 3220 3231 3235 3240 3248 3250 3252 3262 3276 3287 3290 3306 3308 3313 3319 3333 3336 3345 3357 3362 3366 3385 3391 3403 3416 3428 3443 3445 3450 3454 3465 3485 3497 3500 3510 3526 3528 3539 3540 3553 3560 3572 3583 3601 3609 3613 3623 3641 3645 3664 3673 3674 3683 3695 3710 3712 3721 3723 3736 3741 3756 3759 3761 3769 3775 3787 3788 3805 3811 3829 3843 3852 3860 3868 3874 3882 3892 3898 3912 3926 3930 3945 3945 3965 3971 3972 3985 3996 3999 4019 4025 4038 4039 4058 4072 4076 4076 4094 4103 4115 4130 4140 4142 4159 4161 4175 4175 4183 4198 4205 4213 4224 4238 4255 4260 4277 4281 4282 4283 4302 4310 4322 4322 4332 4347 4350 4361 4379 4384 4394 4401 4417 4421 4434 4447 4458 4467 4482 4490 4491 4505 4523 4524 4536 4547 4561 4563 4582 4590 4599 4606 4619 4620 4635 4642 4651 4659 4675 4681 4690 4695 4704 4710 4713 4717 4718 4726 4733 4736 4745 4758 4764 4766 4784 4786 4789 4789 4800 4811 4831 4846 4847 4860 4870 4883 4903 4914 4924 4929 4933 4942 4950 4954 4971 4982 5000 5006 5011 5014 5016 5025 5040 5047 5066 5073 5078 5083 5093 5095 5098 5105 5112 5117 5130 5135 5151 5156 5163 5163 5164 5178 5185 5198 5214 5228 5235 5235 5248 5261 5270 5272 5289 5292 5311 5312 5320 10689 10701 10707 10727 10741 10757 10770 10772 10778 10780 10791 10808 10808 10824 10827 10839 10849 10864 10865 10872 10878 10894 10900 10912 10916 10917 10920 10932 10938 10951 10960 10974 10982 10997 11002 11010 11010 11030 11041 11053 11061 11078 11089 11098 11103 11108 11109 11111 11118 11132 11139 11141 11147 11152 11165 11179 11189 11208 11208 11222 11226 11242 11254 11263 11275 11276 11285 11300 11300 11320 11331 11339 11339 11357 11357 11369 11369 11373 11374 11380 11387 11399 11406 11418 11421 11422 11436 11446 11458 11466 11476 11494 11498 11511 11521 11533 11533 11534 11547 11549 11558 11578 11579 11594 11598 11613 11628 11641 11653 11671 11677 11696 11699 11714 11716 11735 11738 11742 11753 11769 11774 11781 11782 11791 11805 11808 11822 11831 11844 11852 11862 11867 11875 11895 11904 11916 11924 11933 11933 11947 11953 11969 11977 11978 11983 11987 12000 12009 12017 12032 12047 12049 12049 12060 12071 12073 12081 12090 12091 12099 12108 12115 12121 12129 12133 12150 12164 12175 12185 12200 12207 12214 12220 12238 12238 12241 12249 12269 12271 12288 12296 12304 12309 12317 12320 12323 12332 12335 12336 12352 12364 12377 12379 12392 12392 12406 12409 12415 12423 12439 12443 12462 12470 12473 12483 12503 12516 12523 12535 12538 12548 12560 12560 12565 12567 12584 12591 12596 12604 12609 12622 12631 12635 12638 12653 12662 12666 12674 12679 12698 12698 12715 12728 12744 12745 12755 12766 12784 12796 12797 12798 12806 12815 12835 12838 12844 12852 12867 12876 12879 12892 12898 12902 12912 12913 12923 12933 12942 12950 12953 12966 12986 12996 12998 13006 13026 13040 13049 13049 13068 13082 13096 13108 13124 13128 13146 13156 13160 13160 13166 13171 13188 13192 13209 13218 13223 13226 13238 13238 13241 13249 13269 13282 13302 13307 13315 13327 13333 13334 13343 13353 13359 13367 13387 13399 13409 13415 13426 13438 13451 13463 13474 13486 13505 13514 13530 13541 13551 13565 13567 13575 13576 13583 13601 13607 13627 13630 13639 13646 13665 13668 13670 13681 13696 13710 13713 13723 13730 13738 13758 13767 13778 13779 13793 13804 13823 13827 13845 13851 13854 13862 13879 13888 13894 13906 13926 13939 13951 13955 13965 13977 13987 13991 14009 14014 14028 14034 14043 14054 14056 14062 14080 14091 14094 14103 14118 14124 14144 14151 14168 14170 14178 14192 14195 14200 14210 14213 14221 14231 14238 14253 14261 14270 14289 14291 14300 14311 14312 14315 14328 14332 14333 14343 14347 14358 14369 14383 14392 14404 14423 14434 14442 14447 14459 14463 14468 14468 14480 14487 14492 14497 14500 14512 14517 14532 14534 14535 14554 14563 14580 14583 14595 14602 14607 14615 14628 14639 14641 14644 14653 14664 14678 14684 14688 14703 14710 14719 14737 14740 14742 14755 14774 14780 14782 14792 14799 14809 14824 14826 14844 14856 14866 14881 14886 14890 14910 14917 14922 14934 14941 14955 14958 14967 14969 14979 14999 15004 15024 15026 15043 15048 15055 15057 15064 15077 15091 15099 15116 15126 15136 15146 15165 15174 15190 15190 15194 15194 15206 15221 15233 15241 15260 15273 15277 15286 15290 15297 15317 15321 15336 15345 15359 15361 15376 15377 15378 15391 15406 15419 15428 15440 15449 15452 15468 15468 15477 15484 15488 15495 15515 15523 15535 15547 15564 15568 15578 15583 15597 15601 15610 15619 15626 15630 15636 15643 15650 15660 15666 15681 15691 15699 15717 15719 15737 15750 15768 15774 15787 15790 15801 15804 15805 15813 15818 15833 15845 15846 15858 15865 15881 15887 15904 15916 15918 15925 15941 15944 15956 15966 15972 15982 15999 16010 16020 16035 16054 16068 16085 16087 16089 16098 16113 16124 16125 16127 16141 16154 16169 16170",
      },
    ],
    hints: [
      "You could append the booking and run a general merge, but that throws away the fact that the calendar is already sorted.",
      "Blocks fall into three groups relative to the booking: entirely before it, touching or overlapping it, and entirely after it.",
      "A block is entirely before when its end < booking start; entirely after when its start > booking end.",
      "Everything in the middle group collapses into one block whose start is the min and whose end is the max.",
    ],
    solutions: [
      {
        title: "Append and merge from scratch",
        order: 1,
        intuition:
          "Inserting is a special case of merging: add the booking to the list, sort, and run the standard sweep. Correct, but it pays for a sort the input did not need.",
        approach: [
          "Append the booking to a copy of the calendar.",
          "Sort by start.",
          "Sweep, extending the current block while the next start is ≤ its end.",
          "Flatten the blocks.",
        ],
        code: {
          PYTHON: `def insertBooking(calendar: List[List[int]], booking: List[int]) -> List[int]:
    blocks = []
    for start, end in sorted(calendar + [booking]):
        if blocks and start <= blocks[-1][1]:
            blocks[-1][1] = max(blocks[-1][1], end)
        else:
            blocks.append([start, end])

    out = []
    for start, end in blocks:
        out += [start, end]
    return out`,
          JAVA: `class Solution {
    public int[] insertBooking(int[][] calendar, int[] booking) {
        List<int[]> all = new ArrayList<>();
        for (int[] b : calendar) all.add(new int[] {b[0], b[1]});
        all.add(new int[] {booking[0], booking[1]});
        all.sort((x, y) -> Integer.compare(x[0], y[0]));

        List<int[]> blocks = new ArrayList<>();
        for (int[] b : all) {
            if (!blocks.isEmpty() && b[0] <= blocks.get(blocks.size() - 1)[1]) {
                int[] last = blocks.get(blocks.size() - 1);
                last[1] = Math.max(last[1], b[1]);
            } else {
                blocks.add(b);
            }
        }

        int[] out = new int[blocks.size() * 2];
        for (int k = 0; k < blocks.size(); k++) {
            out[2 * k] = blocks.get(k)[0];
            out[2 * k + 1] = blocks.get(k)[1];
        }
        return out;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        edgeCases: ["An empty calendar."],
        commonMistakes: ["Mutating the caller's rows while merging."],
      },
      {
        title: "Optimal: three linear phases",
        order: 2,
        intuition:
          "Because the calendar is sorted and disjoint, the blocks the booking touches form one contiguous run. Copy everything before the run, fold the run into the booking, then copy everything after. Each block is looked at once.",
        approach: [
          "Copy blocks whose end < booking start — they finish before it.",
          "While the next block's start ≤ booking end, widen the booking to cover it.",
          "Emit the widened booking.",
          "Copy the remaining blocks unchanged.",
        ],
        code: {
          PYTHON: `def insertBooking(calendar: List[List[int]], booking: List[int]) -> List[int]:
    start, end = booking
    out = []
    i = 0
    n = len(calendar)

    # Phase 1: blocks that finish before the booking begins.
    while i < n and calendar[i][1] < start:
        out += calendar[i]
        i += 1

    # Phase 2: blocks that overlap or touch the booking fold into it.
    while i < n and calendar[i][0] <= end:
        start = min(start, calendar[i][0])
        end = max(end, calendar[i][1])
        i += 1
    out += [start, end]

    # Phase 3: blocks that begin after the merged booking.
    while i < n:
        out += calendar[i]
        i += 1

    return out`,
          JAVA: `class Solution {
    public int[] insertBooking(int[][] calendar, int[] booking) {
        int start = booking[0], end = booking[1];
        List<Integer> out = new ArrayList<>();
        int i = 0, n = calendar.length;

        while (i < n && calendar[i][1] < start) {
            out.add(calendar[i][0]);
            out.add(calendar[i][1]);
            i++;
        }
        while (i < n && calendar[i][0] <= end) {
            start = Math.min(start, calendar[i][0]);
            end = Math.max(end, calendar[i][1]);
            i++;
        }
        out.add(start);
        out.add(end);
        while (i < n) {
            out.add(calendar[i][0]);
            out.add(calendar[i][1]);
            i++;
        }

        int[] result = new int[out.size()];
        for (int k = 0; k < result.length; k++) result[k] = out.get(k);
        return result;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) for the output",
        edgeCases: [
          "Empty calendar — the answer is the booking itself.",
          "The booking lies before every block, or after every block.",
          "The booking touches a block only at a single hour.",
          "The booking swallows every block.",
        ],
        commonMistakes: [
          "Using ≤ in phase 1, which separates a block that merely touches the booking.",
          "Forgetting phase 3, dropping the tail of the calendar.",
          "Taking the booking's start as final without min-ing with the first absorbed block.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "shared-free-windows",
    title: "Shared Free Windows",
    difficulty: "MEDIUM",
    learningObjective:
      "Walk two sorted interval lists with two pointers, always retiring whichever interval finishes first.",
    topics: ["intervals", "arrays"],
    patterns: ["two-pointers", "merge-intervals"],
    statement: [
      para(
        "Two volunteers have each published their free windows for the week. Each list is sorted by start and its windows are disjoint. A window [start, end] is closed: both ends are free hours."
      ),
      para(
        "Return every period when both volunteers are free, sorted by start and flattened into one list: start₁, end₁, start₂, end₂, … A single shared hour, such as [4, 4], counts. If they are never free together, return an empty list."
      ),
      example(
        "first = [[0, 2], [5, 10], [13, 23]], second = [[1, 5], [8, 12], [15, 24]]",
        "[1, 2, 5, 5, 8, 10, 15, 23]",
        [
          {
            state: "[0,2] ∩ [1,5] = [1,2]",
            note: "first window ends first → advance first",
          },
          {
            state: "[5,10] ∩ [1,5] = [5,5]",
            note: "second ends first → advance second",
          },
          { state: "[5,10] ∩ [8,12] = [8,10]", note: "advance first" },
          { state: "[13,23] ∩ [8,12] = none", note: "advance second" },
          { state: "[13,23] ∩ [15,24] = [15,23]", note: "advance first — done" },
        ],
        "Two pointers, one step per comparison"
      ),
    ],
    constraints: [
      "1 ≤ first.length, second.length ≤ 1000",
      "Each list is sorted by start and its windows are pairwise disjoint.",
      "0 ≤ start ≤ end ≤ 1000000",
      "Return value: intersections flattened as [s1, e1, s2, e2, ...].",
    ],
    signature: {
      params: ["int[][]", "int[][]"],
      paramNames: ["first", "second"],
      returns: "int[]",
      functionName: "commonWindows",
    },
    tests: [
      {
        input: "3\n0 2\n5 10\n13 23\n3\n1 5\n8 12\n15 24",
        expected: "1 2 5 5 8 10 15 23",
        isSample: true,
        explanation: "Shared periods: [1,2], [5,5], [8,10] and [15,23].",
      },
      {
        input: "2\n1 3\n5 9\n2\n3 6\n8 12",
        expected: "3 3 5 6 8 9",
        isSample: true,
        explanation: "They share hour 3, then hours 5 to 6, then hours 8 to 9.",
      },
      {
        input: "2\n1 3\n5 9\n2\n4 4\n10 12",
        expected: "",
      },
      {
        input: "1\n1 7\n1\n3 10",
        expected: "3 7",
      },
      {
        input: "1\n1 4\n1\n4 8",
        expected: "4 4",
      },
      {
        input: "1\n2 3\n1\n1 10",
        expected: "2 3",
      },
      {
        input: "3\n0 1\n3 4\n6 7\n1\n0 7",
        expected: "0 1 3 4 6 7",
      },
      {
        input: "1\n5 6\n1\n1 2",
        expected: "",
      },
      {
        input:
          "800\n2 26\n50 66\n79 82\n97 113\n135 160\n170 178\n188 193\n199 211\n218 241\n252 262\n275 288\n301 301\n314 325\n348 349\n378 387\n389 393\n422 427\n441 442\n455 474\n502 521\n544 567\n579 601\n617 618\n621 630\n650 668\n672 673\n683 704\n709 719\n732 737\n764 781\n786 796\n804 811\n827 844\n873 895\n906 916\n940 945\n954 963\n992 994\n1011 1017\n1020 1033\n1049 1061\n1088 1103\n1115 1128\n1140 1161\n1187 1207\n1209 1210\n1213 1219\n1225 1244\n1274 1287\n1306 1330\n1341 1359\n1384 1391\n1419 1439\n1459 1483\n1506 1526\n1534 1540\n1546 1571\n1597 1612\n1625 1637\n1645 1646\n1663 1679\n1696 1707\n1716 1717\n1730 1739\n1740 1749\n1754 1768\n1772 1797\n1810 1822\n1830 1830\n1832 1855\n1885 1901\n1918 1936\n1952 1973\n2001 2005\n2008 2008\n2014 2025\n2044 2064\n2078 2081\n2101 2117\n2132 2147\n2167 2170\n2200 2200\n2213 2229\n2233 2238\n2250 2272\n2281 2287\n2311 2334\n2338 2340\n2346 2365\n2379 2386\n2413 2435\n2455 2463\n2465 2467\n2486 2501\n2529 2530\n2548 2560\n2588 2600\n2619 2637\n2644 2646\n2660 2660\n2672 2684\n2698 2723\n2726 2746\n2751 2765\n2794 2800\n2802 2815\n2836 2846\n2868 2885\n2888 2907\n2915 2933\n2949 2974\n2996 3021\n3042 3051\n3054 3073\n3095 3097\n3118 3130\n3132 3139\n3145 3167\n3172 3183\n3200 3209\n3237 3247\n3254 3262\n3280 3286\n3291 3293\n3320 3323\n3346 3358\n3376 3398\n3407 3419\n3445 3455\n3485 3491\n3498 3522\n3526 3536\n3564 3578\n3592 3601\n3624 3641\n3658 3679\n3690 3691\n3712 3717\n3731 3745\n3750 3773\n3782 3784\n3804 3826\n3833 3841\n3844 3858\n3863 3878\n3896 3907\n3928 3930\n3941 3953\n3983 3996\n4025 4045\n4075 4081\n4098 4113\n4137 4143\n4154 4170\n4199 4222\n4252 4263\n4284 4306\n4333 4336\n4351 4361\n4386 4389\n4419 4427\n4454 4460\n4475 4489\n4504 4525\n4552 4573\n4583 4599\n4606 4611\n4640 4652\n4663 4672\n4700 4721\n4729 4740\n4751 4753\n4769 4779\n4782 4797\n4811 4835\n4857 4857\n4860 4872\n4880 4889\n4901 4909\n4931 4934\n4946 4958\n4974 4989\n4999 5008\n5010 5010\n5018 5021\n5024 5029\n5056 5077\n5101 5107\n5118 5132\n5148 5161\n5176 5196\n5199 5204\n5208 5208\n5211 5215\n5244 5252\n5267 5270\n5298 5319\n5324 5332\n5353 5371\n5397 5417\n5429 5435\n5438 5458\n5483 5492\n5518 5529\n5550 5573\n5586 5586\n5598 5615\n5645 5654\n5667 5669\n5681 5686\n5692 5717\n5719 5721\n5729 5738\n5765 5780\n5785 5801\n5814 5827\n5856 5874\n5901 5925\n5946 5966\n5982 5993\n6006 6009\n6031 6045\n6054 6070\n6089 6102\n6127 6141\n6151 6167\n6172 6187\n6209 6213\n6239 6259\n6264 6289\n6317 6334\n6337 6339\n6363 6381\n6396 6397\n6408 6422\n6433 6433\n6461 6467\n6492 6497\n6511 6511\n6525 6534\n6555 6559\n6566 6574\n6585 6594\n6624 6645\n6646 6661\n6676 6677\n6702 6726\n6741 6741\n6748 6769\n6781 6785\n6797 6822\n6843 6855\n6872 6878\n6894 6916\n6926 6944\n6953 6970\n6971 6977\n7001 7002\n7024 7044\n7050 7059\n7064 7068\n7088 7112\n7132 7150\n7162 7178\n7179 7181\n7209 7229\n7240 7253\n7270 7276\n7305 7320\n7344 7361\n7366 7371\n7396 7417\n7428 7442\n7460 7485\n7502 7520\n7530 7553\n7562 7568\n7569 7584\n7609 7632\n7651 7674\n7691 7713\n7739 7744\n7764 7767\n7789 7797\n7824 7847\n7872 7872\n7879 7903\n7921 7940\n7958 7972\n7985 7995\n8003 8013\n8023 8034\n8057 8064\n8067 8087\n8109 8110\n8114 8139\n8166 8179\n8206 8217\n8238 8254\n8275 8279\n8305 8309\n8328 8331\n8333 8354\n8376 8382\n8409 8430\n8441 8455\n8460 8462\n8466 8491\n8494 8500\n8524 8546\n8575 8592\n8603 8614\n8625 8627\n8643 8668\n8679 8687\n8716 8717\n8731 8731\n8737 8761\n8783 8807\n8832 8841\n8846 8860\n8864 8877\n8878 8896\n8923 8933\n8947 8961\n8980 8991\n9016 9035\n9036 9055\n9075 9096\n9103 9107\n9121 9134\n9142 9145\n9159 9166\n9192 9195\n9222 9236\n9239 9247\n9252 9257\n9262 9271\n9291 9316\n9321 9341\n9371 9382\n9405 9429\n9444 9451\n9478 9495\n9513 9524\n9541 9546\n9566 9587\n9610 9631\n9660 9664\n9694 9700\n9724 9741\n9766 9771\n9796 9812\n9838 9863\n9884 9892\n9894 9894\n9909 9915\n9940 9952\n9977 9989\n10013 10018\n10029 10050\n10078 10084\n10100 10118\n10122 10130\n10145 10163\n10187 10198\n10211 10220\n10223 10226\n10250 10263\n10268 10288\n10294 10314\n10317 10323\n10338 10350\n10371 10377\n10378 10399\n10419 10439\n10457 10473\n10502 10527\n10546 10551\n10556 10564\n10593 10611\n10628 10628\n10636 10657\n10678 10700\n10721 10735\n10740 10746\n10770 10790\n10808 10821\n10829 10834\n10850 10873\n10893 10911\n10912 10930\n10940 10965\n10973 10982\n10990 11004\n11025 11039\n11045 11056\n11082 11098\n11100 11108\n11116 11121\n11141 11148\n11149 11169\n11183 11187\n11195 11216\n11218 11225\n11253 11264\n11278 11285\n11314 11335\n11365 11390\n11399 11415\n11421 11427\n11453 11473\n11488 11497\n11502 11511\n11532 11552\n11580 11581\n11591 11594\n11595 11597\n11598 11609\n11619 11631\n11641 11656\n11657 11661\n11662 11670\n11690 11697\n11704 11725\n11733 11756\n11757 11780\n11790 11802\n11809 11823\n11831 11851\n11852 11866\n11867 11882\n11894 11903\n11909 11931\n11945 11967\n11994 11996\n12018 12027\n12043 12044\n12046 12064\n12069 12082\n12093 12107\n12109 12119\n12132 12140\n12142 12162\n12182 12192\n12200 12213\n12229 12235\n12245 12267\n12287 12291\n12315 12320\n12343 12352\n12360 12366\n12391 12401\n12430 12455\n12485 12488\n12516 12516\n12528 12532\n12556 12557\n12575 12590\n12601 12601\n12620 12622\n12644 12652\n12677 12678\n12681 12701\n12714 12723\n12724 12742\n12748 12763\n12770 12788\n12799 12824\n12840 12848\n12864 12883\n12897 12897\n12911 12916\n12927 12948\n12954 12958\n12975 12977\n12994 13014\n13028 13031\n13059 13061\n13066 13071\n13076 13095\n13113 13117\n13120 13129\n13132 13132\n13138 13151\n13160 13167\n13184 13208\n13238 13249\n13275 13278\n13283 13298\n13321 13330\n13355 13374\n13394 13401\n13431 13455\n13461 13479\n13508 13510\n13528 13553\n13581 13582\n13598 13623\n13643 13650\n13674 13688\n13714 13721\n13729 13742\n13753 13769\n13771 13777\n13805 13807\n13830 13846\n13847 13861\n13877 13890\n13893 13904\n13909 13915\n13939 13946\n13952 13965\n13982 13992\n13993 14004\n14017 14017\n14032 14044\n14058 14064\n14073 14091\n14105 14105\n14125 14131\n14134 14150\n14170 14190\n14202 14225\n14251 14259\n14269 14288\n14293 14308\n14323 14344\n14356 14366\n14371 14374\n14378 14398\n14428 14436\n14437 14439\n14466 14467\n14489 14501\n14516 14534\n14551 14564\n14583 14588\n14597 14597\n14618 14643\n14651 14665\n14683 14697\n14714 14720\n14741 14762\n14767 14773\n14799 14811\n14836 14853\n14863 14884\n14905 14922\n14938 14961\n14981 15002\n15015 15015\n15034 15049\n15073 15085\n15106 15111\n15130 15145\n15174 15189\n15200 15212\n15230 15237\n15253 15262\n15279 15279\n15298 15319\n15328 15331\n15340 15351\n15356 15366\n15382 15396\n15419 15424\n15450 15470\n15475 15478\n15482 15494\n15497 15501\n15523 15539\n15565 15585\n15605 15628\n15646 15657\n15670 15685\n15693 15716\n15726 15738\n15739 15753\n15763 15785\n15795 15820\n15833 15854\n15861 15878\n15904 15915\n15920 15937\n15953 15970\n15992 16014\n16042 16046\n16058 16076\n16082 16097\n16101 16119\n16120 16141\n16168 16180\n16185 16196\n16221 16240\n16259 16272\n16295 16309\n16331 16350\n16355 16358\n16368 16378\n16403 16403\n16404 16422\n16434 16452\n16464 16468\n16492 16509\n16529 16548\n16563 16577\n16593 16606\n16610 16631\n16654 16671\n16686 16704\n16732 16749\n16758 16766\n16781 16793\n16806 16810\n16831 16855\n16872 16882\n16907 16926\n16936 16945\n16951 16971\n16974 16991\n17005 17010\n17036 17047\n17073 17097\n17100 17104\n17117 17128\n17153 17156\n17182 17183\n17200 17216\n17231 17241\n17271 17287\n17314 17326\n17347 17364\n17368 17380\n17385 17399\n17410 17425\n17443 17454\n17479 17503\n17511 17522\n17542 17564\n17576 17578\n17587 17592\n17608 17628\n17652 17661\n17671 17686\n17716 17736\n17761 17775\n17805 17815\n17820 17834\n17850 17867\n17870 17889\n17890 17895\n17899 17903\n17917 17918\n17946 17962\n17968 17982\n17998 18022\n18050 18071\n18082 18085\n18102 18105\n18124 18126\n18144 18152\n18182 18196\n18208 18231\n18240 18245\n18270 18277\n18294 18298\n18306 18324\n18337 18342\n18343 18351\n18374 18379\n18386 18407\n18423 18434\n18451 18470\n18485 18487\n18494 18511\n18539 18550\n18570 18590\n18617 18628\n18645 18666\n18667 18680\n18688 18712\n18731 18731\n18740 18750\n18764 18785\n18799 18820\n18844 18857\n18880 18885\n18897 18904\n18914 18931\n18958 18979\n18989 19008\n19035 19053\n19061 19062\n19089 19109\n19122 19144\n19162 19176\n19196 19196\n19197 19202\n19227 19234\n19243 19243\n19258 19277\n19296 19310\n19335 19335\n19364 19386\n19389 19391\n19419 19439\n19462 19465\n19468 19480\n19505 19521\n19544 19556\n19566 19583\n19600 19603\n19610 19622\n19633 19637\n19647 19672\n19702 19714\n19721 19730\n19755 19778\n19784 19789\n19798 19811\n19818 19820\n19843 19861\n19878 19880\n19892 19893\n19906 19929\n19931 19939\n19951 19961\n19985 19985\n19998 20004\n20006 20027\n20039 20041\n20047 20059\n20083 20106\n20123 20141\n20171 20177\n20179 20191\n20202 20204\n20226 20251\n20262 20278\n20299 20318\n20341 20352\n20357 20375\n20381 20395\n20423 20425\n20444 20469\n20496 20509\n20521 20545\n20551 20569\n20591 20601\n20626 20642\n20651 20655\n20656 20678\n20687 20702\n20713 20723\n20752 20763\n20770 20781\n20790 20809\n20825 20848\n20876 20884\n20907 20907\n20910 20921\n20948 20949\n20962 20971\n20993 21016\n21031 21055\n21065 21088\n21100 21125\n21153 21165\n21169 21181\n21205 21211\n21231 21254\n21282 21295\n21297 21320\n21331 21342\n21348 21360\n21383 21402\n21430 21446\n21458 21461\n21474 21493\n21518 21540\n21558 21560\n21568 21582\n21602 21625\n21642 21653\n21660 21682\n21708 21721\n21742 21748\n21773 21796\n21801 21817\n21830 21850\n21861 21874\n21893 21911\n21935 21947\n21953 21974\n21990 22005\n22014 22023\n22051 22076\n22086 22106\n22109 22109\n800\n3 22\n24 41\n60 75\n97 115\n133 144\n170 182\n209 229\n239 246\n275 296\n325 339\n348 360\n385 406\n425 430\n454 475\n495 520\n529 550\n572 593\n608 615\n623 626\n648 673\n685 686\n689 706\n714 736\n750 752\n771 786\n811 812\n835 842\n872 878\n885 900\n905 914\n916 938\n940 956\n966 966\n979 990\n1003 1010\n1018 1021\n1045 1062\n1077 1083\n1103 1113\n1123 1135\n1141 1152\n1161 1168\n1181 1181\n1207 1211\n1215 1231\n1239 1240\n1253 1269\n1282 1289\n1319 1342\n1352 1365\n1386 1386\n1399 1405\n1422 1432\n1459 1466\n1484 1504\n1519 1519\n1547 1569\n1584 1608\n1632 1656\n1666 1673\n1701 1711\n1728 1736\n1756 1765\n1788 1788\n1799 1807\n1830 1839\n1850 1862\n1892 1903\n1933 1955\n1978 2000\n2004 2020\n2042 2065\n2087 2092\n2117 2118\n2140 2152\n2155 2159\n2162 2164\n2188 2208\n2223 2233\n2237 2255\n2268 2276\n2306 2322\n2342 2367\n2396 2410\n2424 2449\n2470 2472\n2489 2500\n2515 2526\n2530 2534\n2537 2561\n2566 2586\n2598 2605\n2611 2615\n2626 2639\n2641 2651\n2662 2680\n2697 2707\n2728 2744\n2751 2776\n2796 2813\n2829 2837\n2863 2882\n2888 2906\n2911 2923\n2940 2943\n2959 2962\n2986 3005\n3011 3035\n3058 3079\n3084 3102\n3104 3109\n3138 3151\n3153 3171\n3172 3190\n3207 3232\n3238 3260\n3289 3304\n3330 3342\n3365 3380\n3384 3385\n3397 3412\n3417 3425\n3444 3462\n3467 3484\n3491 3513\n3531 3543\n3568 3570\n3571 3579\n3596 3602\n3607 3630\n3649 3670\n3688 3695\n3710 3713\n3742 3764\n3772 3787\n3800 3805\n3815 3831\n3845 3866\n3869 3871\n3894 3908\n3915 3939\n3950 3974\n3997 4006\n4034 4038\n4065 4080\n4102 4121\n4151 4170\n4184 4204\n4207 4219\n4248 4260\n4290 4311\n4335 4335\n4339 4354\n4382 4384\n4396 4397\n4417 4428\n4438 4451\n4453 4456\n4477 4497\n4499 4512\n4515 4537\n4542 4562\n4565 4583\n4610 4627\n4632 4641\n4656 4669\n4686 4686\n4701 4724\n4736 4745\n4754 4759\n4778 4778\n4807 4819\n4830 4839\n4842 4857\n4876 4885\n4891 4895\n4918 4930\n4953 4966\n4975 4986\n4997 5005\n5019 5037\n5054 5078\n5106 5121\n5134 5142\n5169 5190\n5209 5214\n5218 5236\n5260 5262\n5266 5288\n5295 5318\n5322 5327\n5335 5339\n5360 5374\n5395 5416\n5440 5462\n5467 5490\n5513 5516\n5533 5542\n5545 5546\n5557 5561\n5566 5578\n5607 5616\n5634 5648\n5668 5685\n5686 5687\n5714 5730\n5731 5737\n5761 5770\n5782 5807\n5830 5832\n5840 5865\n5877 5901\n5929 5945\n5958 5966\n5973 5976\n5978 5987\n5993 5998\n6019 6021\n6049 6069\n6079 6096\n6124 6144\n6149 6154\n6178 6188\n6202 6210\n6218 6240\n6259 6273\n6292 6297\n6310 6315\n6333 6353\n6377 6384\n6414 6428\n6432 6436\n6457 6475\n6476 6488\n6516 6520\n6527 6535\n6549 6550\n6556 6573\n6576 6586\n6609 6631\n6657 6669\n6671 6676\n6692 6694\n6710 6725\n6748 6757\n6783 6808\n6812 6832\n6841 6856\n6867 6870\n6873 6888\n6891 6904\n6910 6916\n6918 6920\n6943 6957\n6984 7002\n7014 7033\n7052 7069\n7071 7076\n7104 7120\n7133 7134\n7143 7149\n7156 7173\n7196 7221\n7227 7243\n7267 7291\n7297 7307\n7319 7337\n7347 7350\n7380 7392\n7416 7438\n7440 7462\n7484 7488\n7498 7522\n7540 7554\n7563 7577\n7602 7624\n7641 7665\n7674 7685\n7693 7705\n7718 7726\n7749 7767\n7787 7808\n7821 7833\n7842 7861\n7865 7889\n7893 7913\n7939 7944\n7962 7965\n7987 7998\n8005 8009\n8015 8026\n8054 8063\n8071 8074\n8093 8107\n8120 8138\n8166 8187\n8214 8238\n8242 8251\n8253 8274\n8300 8316\n8326 8341\n8371 8381\n8404 8410\n8436 8439\n8460 8462\n8467 8484\n8504 8513\n8532 8536\n8551 8566\n8580 8591\n8596 8597\n8603 8625\n8652 8676\n8682 8682\n8710 8724\n8735 8755\n8765 8776\n8781 8803\n8821 8837\n8851 8866\n8889 8893\n8917 8930\n8948 8954\n8959 8962\n8989 8999\n9020 9036\n9051 9067\n9068 9090\n9096 9119\n9130 9136\n9140 9150\n9166 9191\n9197 9199\n9206 9207\n9208 9233\n9255 9262\n9287 9305\n9327 9349\n9350 9351\n9356 9366\n9374 9395\n9403 9427\n9457 9482\n9488 9511\n9523 9529\n9539 9561\n9565 9586\n9589 9612\n9619 9624\n9625 9627\n9631 9632\n9653 9655\n9663 9685\n9703 9712\n9740 9764\n9779 9799\n9813 9832\n9851 9859\n9863 9878\n9889 9892\n9913 9936\n9965 9985\n9989 10008\n10025 10032\n10043 10053\n10055 10075\n10078 10090\n10107 10117\n10134 10158\n10174 10182\n10209 10231\n10240 10254\n10282 10287\n10297 10303\n10306 10311\n10330 10349\n10373 10385\n10388 10397\n10401 10405\n10411 10433\n10460 10485\n10505 10523\n10526 10528\n10536 10558\n10571 10585\n10612 10628\n10629 10640\n10669 10676\n10681 10687\n10713 10727\n10741 10757\n10784 10796\n10808 10822\n10828 10832\n10857 10871\n10873 10883\n10912 10929\n10946 10957\n10970 10993\n11009 11009\n11029 11033\n11037 11038\n11063 11065\n11089 11111\n11118 11141\n11158 11172\n11197 11222\n11232 11240\n11248 11264\n11277 11294\n11302 11311\n11324 11345\n11363 11385\n11397 11413\n11431 11448\n11474 11480\n11501 11510\n11532 11536\n11551 11553\n11568 11584\n11609 11623\n11628 11643\n11655 11661\n11662 11676\n11691 11708\n11738 11753\n11755 11767\n11788 11812\n11834 11859\n11879 11881\n11901 11921\n11933 11938\n11944 11946\n11954 11955\n11962 11982\n11983 12008\n12010 12030\n12043 12065\n12072 12072\n12098 12111\n12126 12147\n12148 12168\n12187 12195\n12210 12222\n12247 12257\n12286 12299\n12317 12339\n12353 12360\n12387 12398\n12406 12409\n12423 12425\n12437 12452\n12477 12497\n12524 12542\n12558 12576\n12593 12612\n12630 12634\n12639 12660\n12690 12715\n12722 12742\n12768 12784\n12796 12809\n12832 12834\n12836 12856\n12884 12885\n12894 12919\n12925 12929\n12947 12965\n12991 13013\n13028 13030\n13034 13036\n13044 13049\n13051 13055\n13072 13091\n13106 13116\n13129 13141\n13154 13175\n13188 13202\n13225 13234\n13262 13263\n13286 13300\n13314 13317\n13321 13345\n13356 13378\n13382 13397\n13399 13417\n13436 13455\n13461 13462\n13471 13481\n13487 13487\n13490 13508\n13509 13509\n13514 13528\n13548 13561\n13566 13569\n13588 13609\n13628 13632\n13647 13669\n13687 13688\n13717 13733\n13735 13745\n13761 13773\n13789 13806\n13825 13845\n13873 13877\n13897 13898\n13912 13933\n13941 13945\n13949 13969\n13989 14010\n14026 14036\n14040 14048\n14060 14062\n14064 14083\n14099 14106\n14121 14123\n14124 14128\n14143 14146\n14151 14156\n14162 14183\n14209 14215\n14245 14250\n14272 14276\n14286 14291\n14305 14329\n14337 14339\n14359 14379\n14397 14421\n14422 14433\n14460 14485\n14492 14496\n14524 14527\n14538 14549\n14564 14586\n14613 14620\n14629 14629\n14649 14650\n14671 14692\n14704 14710\n14726 14742\n14750 14752\n14782 14800\n14814 14814\n14833 14851\n14866 14871\n14899 14921\n14947 14956\n14970 14979\n14992 15007\n15030 15047\n15067 15085\n15100 15103\n15114 15139\n15142 15144\n15146 15152\n15155 15176\n15178 15183\n15202 15225\n15231 15254\n15277 15283\n15288 15288\n15304 15318\n15341 15354\n15355 15367\n15390 15411\n15423 15434\n15462 15479\n15482 15484\n15490 15510\n15536 15541\n15563 15575\n15597 15606\n15636 15642\n15648 15658\n15675 15691\n15703 15726\n15736 15750\n15760 15768\n15775 15797\n15821 15836\n15845 15868\n15869 15871\n15890 15891\n15911 15919\n15944 15953\n15981 16006\n16023 16044\n16054 16058\n16068 16081\n16082 16107\n16133 16135\n16160 16182\n16191 16200\n16229 16244\n16246 16271\n16296 16299\n16326 16342\n16347 16349\n16373 16377\n16401 16404\n16421 16423\n16433 16454\n16479 16497\n16501 16521\n16548 16569\n16570 16576\n16593 16609\n16639 16645\n16665 16678\n16703 16722\n16745 16764\n16768 16768\n16795 16808\n16834 16852\n16882 16889\n16917 16940\n16965 16989\n17019 17033\n17036 17044\n17068 17083\n17097 17119\n17135 17147\n17151 17172\n17200 17221\n17228 17250\n17265 17278\n17303 17314\n17342 17359\n17389 17398\n17419 17423\n17452 17468\n17470 17476\n17500 17520\n17539 17563\n17587 17589\n17594 17605\n17612 17622\n17629 17636\n17660 17672\n17680 17696\n17710 17733\n17760 17770\n17776 17780\n17793 17802\n17832 17837\n17843 17863\n17868 17874\n17885 17888\n17911 17926\n17948 17969\n17995 18006\n18022 18029\n18052 18075\n18089 18104\n18115 18131\n18146 18161\n18172 18175\n18187 18207\n18217 18234\n18242 18246\n18271 18273\n18278 18293\n18309 18323\n18352 18352\n18372 18383\n18408 18431\n18444 18449\n18450 18458\n18462 18482\n18502 18507\n18520 18541\n18563 18575\n18579 18582\n18587 18602\n18630 18639\n18654 18666\n18683 18686\n18696 18715\n18721 18731\n18759 18782\n18794 18802\n18822 18836\n18850 18850\n18855 18858\n18863 18866\n18868 18878\n18907 18928\n18949 18973\n18994 19014\n19022 19025\n19038 19047\n19049 19054\n19082 19103\n19114 19124\n19140 19142\n19156 19163\n19170 19184\n19208 19219\n19247 19272\n19286 19295\n19304 19325\n19329 19348\n19368 19387\n19411 19422\n19447 19449\n19479 19490\n19495 19519\n19524 19524\n19544 19553\n19581 19600\n19605 19626\n19643 19659\n19681 19697\n19700 19718\n19720 19720\n19724 19726\n19750 19771\n19781 19788\n19798 19808\n19834 19854\n19876 19885\n19912 19933\n19954 19971\n19987 19998\n20008 20021\n20051 20072\n20088 20107\n20120 20126\n20136 20145\n20153 20170\n20173 20186\n20193 20208\n20229 20230\n20248 20271\n20278 20287\n20296 20316\n20321 20334\n20356 20379\n20395 20413\n20431 20439\n20446 20469\n20484 20500\n20523 20542\n20550 20565\n20593 20607\n20635 20654\n20678 20700\n20705 20730\n20734 20742\n20771 20792\n20796 20816\n20818 20839\n20840 20843\n20867 20888\n20900 20914\n20939 20964\n20981 20998\n21012 21028\n21053 21078\n21082 21105\n21122 21127\n21128 21129\n21154 21160\n21163 21182\n21212 21233\n21248 21264\n21270 21278\n21305 21318\n21338 21344\n21355 21369\n21384 21407\n21412 21436\n21449 21452\n21457 21463\n21478 21503\n21513 21532\n21535 21542\n21553 21562\n21589 21604\n21620 21621\n21627 21639\n21653 21666\n21681 21694\n21723 21723\n21732 21741\n21764 21767\n21795 21805\n21816 21835\n21844 21854\n21866 21883\n21913 21937\n21967 21976\n21977 21994\n22020 22030\n22049 22051\n22053 22077\n22090 22115\n22139 22147\n22159 22162\n22188 22196",
        expected:
          "3 22 24 26 60 66 97 113 135 144 170 178 209 211 218 229 239 241 275 288 325 325 348 349 385 387 389 393 425 427 455 474 502 520 544 550 579 593 623 626 650 668 672 673 685 686 689 704 714 719 732 736 771 781 786 786 811 811 835 842 873 878 885 895 906 914 916 916 940 945 954 956 1020 1021 1049 1061 1103 1103 1123 1128 1141 1152 1161 1161 1207 1207 1209 1210 1215 1219 1225 1231 1239 1240 1282 1287 1319 1330 1341 1342 1352 1359 1386 1386 1422 1432 1459 1466 1519 1519 1547 1569 1597 1608 1632 1637 1645 1646 1666 1673 1701 1707 1730 1736 1756 1765 1788 1788 1830 1830 1832 1839 1850 1855 1892 1901 1933 1936 1952 1955 2004 2005 2008 2008 2014 2020 2044 2064 2117 2117 2140 2147 2200 2200 2223 2229 2233 2233 2237 2238 2250 2255 2268 2272 2311 2322 2346 2365 2424 2435 2489 2500 2530 2530 2548 2560 2598 2600 2626 2637 2644 2646 2672 2680 2698 2707 2728 2744 2751 2765 2796 2800 2802 2813 2836 2837 2868 2882 2888 2906 2915 2923 2959 2962 2996 3005 3011 3021 3058 3073 3095 3097 3138 3139 3145 3151 3153 3167 3172 3183 3207 3209 3238 3247 3254 3260 3291 3293 3376 3380 3384 3385 3397 3398 3407 3412 3417 3419 3445 3455 3491 3491 3498 3513 3531 3536 3568 3570 3571 3578 3596 3601 3624 3630 3658 3670 3690 3691 3712 3713 3742 3745 3750 3764 3772 3773 3782 3784 3804 3805 3815 3826 3845 3858 3863 3866 3869 3871 3896 3907 3928 3930 3950 3953 4034 4038 4075 4080 4102 4113 4154 4170 4199 4204 4207 4219 4252 4260 4290 4306 4335 4335 4351 4354 4419 4427 4454 4456 4477 4489 4504 4512 4515 4525 4552 4562 4565 4573 4583 4583 4610 4611 4640 4641 4663 4669 4701 4721 4736 4740 4778 4778 4811 4819 4830 4835 4857 4857 4880 4885 4953 4958 4975 4986 4999 5005 5019 5021 5024 5029 5056 5077 5106 5107 5118 5121 5176 5190 5211 5214 5267 5270 5298 5318 5324 5327 5360 5371 5397 5416 5440 5458 5483 5490 5557 5561 5566 5573 5607 5615 5645 5648 5668 5669 5681 5685 5686 5686 5714 5717 5719 5721 5729 5730 5731 5737 5765 5770 5785 5801 5856 5865 5901 5901 5958 5966 5982 5987 5993 5993 6054 6069 6089 6096 6127 6141 6151 6154 6178 6187 6209 6210 6239 6240 6259 6259 6264 6273 6333 6334 6337 6339 6377 6381 6414 6422 6433 6433 6461 6467 6527 6534 6556 6559 6566 6573 6585 6586 6624 6631 6657 6661 6676 6676 6710 6725 6748 6757 6783 6785 6797 6808 6812 6822 6843 6855 6873 6878 6894 6904 6910 6916 6943 6944 6953 6957 7001 7002 7024 7033 7052 7059 7064 7068 7104 7112 7133 7134 7143 7149 7162 7173 7209 7221 7227 7229 7240 7243 7270 7276 7305 7307 7319 7320 7347 7350 7416 7417 7428 7438 7440 7442 7460 7462 7484 7485 7502 7520 7540 7553 7563 7568 7569 7577 7609 7624 7651 7665 7674 7674 7693 7705 7764 7767 7789 7797 7824 7833 7842 7847 7872 7872 7879 7889 7893 7903 7939 7940 7962 7965 7987 7995 8005 8009 8023 8026 8057 8063 8071 8074 8120 8138 8166 8179 8214 8217 8238 8238 8242 8251 8253 8254 8305 8309 8328 8331 8333 8341 8376 8381 8409 8410 8460 8462 8467 8484 8532 8536 8580 8591 8603 8614 8625 8625 8652 8668 8682 8682 8716 8717 8737 8755 8783 8803 8832 8837 8851 8860 8864 8866 8889 8893 8923 8930 8948 8954 8959 8961 8989 8991 9020 9035 9036 9036 9051 9055 9075 9090 9096 9096 9103 9107 9130 9134 9142 9145 9166 9166 9222 9233 9255 9257 9262 9262 9291 9305 9327 9341 9374 9382 9405 9427 9478 9482 9488 9495 9523 9524 9541 9546 9566 9586 9610 9612 9619 9624 9625 9627 9631 9631 9663 9664 9740 9741 9796 9799 9851 9859 9863 9863 9889 9892 9913 9915 9977 9985 9989 9989 10029 10032 10043 10050 10078 10084 10107 10117 10145 10158 10211 10220 10223 10226 10250 10254 10282 10287 10297 10303 10306 10311 10338 10349 10373 10377 10378 10385 10388 10397 10419 10433 10460 10473 10505 10523 10526 10527 10546 10551 10556 10558 10628 10628 10636 10640 10681 10687 10721 10727 10741 10746 10784 10790 10808 10821 10829 10832 10857 10871 10873 10873 10912 10929 10946 10957 10973 10982 10990 10993 11029 11033 11037 11038 11089 11098 11100 11108 11118 11121 11141 11141 11158 11169 11197 11216 11218 11222 11253 11264 11278 11285 11324 11335 11365 11385 11399 11413 11502 11510 11532 11536 11551 11552 11580 11581 11609 11609 11619 11623 11628 11631 11641 11643 11655 11656 11657 11661 11662 11670 11691 11697 11704 11708 11738 11753 11755 11756 11757 11767 11790 11802 11809 11812 11834 11851 11852 11859 11879 11881 11901 11903 11909 11921 11945 11946 11954 11955 11962 11967 11994 11996 12018 12027 12043 12044 12046 12064 12072 12072 12098 12107 12109 12111 12132 12140 12142 12147 12148 12162 12187 12192 12210 12213 12247 12257 12287 12291 12317 12320 12360 12360 12391 12398 12437 12452 12485 12488 12528 12532 12575 12576 12601 12601 12644 12652 12690 12701 12714 12715 12722 12723 12724 12742 12770 12784 12799 12809 12840 12848 12897 12897 12911 12916 12927 12929 12947 12948 12954 12958 12994 13013 13028 13030 13076 13091 13113 13116 13129 13129 13132 13132 13138 13141 13160 13167 13188 13202 13286 13298 13321 13330 13356 13374 13394 13397 13399 13401 13436 13455 13461 13462 13471 13479 13508 13508 13509 13509 13528 13528 13548 13553 13598 13609 13647 13650 13687 13688 13717 13721 13729 13733 13735 13742 13761 13769 13771 13773 13805 13806 13830 13845 13877 13877 13897 13898 13912 13915 13941 13945 13952 13965 13989 13992 13993 14004 14032 14036 14040 14044 14060 14062 14064 14064 14073 14083 14105 14105 14125 14128 14143 14146 14170 14183 14209 14215 14272 14276 14286 14288 14305 14308 14323 14329 14337 14339 14359 14366 14371 14374 14378 14379 14397 14398 14428 14433 14466 14467 14492 14496 14524 14527 14564 14564 14583 14586 14618 14620 14629 14629 14683 14692 14741 14742 14750 14752 14799 14800 14836 14851 14866 14871 14905 14921 14947 14956 14992 15002 15034 15047 15073 15085 15130 15139 15142 15144 15174 15176 15178 15183 15202 15212 15231 15237 15253 15254 15279 15279 15304 15318 15341 15351 15356 15366 15390 15396 15423 15424 15462 15470 15475 15478 15482 15484 15490 15494 15497 15501 15536 15539 15565 15575 15605 15606 15648 15657 15675 15685 15703 15716 15726 15726 15736 15738 15739 15750 15763 15768 15775 15785 15795 15797 15833 15836 15845 15854 15861 15868 15869 15871 15911 15915 15953 15953 15992 16006 16042 16044 16058 16058 16068 16076 16082 16097 16101 16107 16133 16135 16168 16180 16191 16196 16229 16240 16259 16271 16296 16299 16331 16342 16347 16349 16373 16377 16403 16403 16404 16404 16421 16422 16434 16452 16492 16497 16501 16509 16548 16548 16563 16569 16570 16576 16593 16606 16665 16671 16703 16704 16745 16749 16758 16764 16806 16808 16834 16852 16882 16882 16917 16926 16936 16940 16965 16971 16974 16989 17036 17044 17073 17083 17097 17097 17100 17104 17117 17119 17153 17156 17200 17216 17231 17241 17271 17278 17314 17314 17347 17359 17389 17398 17419 17423 17452 17454 17500 17503 17511 17520 17542 17563 17587 17589 17612 17622 17660 17661 17671 17672 17680 17686 17716 17733 17761 17770 17832 17834 17850 17863 17870 17874 17885 17888 17917 17918 17948 17962 17968 17969 17998 18006 18022 18022 18052 18071 18102 18104 18124 18126 18146 18152 18187 18196 18217 18231 18242 18245 18271 18273 18309 18323 18374 18379 18423 18431 18451 18458 18462 18470 18502 18507 18539 18541 18570 18575 18579 18582 18587 18590 18654 18666 18696 18712 18731 18731 18764 18782 18799 18802 18850 18850 18855 18857 18914 18928 18958 18973 18994 19008 19038 19047 19049 19053 19089 19103 19122 19124 19140 19142 19162 19163 19170 19176 19258 19272 19304 19310 19335 19335 19368 19386 19419 19422 19479 19480 19505 19519 19544 19553 19581 19583 19600 19600 19610 19622 19647 19659 19702 19714 19724 19726 19755 19771 19784 19788 19798 19808 19843 19854 19878 19880 19912 19929 19931 19933 19954 19961 19998 19998 20008 20021 20051 20059 20088 20106 20123 20126 20136 20141 20173 20177 20179 20186 20202 20204 20229 20230 20248 20251 20262 20271 20278 20278 20299 20316 20357 20375 20395 20395 20446 20469 20496 20500 20523 20542 20551 20565 20593 20601 20635 20642 20651 20654 20678 20678 20687 20700 20713 20723 20771 20781 20790 20792 20796 20809 20825 20839 20840 20843 20876 20884 20907 20907 20910 20914 20948 20949 20962 20964 20993 20998 21012 21016 21053 21055 21065 21078 21082 21088 21100 21105 21122 21125 21154 21160 21163 21165 21169 21181 21231 21233 21248 21254 21305 21318 21338 21342 21355 21360 21384 21402 21430 21436 21458 21461 21478 21493 21518 21532 21535 21540 21558 21560 21602 21604 21620 21621 21653 21653 21660 21666 21681 21682 21795 21796 21801 21805 21816 21817 21830 21835 21844 21850 21866 21874 21935 21937 21967 21974 21990 21994 22020 22023 22051 22051 22053 22076 22090 22106 22109 22109",
      },
    ],
    hints: [
      "The overlap of [a, b] and [c, d] is [max(a, c), min(b, d)] — if that range is not empty.",
      "Comparing every window of one list against every window of the other works. Can sortedness save you most of those comparisons?",
      "Of the two current windows, the one that ends first cannot overlap anything later in the other list. Retire it.",
    ],
    solutions: [
      {
        title: "Intersect every pair",
        order: 1,
        intuition:
          "Every shared period is the intersection of one window from each list. Try all pairs, keep the non-empty overlaps, and sort them.",
        approach: [
          "For each window in first and each window in second, compute lo = max of starts and hi = min of ends.",
          "Keep [lo, hi] when lo ≤ hi.",
          "Sort the kept periods by start and flatten.",
        ],
        code: {
          PYTHON: `def commonWindows(first: List[List[int]], second: List[List[int]]) -> List[int]:
    shared = []
    for a_start, a_end in first:
        for b_start, b_end in second:
            lo = max(a_start, b_start)
            hi = min(a_end, b_end)
            if lo <= hi:
                shared.append([lo, hi])

    out = []
    for lo, hi in sorted(shared):
        out += [lo, hi]
    return out`,
          JAVA: `class Solution {
    public int[] commonWindows(int[][] first, int[][] second) {
        List<int[]> shared = new ArrayList<>();
        for (int[] a : first) {
            for (int[] b : second) {
                int lo = Math.max(a[0], b[0]), hi = Math.min(a[1], b[1]);
                if (lo <= hi) shared.add(new int[] {lo, hi});
            }
        }
        shared.sort((x, y) -> Integer.compare(x[0], y[0]));
        int[] out = new int[shared.size() * 2];
        for (int k = 0; k < shared.size(); k++) {
            out[2 * k] = shared.get(k)[0];
            out[2 * k + 1] = shared.get(k)[1];
        }
        return out;
    }
}`,
        },
        timeComplexity: "O(n · m + k log k)",
        spaceComplexity: "O(k) for k shared periods",
        edgeCases: ["No overlap at all — return an empty list."],
        commonMistakes: ["Using lo < hi, which drops single-hour overlaps."],
      },
      {
        title: "Optimal: two pointers, retire the earlier finisher",
        order: 2,
        intuition:
          "Look at the current window of each list. Whichever ends first is finished: every later window in the other list starts after the current one, so it starts after this end too. Record the overlap of the two current windows if it exists, then advance past the one that ends first. Each step retires a window, so the walk is linear.",
        approach: [
          "Set i = j = 0.",
          "While both pointers are in range, compute lo = max(starts), hi = min(ends).",
          "If lo ≤ hi, append lo and hi to the output.",
          "Advance i if first[i] ends before second[j]; otherwise advance j.",
        ],
        code: {
          PYTHON: `def commonWindows(first: List[List[int]], second: List[List[int]]) -> List[int]:
    i = j = 0
    out = []

    while i < len(first) and j < len(second):
        lo = max(first[i][0], second[j][0])
        hi = min(first[i][1], second[j][1])
        if lo <= hi:
            out += [lo, hi]
        # The window that ends first cannot meet anything further on.
        if first[i][1] < second[j][1]:
            i += 1
        else:
            j += 1

    return out`,
          JAVA: `class Solution {
    public int[] commonWindows(int[][] first, int[][] second) {
        List<Integer> out = new ArrayList<>();
        int i = 0, j = 0;

        while (i < first.length && j < second.length) {
            int lo = Math.max(first[i][0], second[j][0]);
            int hi = Math.min(first[i][1], second[j][1]);
            if (lo <= hi) {
                out.add(lo);
                out.add(hi);
            }
            if (first[i][1] < second[j][1]) i++;
            else j++;
        }

        int[] result = new int[out.size()];
        for (int k = 0; k < result.length; k++) result[k] = out.get(k);
        return result;
    }
}`,
        },
        timeComplexity: "O(n + m)",
        spaceComplexity: "O(n + m) for the output",
        edgeCases: [
          "Windows that touch at one hour produce a single-hour period.",
          "One window from a list spanning many windows of the other.",
          "No shared time — an empty result.",
        ],
        commonMistakes: [
          "Advancing both pointers after a match, which skips windows that still overlap.",
          "Advancing the window that ends later.",
        ],
      },
    ],
    expectedTime: "O(n + m)",
    expectedSpace: "O(n + m)",
  },

  {
    slug: "fewest-darts-for-banners",
    title: "Fewest Darts for the Banners",
    difficulty: "MEDIUM",
    learningObjective:
      "Sort intervals by end and place each point as late as possible, which is the classic exchange-argument greedy for stabbing intervals.",
    topics: ["intervals", "greedy"],
    patterns: ["greedy", "merge-intervals"],
    statement: [
      para(
        "At a fairground stall, paper banners hang across a wall. Banner i stretches horizontally over the closed range [start, end]. A dart thrown at horizontal position x tears through every banner whose range contains x, including banners whose edge is exactly at x."
      ),
      para("Return the fewest darts needed to tear every banner."),
      example(
        "banners = [[10, 16], [2, 8], [1, 6], [7, 12]]",
        "2",
        [
          { state: "[1,6] [2,8] [7,12] [10,16]", note: "sorted by end" },
          { state: "dart at 6", note: "tears [1,6] and [2,8]" },
          { state: "[7,12] starts after 6", note: "needs a new dart — throw at 12" },
          { state: "[10,16] contains 12", note: "already torn — total 2 darts" },
        ],
        "Throw at the earliest end"
      ),
    ],
    constraints: ["1 ≤ banners.length ≤ 10000", "-1000000 ≤ start ≤ end ≤ 1000000"],
    signature: {
      params: ["int[][]"],
      paramNames: ["banners"],
      returns: "int",
      functionName: "fewestDarts",
    },
    tests: [
      {
        input: "4\n10 16\n2 8\n1 6\n7 12",
        expected: "2",
        isSample: true,
        explanation: "A dart at 6 and a dart at 12 tear all four banners.",
      },
      {
        input: "4\n1 2\n3 4\n5 6\n7 8",
        expected: "4",
        isSample: true,
        explanation: "No two banners share a point, so each needs its own dart.",
      },
      {
        input: "1\n3 3",
        expected: "1",
      },
      {
        input: "4\n1 2\n2 3\n3 4\n4 5",
        expected: "2",
      },
      {
        input: "4\n1 10\n2 3\n4 5\n6 7",
        expected: "3",
      },
      {
        input: "3\n-5 -1\n-3 0\n1 4",
        expected: "2",
      },
      {
        input: "3\n0 9\n0 9\n0 9",
        expected: "1",
      },
      {
        input:
          "1500\n-3479 -3203\n10642 10822\n-54536 -54362\n-26409 -26237\n42430 42527\n86822 86922\n-76381 -76343\n74483 74535\n-49792 -49495\n-74037 -73984\n14232 14506\n36719 36721\n-56882 -56753\n-10527 -10421\n45986 46073\n42269 42545\n55287 55425\n-41562 -41504\n-58410 -58409\n56294 56366\n-51403 -51300\n87099 87300\n-55545 -55464\n-85654 -85427\n95335 95572\n-62876 -62613\n64293 64419\n52663 52956\n-63675 -63554\n62974 63010\n92813 92905\n-16668 -16407\n84027 84044\n32907 32959\n-6365 -6227\n26048 26285\n13062 13289\n94873 94931\n-2021 -1823\n-53746 -53700\n88085 88165\n20457 20497\n54284 54329\n43809 44015\n46030 46265\n-62896 -62761\n37765 38008\n42626 42629\n10473 10663\n98378 98569\n-14595 -14422\n-57125 -56950\n41987 42007\n23716 23851\n-70462 -70300\n-40292 -40129\n-59446 -59250\n19607 19889\n-63379 -63371\n86710 86871\n-7944 -7652\n54775 55039\n81796 81965\n39862 40111\n57037 57207\n-21595 -21373\n-20628 -20614\n76786 76819\n38696 38889\n-50267 -50244\n-18477 -18439\n7670 7826\n-54185 -54078\n-25829 -25701\n-85674 -85490\n47732 47931\n48486 48671\n73284 73431\n32684 32823\n92584 92725\n-48527 -48470\n-63589 -63501\n-96497 -96327\n29007 29220\n-44099 -44013\n-98065 -97900\n95911 96166\n933 1189\n-31623 -31516\n24605 24781\n-97546 -97293\n-82294 -82004\n-70140 -70109\n-22349 -22131\n-79914 -79728\n-8568 -8320\n74551 74833\n2032 2269\n64313 64536\n10528 10731\n-32193 -32134\n-68510 -68217\n-43996 -43980\n66423 66626\n-93198 -92991\n28741 28765\n72574 72776\n17499 17547\n78996 79100\n41832 42065\n73621 73792\n-70343 -70225\n22588 22885\n-39253 -38982\n-91754 -91456\n-65072 -64849\n-97693 -97430\n-67759 -67602\n-28281 -27995\n99538 99691\n-76094 -75898\n34949 35163\n22445 22705\n-71270 -71270\n2800 2929\n-97429 -97166\n90556 90591\n-83590 -83290\n-75261 -75009\n-91641 -91567\n23565 23644\n-55937 -55876\n82098 82382\n-80195 -80136\n-86418 -86141\n-82025 -82002\n58375 58385\n-37996 -37921\n-77462 -77244\n87658 87699\n74496 74697\n63228 63247\n8921 9174\n49678 49929\n511 674\n13951 14021\n63801 64039\n37735 38034\n2149 2168\n97997 98232\n24443 24490\n-10829 -10816\n-59882 -59709\n-3866 -3801\n-39928 -39676\n98166 98215\n72246 72543\n7903 8022\n-32866 -32763\n-10372 -10152\n-74607 -74606\n73052 73247\n-30628 -30415\n-23704 -23500\n-31205 -31150\n78880 79051\n85133 85320\n35151 35233\n90652 90666\n68435 68550\n-37914 -37651\n10407 10427\n-54246 -54146\n2628 2898\n35881 36168\n8608 8684\n4917 5080\n92446 92492\n26919 27166\n11625 11684\n27079 27355\n90710 90938\n-41332 -41084\n-51620 -51328\n29696 29887\n-78478 -78279\n20299 20554\n63133 63199\n56955 57212\n-53368 -53102\n46762 46889\n66153 66334\n-95723 -95437\n-55229 -55210\n-48153 -47988\n70688 70739\n-85826 -85551\n77228 77504\n56197 56249\n-44875 -44600\n96633 96744\n-34892 -34717\n62615 62910\n1918 2014\n-40642 -40586\n-60821 -60773\n-90090 -90084\n-7652 -7435\n-71374 -71289\n35826 35872\n59244 59331\n86397 86669\n74380 74437\n-568 -326\n-56432 -56298\n-86164 -86111\n23282 23537\n-19287 -19027\n95023 95179\n55106 55178\n-27962 -27773\n32846 33013\n70481 70627\n-99401 -99345\n-70743 -70455\n-1440 -1414\n-72023 -71893\n31419 31542\n71798 71907\n-12245 -12022\n27022 27215\n34049 34156\n30377 30662\n59001 59194\n10388 10505\n-52649 -52464\n73877 74084\n-18125 -17868\n-9403 -9236\n2234 2460\n33114 33397\n16016 16228\n-53588 -53557\n-24753 -24462\n18357 18506\n92942 93146\n-7406 -7335\n-28881 -28634\n-4179 -4172\n-34619 -34368\n57965 58125\n18461 18694\n-62602 -62477\n96384 96398\n-81662 -81432\n57516 57745\n95530 95688\n81516 81710\n26858 27040\n45091 45274\n16813 16984\n75538 75764\n-51681 -51515\n-67068 -66990\n-46015 -45730\n-53196 -53157\n22211 22329\n2586 2832\n65915 65936\n-20389 -20110\n-6387 -6325\n-2014 -1955\n-30742 -30626\n-59679 -59426\n15056 15081\n-98895 -98850\n16256 16284\n34663 34893\n35119 35220\n-35744 -35462\n41443 41612\n23954 24137\n-95808 -95607\n-42159 -42120\n-93402 -93157\n-70987 -70840\n-32003 -31893\n61988 62135\n51120 51158\n-78874 -78628\n-66362 -66245\n-86359 -86343\n-87166 -87091\n95497 95524\n84500 84533\n25621 25674\n436 646\n-37149 -36971\n41225 41296\n65216 65461\n-62524 -62249\n2193 2340\n-77139 -77001\n25541 25731\n26709 26718\n48564 48764\n44126 44150\n-12357 -12083\n-97761 -97645\n6098 6126\n72681 72966\n65554 65802\n-28747 -28591\n72783 72851\n-34121 -34078\n-50125 -50043\n-28877 -28738\n15630 15925\n18468 18597\n64970 65192\n-40791 -40615\n-74006 -73887\n72059 72210\n-56542 -56378\n-5844 -5665\n56535 56812\n-31652 -31443\n10954 11090\n-70268 -70107\n26680 26890\n-17268 -16982\n-26927 -26765\n35031 35166\n59508 59667\n34835 35077\n79702 79768\n85883 85990\n89915 90076\n50842 51113\n66144 66379\n7617 7698\n42659 42669\n-5948 -5880\n51645 51670\n13839 14133\n-1430 -1223\n20819 21118\n21929 21963\n37785 37794\n2489 2528\n19617 19905\n-28560 -28276\n-71518 -71323\n-57816 -57579\n-18216 -17933\n-56165 -55982\n17922 18054\n-44947 -44746\n-65641 -65521\n-1098 -1003\n63133 63212\n-49444 -49271\n-46969 -46714\n-60212 -60183\n-80320 -80083\n-59373 -59098\n-50011 -49856\n-81360 -81184\n52316 52614\n-66173 -65951\n88308 88353\n71043 71268\n-1147 -1141\n83349 83389\n-62319 -62228\n-70582 -70502\n52925 52960\n-31654 -31361\n69589 69721\n-54247 -53983\n-88059 -87789\n53214 53483\n-97217 -96970\n-24330 -24086\n47591 47627\n-51079 -51079\n45266 45373\n67499 67632\n-18056 -17873\n3231 3296\n75413 75657\n15285 15499\n-35595 -35523\n-18852 -18655\n60079 60292\n80057 80122\n-59796 -59784\n-59907 -59795\n79525 79675\n80024 80198\n66371 66441\n80518 80715\n-75280 -75009\n-90365 -90245\n-37167 -37141\n95810 96056\n2012 2246\n46900 47063\n30762 30993\n47939 48034\n-68254 -68095\n-64463 -64412\n59687 59722\n-60889 -60831\n-69274 -69127\n-96887 -96737\n-77300 -77094\n32373 32615\n70514 70810\n-7533 -7290\n-90479 -90383\n25478 25734\n55987 56239\n66490 66572\n-27222 -27006\n43679 43696\n74137 74227\n-72104 -71931\n-22805 -22553\n94706 94908\n43798 43956\n33376 33513\n76149 76397\n-23246 -22997\n748 956\n-29405 -29356\n55169 55350\n-7824 -7615\n-18904 -18663\n-85774 -85493\n44052 44170\n-99165 -98871\n-42452 -42333\n-33854 -33742\n33514 33557\n62508 62591\n-83996 -83879\n-79427 -79258\n-21228 -21122\n-35323 -35201\n-39583 -39428\n-30287 -30243\n53590 53872\n57171 57385\n39508 39654\n-4912 -4783\n-58277 -58071\n-86074 -85871\n65937 66132\n81802 81860\n-46539 -46514\n-59417 -59325\n-8955 -8934\n7845 7961\n43137 43266\n91724 91922\n59275 59396\n36588 36745\n35556 35676\n-82303 -82082\n-66017 -65802\n87083 87208\n49739 49942\n5928 6085\n-95951 -95742\n-62635 -62446\n25055 25142\n94850 95011\n47629 47893\n-42638 -42394\n-30540 -30477\n51299 51435\n93478 93656\n-83802 -83643\n21476 21745\n-6365 -6159\n51645 51829\n55087 55146\n9530 9543\n33622 33756\n-95242 -95076\n66578 66817\n-1742 -1601\n-22856 -22792\n-22085 -22063\n-61972 -61926\n98830 99022\n-3999 -3895\n-88769 -88623\n91531 91570\n-12914 -12615\n33792 33986\n-83486 -83260\n4914 5176\n-93924 -93752\n-32478 -32308\n-46770 -46479\n44056 44143\n43891 43994\n-93301 -93198\n4530 4800\n175 271\n-68166 -67916\n-12143 -12081\n-33630 -33375\n-74475 -74324\n-8216 -8143\n85648 85908\n71650 71838\n-66392 -66344\n-44918 -44656\n-74519 -74335\n-86484 -86372\n14146 14360\n-34332 -34322\n-50853 -50605\n-59982 -59954\n-7236 -7012\n-45942 -45669\n41284 41468\n81372 81553\n63260 63270\n17923 17983\n-7276 -7124\n-93313 -93288\n-4236 -4054\n-27656 -27554\n-39031 -38862\n47953 48108\n54390 54497\n-61132 -61079\n-89725 -89542\n-75016 -74741\n-69933 -69681\n45144 45191\n-30494 -30361\n70605 70889\n26009 26233\n-57248 -57002\n99337 99601\n-98012 -97984\n-63771 -63491\n42368 42597\n-41 122\n31261 31278\n-10802 -10638\n-64757 -64692\n-53404 -53115\n-79853 -79757\n-27931 -27668\n-32072 -31937\n-62022 -61815\n-19490 -19430\n93614 93707\n93709 93861\n-81728 -81634\n-92211 -91998\n14757 14774\n11445 11652\n39226 39520\n63324 63462\n-71530 -71256\n84414 84463\n-52229 -52025\n19825 19852\n-12468 -12410\n-8537 -8349\n-51649 -51548\n4789 4932\n-87854 -87723\n-41151 -40989\n-2952 -2796\n-29679 -29385\n25975 26243\n-13013 -12744\n-73397 -73257\n37417 37526\n14936 15034\n-81578 -81577\n47013 47040\n-32361 -32077\n-21964 -21774\n89483 89556\n-60942 -60842\n73376 73576\n-42272 -42193\n55950 56122\n-65329 -65200\n-34039 -33861\n14894 15183\n-69402 -69223\n2337 2585\n94963 95110\n5380 5426\n6345 6545\n-3341 -3140\n5864 5889\n-99897 -99883\n-75408 -75204\n10898 11055\n37689 37733\n379 426\n35398 35527\n6968 7216\n-52042 -51778\n13238 13352\n69126 69410\n-65056 -64793\n-32042 -32003\n46183 46330\n45314 45433\n52858 53056\n41107 41245\n65511 65808\n24283 24473\n22625 22635\n-98793 -98549\n77080 77116\n-65557 -65264\n1808 1888\n51814 52090\n-53796 -53626\n78796 78966\n96155 96165\n5562 5652\n9305 9455\n72924 73174\n57257 57303\n98854 98940\n19428 19553\n71559 71810\n94633 94849\n-97112 -97058\n8511 8674\n-95475 -95440\n45689 45985\n59791 59996\n-20994 -20819\n-95594 -95482\n4021 4179\n-41360 -41153\n93360 93536\n59858 60055\n-1092 -806\n-4093 -4089\n44636 44720\n87207 87423\n-74177 -73936\n22527 22699\n-4097 -3980\n-59477 -59392\n-36893 -36620\n-129 -46\n-99781 -99760\n65424 65720\n10374 10479\n81260 81357\n-71523 -71408\n-91407 -91401\n-94691 -94543\n67087 67309\n17131 17419\n-67352 -67256\n12714 12728\n62533 62678\n30613 30613\n79767 79793\n-41836 -41680\n71830 72055\n95706 95939\n-3213 -3027\n27854 28145\n94688 94791\n20155 20257\n-45671 -45376\n1225 1276\n-5797 -5638\n91047 91127\n94676 94719\n-40869 -40594\n11611 11783\n77065 77085\n-64447 -64187\n-12761 -12686\n-60617 -60322\n-82667 -82430\n20339 20584\n-20898 -20894\n28299 28335\n-43588 -43484\n57510 57755\n79016 79083\n-79429 -79263\n-54434 -54402\n-5757 -5487\n-14873 -14725\n68891 69001\n22901 23026\n-73285 -73088\n19166 19385\n89405 89616\n24817 24886\n59117 59171\n54784 55073\n55226 55370\n-49559 -49333\n-17805 -17584\n49569 49769\n-84865 -84640\n70113 70251\n-21527 -21397\n-82676 -82387\n73272 73546\n-13008 -12813\n52989 53052\n38021 38199\n65165 65311\n-35309 -35038\n-70874 -70660\n-53366 -53108\n99456 99556\n-98361 -98186\n23418 23643\n-75787 -75671\n-69278 -69183\n-97065 -96944\n79067 79318\n-55999 -55932\n8664 8751\n-81134 -80964\n-83702 -83496\n-30889 -30715\n56180 56251\n-59440 -59234\n-49228 -49088\n-45979 -45911\n4720 4927\n20842 21063\n20422 20536\n-395 -154\n73181 73402\n95545 95762\n-56892 -56625\n-24542 -24468\n-2021 -1917\n-37842 -37582\n68485 68616\n-29864 -29855\n79473 79480\n-40690 -40406\n25260 25533\n87112 87351\n94636 94849\n14561 14792\n83363 83391\n7420 7583\n-27643 -27345\n56627 56656\n27975 28239\n24759 24809\n-86541 -86305\n59291 59317\n-10061 -10053\n-94017 -93879\n96287 96555\n-81766 -81552\n-36227 -36186\n-81349 -81333\n-83791 -83719\n-52959 -52677\n65420 65497\n-82084 -81858\n4465 4565\n63335 63597\n-25587 -25336\n3960 4050\n-16558 -16344\n-9952 -9762\n22804 23031\n47409 47578\n39048 39106\n52977 53083\n91374 91601\n25266 25542\n26251 26313\n35919 36165\n-51178 -50920\n39210 39415\n515 572\n-36558 -36508\n84106 84190\n19304 19429\n-25673 -25446\n-79718 -79694\n-89975 -89963\n-3239 -2991\n51512 51787\n94014 94271\n-47280 -47068\n-44598 -44567\n8001 8034\n-61739 -61729\n-37838 -37658\n-14509 -14433\n84906 84912\n70543 70601\n-73835 -73827\n-494 -379\n48221 48496\n4978 5255\n-73695 -73517\n-40540 -40276\n-92318 -92185\n-14374 -14296\n-34858 -34686\n39135 39350\n-45968 -45780\n-26929 -26697\n47869 47959\n19046 19205\n-11508 -11428\n82072 82192\n-62978 -62835\n27236 27433\n-78635 -78406\n27120 27306\n-67826 -67626\n-56215 -55942\n34809 34832\n-71041 -70810\n-80329 -80113\n-44387 -44330\n97865 97956\n99990 100073\n51139 51178\n82025 82187\n-21726 -21707\n35650 35651\n-74674 -74655\n-96733 -96443\n-80207 -79963\n84014 84277\n60415 60581\n70927 70959\n42083 42364\n-48074 -47974\n59704 59893\n-29747 -29733\n69261 69331\n-28816 -28635\n-13019 -12934\n-61987 -61835\n-82518 -82391\n-56949 -56787\n-60002 -59815\n70607 70802\n-1590 -1504\n7669 7701\n72352 72424\n-62090 -61896\n-59252 -59236\n89678 89713\n-9232 -9227\n-3324 -3032\n1923 2178\n24584 24622\n-28839 -28717\n-16942 -16729\n96116 96282\n52387 52445\n-72753 -72507\n45701 45900\n59118 59232\n-11115 -11000\n83932 84021\n-11521 -11465\n-95598 -95355\n94829 94899\n-19190 -19099\n-57002 -56794\n60933 61110\n48549 48608\n-77685 -77428\n54018 54159\n-3746 -3582\n-15954 -15728\n-43583 -43542\n11968 12155\n71608 71808\n87639 87884\n-6566 -6372\n-84065 -84030\n19441 19731\n-54080 -53830\n93525 93627\n22300 22317\n57169 57194\n-13851 -13772\n55659 55865\n-54059 -53764\n32682 32687\n-52467 -52251\n42516 42561\n48825 48879\n-25155 -25134\n91676 91960\n-91933 -91656\n58847 58975\n22130 22273\n-21719 -21619\n88354 88409\n-71101 -70906\n37521 37690\n93554 93761\n34670 34758\n-27081 -26880\n-44379 -44109\n-27023 -26775\n-77345 -77067\n76583 76721\n9982 10248\n77241 77330\n-6542 -6326\n-6128 -6037\n-58597 -58346\n-64706 -64663\n36493 36659\n-92527 -92438\n50754 50956\n63962 64258\n-2769 -2520\n-62278 -62034\n-74595 -74367\n-74389 -74256\n-75130 -75129\n-48122 -47854\n53008 53138\n64520 64777\n-25124 -24887\n1762 1918\n69825 70110\n-42838 -42750\n18981 19183\n87930 88210\n-44681 -44623\n91268 91487\n-43533 -43295\n-86008 -86008\n27696 27824\n-30109 -29858\n-83017 -82970\n54775 54800\n49010 49069\n12042 12302\n-79614 -79419\n-3904 -3882\n21760 21907\n735 833\n-78045 -77952\n-28353 -28295\n-16323 -16054\n27627 27835\n-4660 -4425\n-34440 -34244\n-55371 -55149\n-97961 -97917\n92660 92924\n43482 43509\n9355 9430\n-73033 -72871\n-1444 -1390\n272 315\n58200 58265\n-38797 -38571\n-13608 -13396\n3848 4136\n9643 9744\n-88077 -87980\n88203 88313\n-89841 -89598\n-4434 -4254\n-18270 -18232\n-52077 -51939\n56027 56229\n-6879 -6800\n48412 48528\n-65313 -65181\n-35041 -34843\n16835 17035\n-77255 -77189\n42628 42855\n10540 10767\n-42418 -42282\n-78537 -78431\n83001 83070\n28387 28500\n53225 53384\n82256 82495\n61050 61314\n14649 14723\n36062 36239\n-83068 -82774\n-24599 -24468\n-11819 -11677\n47401 47430\n-31426 -31366\n2839 3009\n27652 27813\n-43902 -43641\n42929 43154\n-56728 -56562\n-30138 -29868\n-7459 -7225\n53476 53514\n-18051 -17759\n41791 42027\n-40147 -40065\n44255 44342\n94513 94731\n40855 40945\n75082 75266\n37364 37625\n85721 85859\n92920 92972\n-61576 -61452\n40510 40705\n-14002 -13738\n70261 70278\n87269 87304\n-39916 -39747\n20789 20950\n-66163 -65977\n-37074 -37007\n70055 70143\n-87113 -87013\n-98889 -98681\n-23669 -23369\n13922 14036\n-51486 -51250\n194 330\n-20787 -20645\n423 661\n6925 7057\n-83014 -82805\n90785 90873\n-58735 -58699\n43971 44184\n504 656\n55472 55710\n39274 39317\n49511 49577\n66654 66845\n79125 79383\n-42362 -42232\n-76098 -75993\n-55876 -55576\n-98174 -98116\n13997 14200\n-71171 -70880\n-5833 -5562\n-51266 -51261\n29260 29295\n55100 55277\n-49399 -49201\n-67729 -67630\n30510 30731\n99408 99478\n-50828 -50615\n46695 46810\n-90463 -90435\n-4697 -4668\n-67520 -67305\n-45849 -45827\n57619 57722\n-34093 -33946\n-61673 -61568\n-54504 -54429\n72906 73191\n-28680 -28529\n12877 13071\n-89320 -89293\n59937 60098\n83491 83554\n90476 90573\n-99987 -99841\n-5415 -5214\n-37331 -37180\n67296 67347\n-3297 -3036\n-94673 -94630\n-22809 -22587\n4886 5171\n-8328 -8135\n-31572 -31484\n-71454 -71186\n87995 88128\n46352 46572\n-41169 -41120\n35756 35829\n-78528 -78277\n96002 96146\n46069 46215\n-62140 -62063\n10450 10540\n-23571 -23326\n-16156 -16107\n80347 80416\n-30279 -30058\n35211 35322\n73682 73958\n-16286 -16130\n32477 32634\n91427 91706\n39652 39837\n23590 23755\n-75660 -75540\n-32452 -32383\n-60849 -60641\n-39186 -39074\n-66013 -65914\n-58846 -58697\n63399 63638\n45218 45224\n-11549 -11334\n3562 3613\n-13955 -13819\n3787 3975\n87881 88149\n65060 65324\n95086 95223\n75373 75597\n-16213 -16074\n12422 12712\n-64396 -64170\n11781 11852\n-50700 -50556\n-53549 -53289\n12444 12622\n26819 27093\n71234 71407\n-35397 -35105\n-81860 -81619\n95383 95392\n-63433 -63408\n-22347 -22195\n-95653 -95465\n-95436 -95220\n97798 97846\n36205 36244\n-48132 -48060\n16265 16535\n27343 27557\n90048 90097\n39917 39953\n-52085 -51954\n29253 29459\n-21982 -21905\n-42322 -42058\n29065 29320\n-62540 -62433\n48297 48345\n-8425 -8211\n-59261 -59047\n-57488 -57199\n-40736 -40613\n78025 78157\n-83434 -83230\n9341 9580\n28739 28920\n30464 30470\n-648 -484\n53283 53479\n-43796 -43647\n69355 69621\n99052 99218\n50210 50368\n74734 74815\n-62593 -62296\n34317 34599\n-28267 -28143\n99696 99900\n-272 -191\n-92446 -92245\n94692 94747\n61553 61788\n13418 13500\n-50101 -49898\n-48331 -48081\n51835 52102\n90915 91063\n32312 32534\n97128 97359\n-24675 -24556\n63648 63787\n-49985 -49685\n61626 61791\n-5159 -5091\n11061 11161\n-31585 -31549\n82183 82418\n43778 43831\n56471 56474\n11749 11873\n91911 92130\n-81944 -81896\n-99714 -99622\n10221 10491\n-74120 -74020\n-1457 -1368\n9259 9556\n69007 69060\n-65649 -65565\n73219 73449\n-43163 -42917\n98721 98767\n8863 9029\n-22076 -21813\n-27922 -27793\n-15283 -14995\n19786 20028\n89351 89418\n-95231 -94949\n-4875 -4579\n96558 96751\n8464 8591\n61955 62007\n30292 30307\n61071 61301\n8693 8909\n-80855 -80791\n-9971 -9971\n-6949 -6715\n-95511 -95211\n13066 13092\n56435 56633\n16957 17180\n16909 17096\n39945 40095\n73191 73441\n-82664 -82620\n-97932 -97658\n-65321 -65035\n-43001 -42756\n-31549 -31516\n-96992 -96703\n-78732 -78658\n64714 64982\n-60961 -60870\n10611 10855\n60897 61110\n-76201 -76151\n-52627 -52568\n8102 8192\n-39090 -38990\n-51103 -51009\n-71046 -70828\n-58214 -58180\n43349 43358\n-18739 -18495\n69404 69420\n71360 71421\n-2529 -2497\n6863 6968\n-94980 -94816\n29441 29699\n76357 76417\n71872 71883\n-25777 -25567\n-29811 -29710\n-19471 -19471\n-15706 -15610\n-80345 -80106\n-19131 -18911\n-68882 -68845\n-62182 -62170\n-30955 -30941\n-41647 -41529\n39712 39800\n-15597 -15563\n78004 78153\n-26593 -26571\n64778 64916\n-44442 -44205\n64608 64700\n12941 13176\n-86183 -86183\n40723 40732\n93338 93492\n-80447 -80299\n8979 9163\n-28348 -28132\n33405 33587\n-61127 -61077\n-51254 -51216\n8477 8507\n17868 17914\n73852 74121\n80303 80363\n-23623 -23492\n8386 8602\n72362 72433\n-99688 -99449\n-78759 -78645\n6032 6161\n6843 6844\n72173 72431\n-25682 -25643\n6134 6156\n2261 2496\n-98373 -98326\n44948 45162\n97139 97181\n9786 10040\n-18388 -18119\n14491 14564\n-50383 -50166\n-62192 -61915\n-16618 -16355\n-96295 -96216\n-93417 -93314\n36685 36734\n-2337 -2138\n-12329 -12036\n75917 76133\n98304 98442\n-19601 -19587\n-92017 -91929\n91948 92158\n-34845 -34728\n47367 47531\n3342 3573\n32302 32378\n47265 47507\n-928 -828\n-39200 -38915\n35574 35693\n60428 60637\n11945 12037\n-18018 -17765\n16500 16620\n-63728 -63548\n6190 6457\n-939 -740\n-82147 -82026\n-81502 -81270\n99614 99708\n30650 30737\n-17326 -17310\n-20935 -20919\n41605 41776\n79313 79474\n18551 18751\n-9450 -9409\n-90532 -90454\n-6373 -6200\n-47702 -47529\n82568 82818\n-26443 -26434\n34963 35208\n96492 96575\n-40181 -39912\n-11283 -11212\n38014 38254\n-36574 -36326\n49334 49596\n53056 53090\n-7333 -7236\n-65298 -65272\n-62355 -62324\n62890 63089\n32781 32805\n57721 57739\n10144 10355\n97329 97377\n37230 37496\n-43979 -43765\n-24248 -24154\n93054 93078\n12576 12744\n-26914 -26912\n45159 45339\n78039 78154\n49583 49812\n-24068 -23798\n50517 50635\n-98262 -98237\n88685 88912\n-50278 -50195\n-80835 -80807\n-64557 -64317\n57386 57490\n-66314 -66279\n34035 34269\n52082 52226\n-44831 -44622\n-46892 -46636\n94101 94357\n18306 18502\n86211 86351\n72128 72302\n-45832 -45711\n-17573 -17445\n-95211 -95112\n-6981 -6690\n-56829 -56690\n-24617 -24416\n14653 14731\n-32391 -32219\n75570 75654\n95283 95547\n-56221 -56177\n39240 39532\n-80907 -80710\n78017 78200\n-44775 -44715\n-45196 -44936\n-97917 -97817\n-89154 -89023\n-89115 -88829\n-93336 -93037\n71469 71470\n29071 29236\n51906 52032\n-64814 -64553\n-3414 -3209\n-49311 -49115\n-23277 -23052\n-85388 -85153\n24962 25097\n62342 62579\n-48824 -48662\n20101 20121\n-95935 -95796\n-40128 -39944\n-21293 -21163\n-49384 -49366\n-26708 -26664\n90721 90971\n-24751 -24562\n-66605 -66318\n3085 3130\n53539 53624\n-65697 -65580\n-220 -33\n17516 17642\n-8532 -8413\n-21258 -21068\n39378 39525\n-25659 -25559\n-4849 -4769\n23103 23373\n70492 70677\n-47435 -47275\n53190 53366\n54406 54680\n-39161 -39099\n-79413 -79213\n-52516 -52236\n4814 4923\n-54315 -54293\n97981 98200\n-95210 -95114\n74254 74382\n-47603 -47532\n-69260 -69181\n77350 77636\n-3504 -3272\n54164 54426\n55792 56050\n-74677 -74572\n-60455 -60430\n24511 24754\n23555 23652\n-29759 -29694\n-50209 -49935\n-56736 -56505\n-30881 -30854\n18482 18629\n81396 81538\n37847 37876\n-90344 -90246\n-50056 -49781\n71128 71136\n-17839 -17704\n-43095 -43070\n-89533 -89410\n91005 91030\n-75241 -75034\n77853 78130\n39221 39357",
        expected: "759",
      },
    ],
    hints: [
      "Consider the banner that ends first. Some dart must hit it. Where in its range is the most useful place for that dart?",
      "A dart at the very end of the earliest-ending banner hits everything any other position in that banner could, and possibly more.",
      "Sort by end. Throw a dart at the first banner's end; skip every banner that dart hits; repeat with the next untouched banner.",
    ],
    solutions: [
      {
        title: "Optimal: sort by end, throw at the earliest end",
        order: 1,
        intuition:
          "The banner ending first must be hit by some dart, and that dart cannot be further right than its end. Sliding the dart right to exactly that end only gains coverage: every other banner it hit before still contains the new position, because they all end no earlier. After that dart, every banner whose start is ≤ its position is torn; the first banner starting after it begins the next round.",
        approach: [
          "Sort banners by end.",
          "Set darts = 0 and last = none.",
          "For each banner, if no dart yet or its start > last, throw a new dart at its end: darts += 1, last = end.",
          "Otherwise the banner is already torn by the dart at last.",
        ],
        code: {
          PYTHON: `def fewestDarts(banners: List[List[int]]) -> int:
    darts = 0
    last = None  # position of the most recent dart

    for start, end in sorted(banners, key=lambda b: b[1]):
        if last is None or start > last:
            darts += 1
            last = end  # as far right as this banner allows

    return darts`,
          JAVA: `class Solution {
    public int fewestDarts(int[][] banners) {
        int[][] ordered = banners.clone();
        Arrays.sort(ordered, (a, b) -> Integer.compare(a[1], b[1]));

        int darts = 0;
        long last = Long.MIN_VALUE;
        for (int[] banner : ordered) {
            if (banner[0] > last) {
                darts++;
                last = banner[1];
            }
        }
        return darts;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n) for the sorted copy",
        edgeCases: [
          "Banners that only share an edge point can be torn by one dart.",
          "A single-point banner such as [3, 3].",
          "Negative positions.",
        ],
        commonMistakes: [
          "Sorting by start and throwing at the first banner's end, missing that a later banner nested inside it ends sooner.",
          "Using ≥ instead of >, which throws an extra dart for banners that touch the last one.",
          "Using Integer.MIN_VALUE as a sentinel in languages where a banner may start there.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "trim-the-talk-schedule",
    title: "Trim the Talk Schedule",
    difficulty: "MEDIUM",
    learningObjective:
      "Maximise kept intervals by always keeping the one that finishes earliest, and compare that greedy against the dynamic-programming baseline.",
    topics: ["intervals", "greedy"],
    patterns: ["greedy", "dynamic-programming"],
    statement: [
      para(
        "A meetup has a single stage, but the organisers accepted too many talks. Each talk is a row [start, end]; it occupies the stage from start up to, but not including, end. Two talks clash if their times overlap; one talk ending at the minute another starts is fine."
      ),
      para(
        "Return the fewest talks that must be dropped so that no two remaining talks clash."
      ),
      example(
        "talks = [[1, 2], [2, 3], [3, 4], [1, 3]]",
        "1",
        [
          { state: "[1,2] [2,3] [1,3] [3,4]", note: "sorted by end" },
          { state: "keep [1,2]", note: "stage free from 2" },
          { state: "keep [2,3]", note: "starts at 2 — fine" },
          { state: "drop [1,3]", note: "starts before 3" },
          { state: "keep [3,4]", note: "3 kept of 4 → drop 1" },
        ],
        "Keep whatever frees the stage soonest"
      ),
    ],
    constraints: ["1 ≤ talks.length ≤ 10000", "-100000 ≤ start < end ≤ 100000"],
    signature: {
      params: ["int[][]"],
      paramNames: ["talks"],
      returns: "int",
      functionName: "minTalksToDrop",
    },
    tests: [
      {
        input: "4\n1 2\n2 3\n3 4\n1 3",
        expected: "1",
        isSample: true,
        explanation: "Dropping [1,3] leaves three back-to-back talks.",
      },
      {
        input: "3\n1 5\n1 5\n1 5",
        expected: "2",
        isSample: true,
        explanation: "Three identical talks: only one can stay.",
      },
      {
        input: "1\n4 9",
        expected: "0",
      },
      {
        input: "2\n1 2\n2 3",
        expected: "0",
      },
      {
        input: "4\n1 100\n11 22\n1 11\n2 12",
        expected: "2",
      },
      {
        input: "5\n0 2\n1 3\n2 4\n3 5\n4 6",
        expected: "2",
      },
      {
        input: "3\n-10 -5\n-6 0\n0 4",
        expected: "1",
      },
      {
        input:
          "1500\n3323 3409\n932 1122\n30064 30254\n6320 6399\n27995 28165\n17033 17161\n19359 19543\n24008 24147\n19134 19247\n40770 40796\n47274 47367\n18520 18697\n11352 11385\n22429 22558\n8047 8087\n11536 11552\n17854 18016\n49293 49322\n27728 27788\n8254 8453\n15907 15948\n11721 11828\n27241 27439\n2548 2576\n35127 35288\n40265 40448\n20161 20218\n29302 29500\n38537 38565\n41583 41720\n3109 3181\n31139 31199\n11827 12009\n36231 36268\n37156 37210\n45502 45555\n16756 16824\n29656 29796\n41007 41036\n13362 13481\n47373 47442\n40707 40736\n14493 14677\n41891 42076\n31037 31063\n6696 6786\n27230 27336\n31246 31442\n28943 29089\n19634 19727\n3846 3900\n34362 34469\n15758 15914\n30046 30230\n12007 12035\n3415 3470\n114 160\n46532 46648\n2513 2618\n1309 1478\n15177 15280\n20954 21110\n20929 20935\n44523 44592\n23956 24123\n32111 32220\n23225 23409\n23905 24023\n29125 29257\n48427 48435\n26079 26264\n24851 24903\n3732 3762\n35148 35176\n24806 24916\n22602 22736\n17766 17893\n37389 37403\n42921 42964\n42834 43001\n47536 47649\n43565 43762\n21975 22105\n8694 8783\n27770 27787\n40530 40596\n15903 15904\n34638 34690\n2248 2402\n17645 17842\n18240 18437\n46989 47057\n18693 18842\n31845 31893\n18231 18265\n5118 5242\n22062 22210\n29246 29421\n30501 30646\n21742 21936\n40731 40814\n39514 39540\n25129 25296\n49599 49654\n21858 21970\n14417 14437\n8234 8236\n41353 41416\n7408 7574\n21133 21192\n40141 40143\n39593 39720\n30739 30922\n21467 21646\n45212 45235\n46654 46675\n18770 18865\n2551 2561\n37124 37240\n36592 36608\n7230 7388\n48311 48375\n6907 7042\n1270 1351\n20447 20612\n35531 35689\n49724 49800\n20888 21060\n45651 45770\n49111 49161\n5744 5805\n31014 31064\n38009 38129\n28953 28969\n4778 4900\n35866 36011\n35617 35757\n48658 48758\n16246 16327\n14008 14068\n13301 13499\n22683 22796\n39204 39254\n2481 2679\n22631 22778\n45062 45082\n15311 15438\n48132 48162\n36428 36524\n19137 19192\n35135 35292\n25487 25491\n36212 36390\n43060 43111\n41185 41246\n20101 20137\n28123 28178\n40167 40288\n40550 40577\n13879 13881\n10863 10915\n7488 7665\n13254 13362\n29264 29330\n41503 41549\n7671 7860\n24245 24317\n42999 43195\n22594 22737\n47013 47104\n40355 40509\n19966 20038\n31581 31624\n37137 37146\n21205 21284\n24427 24586\n13142 13157\n22315 22447\n33920 34067\n37255 37276\n4482 4564\n18096 18175\n40443 40558\n2933 2955\n46153 46250\n43475 43482\n2402 2414\n40411 40459\n45236 45314\n2672 2768\n24164 24290\n46439 46549\n48039 48065\n47171 47301\n38626 38812\n3238 3320\n39082 39092\n36523 36692\n15721 15788\n31223 31294\n26212 26364\n2929 3051\n49220 49253\n46757 46880\n9802 9928\n14104 14147\n23176 23183\n19748 19908\n9086 9237\n20753 20810\n22031 22166\n11911 12090\n32178 32316\n48775 48898\n31152 31163\n12306 12383\n32241 32320\n47621 47717\n20290 20306\n29563 29713\n39004 39165\n12509 12664\n28366 28552\n35804 35968\n22853 22887\n15745 15899\n15627 15735\n46262 46359\n26051 26122\n9600 9686\n19878 19913\n9438 9576\n38903 39038\n25094 25282\n47785 47918\n10357 10475\n14801 14913\n35436 35500\n49614 49768\n23686 23793\n5230 5332\n4140 4161\n45434 45584\n25478 25617\n48869 48927\n49438 49440\n34777 34826\n42897 43021\n47134 47285\n14942 15006\n24498 24623\n48332 48408\n17981 18057\n28464 28626\n43906 44071\n6271 6469\n2795 2863\n14072 14089\n4165 4275\n8215 8242\n10123 10302\n31188 31210\n45314 45388\n17188 17283\n9057 9141\n24743 24804\n32370 32522\n29080 29207\n14157 14191\n40189 40308\n11113 11123\n23406 23411\n13017 13110\n28362 28420\n18680 18856\n27180 27370\n27427 27454\n45298 45393\n32023 32027\n29567 29625\n10382 10512\n6737 6820\n37175 37350\n3710 3841\n2463 2551\n12707 12889\n12185 12291\n6966 7065\n4391 4440\n35243 35359\n26148 26167\n4949 5100\n11387 11437\n43178 43334\n5199 5229\n5482 5522\n35457 35513\n40234 40433\n25318 25460\n42067 42135\n35433 35587\n26342 26374\n18580 18774\n11089 11137\n6028 6134\n43583 43676\n44526 44713\n9171 9202\n9032 9094\n45230 45264\n49019 49176\n34221 34272\n2051 2069\n18752 18933\n20574 20772\n43450 43461\n4509 4640\n3539 3726\n10752 10842\n42536 42548\n38992 39053\n13628 13793\n2347 2348\n45466 45511\n25273 25310\n44574 44577\n48589 48638\n1680 1844\n24917 24930\n968 1025\n39220 39263\n32429 32526\n11689 11803\n28151 28349\n38567 38691\n13425 13474\n24716 24776\n9586 9662\n35492 35648\n31132 31266\n15738 15741\n12042 12180\n617 643\n47664 47738\n20244 20433\n14997 15047\n6503 6681\n37266 37333\n252 374\n18619 18673\n16499 16601\n29828 29872\n2554 2735\n38668 38793\n18470 18659\n48159 48298\n35928 36083\n40163 40230\n27307 27491\n25294 25461\n38318 38319\n24298 24353\n48934 49047\n31935 31975\n42950 42967\n28624 28670\n36083 36209\n26769 26907\n46615 46641\n8478 8575\n13197 13221\n31486 31670\n26031 26168\n45331 45447\n30256 30258\n12412 12549\n1279 1388\n14309 14397\n33353 33433\n32768 32789\n11826 11915\n40835 40877\n21572 21672\n38213 38403\n41228 41319\n46693 46781\n44754 44774\n16270 16462\n27283 27434\n13090 13160\n27935 28129\n37384 37469\n2612 2661\n7892 7975\n11227 11353\n36781 36834\n13844 14030\n9436 9577\n46211 46284\n13827 14005\n22747 22813\n27065 27119\n36355 36385\n20233 20261\n21028 21183\n43593 43643\n48337 48375\n26576 26737\n33400 33557\n18283 18318\n3206 3214\n47479 47558\n2969 2990\n16809 16905\n29262 29358\n23256 23277\n47877 48007\n21896 21947\n4550 4734\n29879 29931\n25536 25596\n35357 35427\n35466 35652\n11119 11189\n28421 28606\n18523 18716\n19592 19697\n20135 20249\n47326 47486\n40063 40247\n39748 39942\n25710 25730\n40041 40128\n34456 34607\n13646 13738\n49267 49449\n6219 6235\n21632 21762\n17311 17461\n18918 19031\n33797 33955\n20534 20616\n13325 13458\n4913 5004\n7230 7316\n1100 1211\n37208 37381\n42951 43099\n40970 41057\n19022 19057\n3497 3546\n13021 13073\n44935 44960\n17790 17799\n33918 34049\n1031 1151\n34066 34175\n5390 5479\n8427 8475\n28143 28308\n20032 20201\n3875 4036\n14683 14771\n29781 29840\n12258 12275\n48270 48455\n25340 25494\n45658 45768\n18038 18172\n10629 10710\n30077 30097\n46341 46430\n1717 1853\n43364 43447\n20066 20108\n6900 6910\n41573 41641\n31131 31255\n40711 40786\n49624 49742\n47087 47091\n46810 46873\n16741 16811\n3742 3835\n19326 19501\n19922 20076\n376 444\n36252 36400\n5186 5253\n37804 37890\n3972 4084\n41198 41354\n48730 48824\n34806 34960\n15899 15910\n14423 14596\n29062 29252\n19146 19194\n13192 13213\n7705 7867\n7630 7761\n39653 39800\n2374 2539\n40611 40676\n23157 23287\n13875 13883\n1213 1297\n25126 25218\n3726 3812\n15202 15339\n428 549\n45544 45661\n27711 27909\n34425 34434\n17667 17743\n46078 46228\n19609 19687\n17114 17242\n19110 19210\n1192 1295\n5453 5459\n31659 31697\n17328 17507\n1310 1349\n24038 24227\n23744 23786\n9341 9375\n13389 13511\n14366 14441\n36624 36627\n38339 38422\n36169 36362\n47156 47300\n49095 49245\n10348 10544\n13926 14014\n30188 30213\n4773 4834\n30412 30473\n39898 39908\n8886 8897\n22977 23166\n6334 6344\n8815 8925\n49911 49949\n36804 36813\n37018 37155\n20885 20976\n42145 42255\n41338 41453\n29374 29557\n39936 39968\n16459 16465\n34410 34558\n11530 11570\n20538 20675\n6344 6360\n49728 49880\n11965 12073\n31922 32023\n33369 33457\n46201 46239\n12015 12033\n38539 38645\n7396 7483\n23465 23508\n19603 19787\n18478 18578\n986 1174\n23019 23213\n32750 32765\n25576 25670\n14797 14916\n48644 48731\n13631 13691\n5510 5608\n45401 45402\n13228 13362\n29727 29799\n10795 10824\n9861 10008\n21252 21446\n43321 43398\n17079 17167\n43757 43826\n25987 26060\n43134 43257\n41263 41278\n3965 4165\n46415 46531\n36544 36689\n29503 29533\n22778 22918\n26756 26914\n34969 35073\n48380 48557\n26552 26629\n26534 26587\n43596 43649\n38242 38351\n38606 38651\n15052 15248\n37082 37162\n5682 5747\n16343 16538\n29653 29808\n48199 48245\n10736 10770\n45945 46096\n24619 24728\n35968 36025\n34232 34377\n10221 10238\n41570 41605\n30351 30544\n42161 42340\n29269 29343\n3432 3461\n4994 5154\n19248 19295\n29903 30004\n49912 50091\n4597 4794\n8020 8024\n41507 41579\n18430 18561\n15567 15764\n28251 28407\n9907 10063\n26426 26485\n1384 1515\n10097 10143\n10560 10631\n17598 17629\n12722 12813\n9683 9822\n27198 27241\n22877 22884\n23210 23211\n30511 30685\n11082 11225\n11325 11339\n19614 19662\n30263 30331\n48850 48888\n10543 10581\n12417 12527\n4789 4791\n44428 44518\n32189 32382\n1395 1592\n35734 35808\n36913 37059\n29494 29588\n2618 2714\n17980 18159\n23926 24028\n27455 27492\n5875 5946\n24949 24983\n42239 42365\n34784 34952\n38258 38440\n23138 23271\n8740 8811\n8949 9132\n32770 32833\n26656 26847\n34766 34827\n41708 41735\n19872 20034\n3599 3762\n32767 32919\n39586 39709\n14054 14197\n34865 34916\n15673 15723\n20907 21064\n21319 21344\n12317 12420\n45406 45411\n35603 35639\n37449 37518\n12257 12450\n3189 3227\n36390 36392\n4743 4765\n27984 28138\n49158 49330\n35614 35653\n27003 27175\n17436 17484\n47851 47889\n13907 13917\n47590 47644\n10782 10831\n10063 10175\n26793 26923\n38346 38457\n7753 7787\n20483 20669\n7829 7999\n26116 26185\n25559 25711\n48430 48577\n26780 26800\n37300 37360\n47742 47890\n12246 12326\n4410 4427\n17788 17846\n47931 47958\n39839 39882\n48188 48251\n7023 7044\n27420 27536\n40044 40227\n35150 35197\n11032 11071\n11754 11931\n10117 10205\n38396 38469\n24835 24872\n37414 37495\n13989 14113\n34969 35109\n21635 21644\n1902 2061\n32675 32805\n47606 47783\n25132 25254\n9315 9402\n44969 45009\n15841 15957\n19394 19455\n11006 11035\n6419 6571\n40347 40391\n27238 27263\n25442 25525\n37533 37608\n22729 22789\n33928 33944\n22975 23122\n2538 2557\n24827 24959\n43119 43251\n23787 23801\n22792 22912\n7723 7773\n31452 31641\n37240 37313\n44861 45008\n33707 33744\n9367 9380\n17864 17953\n13527 13539\n43313 43324\n6736 6866\n20236 20281\n24157 24310\n14300 14456\n27499 27565\n27680 27806\n25995 26187\n4131 4263\n31082 31237\n16406 16602\n14721 14795\n1849 2040\n48120 48273\n33419 33427\n43309 43436\n22285 22287\n7749 7781\n5960 6080\n33227 33321\n3043 3200\n33310 33401\n13274 13422\n23890 23932\n33203 33344\n10341 10445\n30599 30752\n47051 47106\n10557 10688\n28334 28390\n49617 49651\n41081 41176\n29646 29672\n7466 7611\n6605 6792\n33143 33227\n38996 39028\n124 176\n39230 39412\n20065 20127\n1910 2083\n15383 15557\n32170 32194\n21730 21905\n27637 27649\n44042 44239\n31177 31254\n8640 8808\n28340 28353\n17433 17558\n48162 48213\n20224 20249\n46264 46461\n12142 12218\n34729 34751\n3916 4096\n44350 44500\n10724 10796\n22251 22364\n22586 22780\n38198 38246\n35439 35517\n11254 11322\n7709 7819\n31185 31354\n40090 40267\n49395 49414\n34902 34982\n39124 39205\n23865 23935\n19223 19280\n14051 14210\n6610 6611\n3942 4002\n25734 25875\n1118 1261\n8359 8528\n1480 1657\n15913 15920\n43602 43739\n18151 18189\n13588 13589\n704 796\n26883 26995\n12075 12083\n32878 32989\n47982 48165\n17171 17174\n23082 23138\n25013 25168\n37370 37515\n39904 40027\n12935 13027\n44767 44908\n46453 46469\n48029 48151\n48236 48266\n34726 34819\n20086 20272\n36976 37130\n48790 48960\n9071 9242\n15218 15233\n32392 32479\n37476 37525\n6632 6676\n46276 46364\n45093 45242\n3403 3424\n33521 33658\n49598 49712\n4363 4459\n33004 33197\n23350 23465\n33213 33389\n5764 5861\n48519 48596\n36096 36148\n29957 29972\n11730 11823\n19159 19286\n1517 1543\n136 140\n26323 26408\n23909 24028\n34436 34587\n4755 4777\n34972 35026\n34023 34037\n42645 42788\n9922 10038\n21051 21236\n22270 22470\n29480 29514\n21555 21732\n7878 7994\n7752 7892\n16380 16432\n31243 31351\n12694 12757\n23045 23206\n11293 11478\n20283 20408\n12119 12214\n22833 22873\n22915 23023\n46068 46232\n23759 23909\n46728 46793\n38453 38595\n25557 25614\n29878 29880\n37323 37492\n9687 9741\n21575 21689\n25008 25153\n24118 24225\n35680 35800\n25292 25415\n38721 38892\n11475 11653\n47828 47909\n25980 26130\n205 385\n36357 36528\n27453 27630\n39004 39074\n21124 21294\n8581 8652\n5699 5702\n39210 39255\n19395 19448\n33456 33633\n47337 47451\n4954 4973\n9480 9567\n1605 1731\n43819 43941\n31149 31343\n26358 26435\n15642 15686\n12894 12896\n20240 20411\n18165 18192\n16064 16166\n48061 48249\n17079 17088\n45400 45435\n42462 42630\n24362 24386\n31960 31961\n7662 7663\n10126 10313\n10879 11051\n48484 48656\n23391 23562\n4737 4839\n48517 48691\n17474 17540\n26688 26879\n31448 31509\n27324 27399\n49136 49252\n31298 31393\n16051 16201\n40395 40401\n47516 47695\n36187 36207\n27716 27843\n15823 15916\n1587 1776\n43463 43636\n24843 24993\n34713 34876\n35590 35601\n10189 10293\n44905 44913\n26928 27075\n23262 23272\n20591 20756\n23158 23319\n49419 49541\n46546 46700\n33799 33814\n2498 2629\n22529 22599\n16261 16279\n12626 12638\n36807 36827\n8149 8300\n12383 12406\n37712 37896\n42340 42428\n30835 30852\n25186 25309\n43968 44124\n27702 27872\n10024 10104\n34917 35100\n45540 45705\n4363 4534\n8508 8544\n12885 13049\n37497 37519\n47409 47539\n27892 28067\n12580 12744\n42427 42609\n23950 24125\n42655 42728\n34471 34559\n39369 39544\n4239 4257\n14322 14520\n3673 3760\n38749 38895\n49219 49417\n16573 16655\n4268 4412\n24428 24519\n40656 40696\n38418 38539\n20525 20658\n33298 33323\n3880 4051\n22076 22178\n28530 28586\n28481 28540\n32377 32397\n45501 45630\n43014 43207\n25289 25307\n18255 18383\n9465 9598\n34024 34165\n19680 19764\n2261 2285\n17214 17402\n15491 15686\n11731 11881\n32802 32849\n30785 30875\n23263 23267\n31899 32065\n21746 21834\n32422 32545\n40154 40314\n21188 21362\n31064 31130\n41167 41179\n22142 22275\n39092 39104\n11941 11958\n34582 34589\n34208 34339\n18109 18118\n43698 43897\n43696 43846\n35447 35486\n6499 6504\n28515 28678\n6380 6399\n4185 4374\n13402 13497\n40790 40908\n31426 31580\n42800 42948\n24394 24560\n21651 21774\n16026 16038\n47842 47890\n27723 27848\n15003 15115\n35652 35668\n32695 32826\n18667 18831\n36855 36980\n3564 3592\n47280 47445\n22691 22719\n15619 15678\n1826 2000\n6186 6374\n48921 48960\n16939 16947\n40753 40854\n13285 13318\n11152 11232\n21900 22060\n3352 3499\n47460 47539\n19998 20034\n11258 11333\n43929 43983\n25080 25220\n9523 9557\n32360 32428\n16655 16847\n43946 44056\n28105 28125\n47156 47219\n35601 35798\n4096 4209\n31754 31817\n5022 5153\n48 110\n11600 11698\n2960 3158\n39190 39343\n22925 23020\n42178 42308\n33456 33533\n6584 6759\n38196 38302\n31979 32170\n29146 29271\n27826 27949\n23859 23940\n16954 16970\n29457 29480\n35319 35483\n47807 47937\n28271 28333\n8827 8943\n2697 2741\n29418 29420\n16274 16430\n37295 37333\n24057 24205\n20262 20321\n23437 23487\n1893 1923\n21851 21900\n35877 35890\n18578 18730\n18286 18366\n41519 41607\n26373 26485\n3324 3400\n27679 27764\n40985 41180\n47573 47728\n44797 44871\n26281 26437\n15243 15313\n15004 15034\n23223 23284\n39331 39427\n24919 25009\n46869 47051\n12794 12949\n24031 24054\n6532 6661\n24276 24463\n9529 9667\n46105 46216\n45003 45108\n11351 11397\n38168 38343\n10649 10832\n31627 31630\n39524 39654\n41029 41112\n45333 45412\n31454 31468\n34386 34391\n11925 11983\n18894 18896\n1625 1731\n39124 39244\n46115 46247\n31238 31288\n7267 7435\n48850 48985\n6305 6379\n25598 25703\n8567 8734\n28553 28701\n44022 44045\n29008 29206\n24441 24517\n47450 47513\n49805 49894\n9750 9788\n38009 38045\n35429 35462\n47067 47160\n5580 5780\n41357 41413\n42255 42449\n28605 28651\n43149 43162\n26081 26109\n15604 15640\n49177 49261\n18779 18864\n32640 32642\n16779 16839\n20625 20636\n35122 35311\n14222 14397\n30625 30802\n40665 40725\n33633 33721\n25871 25876\n10100 10246\n1546 1664\n45236 45291\n4301 4379\n10215 10315\n44768 44819\n27490 27569\n10063 10147\n6008 6147\n31281 31300\n12418 12524\n45747 45803\n15977 16035\n6760 6870\n44049 44140\n47631 47652\n32384 32528\n39311 39380\n15177 15208\n28135 28279\n3318 3495\n46631 46652\n10438 10546\n2427 2429\n48279 48288\n2229 2394\n43326 43397\n5986 6044\n26937 27126\n49325 49414\n10810 10888\n6180 6297\n35317 35488\n3227 3271\n49502 49639\n10561 10651\n37005 37162\n46723 46734\n745 849\n29454 29480\n38495 38531\n48476 48496\n6982 7025\n13420 13520\n5898 5966\n29614 29786\n24778 24809\n11601 11669\n41402 41581\n36891 36919\n33074 33128\n42774 42944\n39956 39978\n43215 43314\n26185 26260\n31222 31231\n13946 13991\n21420 21533\n2837 2985\n43223 43417\n13211 13409\n45315 45468\n36899 36924\n20900 21064\n36148 36231\n37917 38073\n28670 28725\n26042 26230\n24315 24467\n18330 18376\n810 840\n8094 8156\n25684 25757\n42621 42658\n27470 27612\n28774 28846\n39931 40091\n48547 48682\n42773 42785\n13315 13484\n42300 42318\n5157 5161\n923 929\n21288 21445\n41571 41735\n15173 15220\n37512 37559\n17116 17191\n15379 15389\n14452 14466\n32638 32820\n7065 7205\n10409 10483\n6913 7004\n29168 29348\n24671 24826\n14051 14135\n17049 17106\n15987 16132\n23240 23408\n22163 22248\n8111 8296\n22209 22306\n23680 23808\n31786 31949\n26650 26740\n40365 40423\n36968 37154\n26319 26363\n46201 46395\n38918 39108\n1690 1702\n40523 40688\n5423 5500\n9513 9659\n17579 17622\n14687 14691\n13726 13903\n26283 26398\n29648 29714\n47355 47437\n15245 15416\n636 733\n29419 29507\n10057 10240\n44128 44244\n46416 46502\n43539 43694\n9623 9675\n40832 40970\n40910 40954\n18310 18387\n40881 41043\n7158 7197\n8800 8871\n41455 41637\n2541 2735\n5830 5951\n26810 26883\n15476 15525\n9528 9625\n41339 41480\n12128 12198\n3002 3050\n9142 9334\n11321 11326\n14337 14477\n3770 3826\n22473 22476\n12639 12718\n280 329\n49451 49601\n20184 20337\n40853 41029\n22134 22324\n44089 44103\n43607 43759\n23836 23979\n33358 33368\n40182 40335\n11812 11827\n10683 10844\n48256 48452\n39564 39764\n6852 6912\n10452 10642\n21185 21220\n6641 6795\n37160 37177\n43089 43198\n38144 38214\n34858 34992\n29741 29856\n12840 12917\n20840 20937\n24146 24180\n31330 31432\n34255 34301\n34126 34201\n24570 24702\n198 283\n12560 12640\n41116 41118\n6114 6166\n11408 11428\n33781 33960\n30927 31074\n25213 25292\n6134 6169\n39437 39569\n45159 45348\n7805 7877\n3192 3311\n10471 10630\n44253 44289\n24687 24761\n36565 36637\n3850 4002\n37295 37332\n40011 40113\n36194 36321\n13312 13463\n43118 43233\n16446 16542\n35000 35173\n3326 3504\n37920 38063\n23163 23334\n7410 7457\n48487 48614\n45110 45170\n26123 26212\n11940 12024\n35681 35790\n7499 7579\n22539 22703\n5575 5725\n3372 3402\n19228 19361\n42787 42810\n47257 47366\n14409 14505\n27623 27726\n37219 37392\n48754 48792\n14968 14971\n24409 24536\n47985 48174\n26253 26445\n27024 27137\n36642 36664\n8024 8158\n34511 34609\n3422 3484\n13035 13078\n24196 24348\n29373 29424\n29947 29997\n23335 23484\n20771 20966\n7656 7793\n47909 48030\n34589 34596\n33967 34011\n19498 19610\n26102 26148\n38028 38098\n21860 21988\n12535 12610\n3847 3978\n14958 14959\n3857 3901\n8496 8535\n16028 16177\n31003 31151\n45271 45293\n37643 37661\n18825 18975\n13797 13825\n25091 25196\n5824 5895\n24166 24265\n30471 30544\n44045 44071\n47855 48015\n47038 47135\n25065 25251\n26900 26902\n42219 42224\n45728 45824\n28585 28725\n9218 9335\n6487 6653\n12113 12115\n13951 14072\n32087 32147\n18709 18892\n2207 2356\n21243 21357\n13048 13097\n38415 38427\n48825 49004\n29754 29939\n5216 5332\n24728 24780\n21656 21700\n19543 19552\n14989 15096\n35617 35726\n18122 18149\n31064 31140\n13927 13947\n45950 45993\n28076 28238\n29989 30094\n17686 17768\n46583 46649\n14420 14549",
        expected: "985",
      },
    ],
    hints: [
      "Dropping the fewest is the same as keeping the most. Rephrase the question that way.",
      "Among all talks, which one is the safest to keep first? Think about what it leaves for the others.",
      "The talk that ends earliest leaves the stage free for the longest. Keep it, discard anything that clashes with it, and repeat.",
      "Sort by end time and greedily keep each talk that starts no earlier than the last kept one ends.",
    ],
    solutions: [
      {
        title: "Longest compatible chain with dynamic programming",
        order: 1,
        intuition:
          "Sort talks by start. best[i] is the longest clash-free run that ends with talk i: extend the best run of any earlier talk that finishes by talk i's start. The largest best[i] is how many talks can stay.",
        approach: [
          "Sort talks by start.",
          "best[i] = 1 + max(best[j]) over j < i with end_j ≤ start_i (or 1 if none).",
          "Answer = total talks - max(best).",
        ],
        code: {
          PYTHON: `def minTalksToDrop(talks: List[List[int]]) -> int:
    ordered = sorted(talks)
    n = len(ordered)
    best = [1] * n
    for i in range(n):
        for j in range(i):
            if ordered[j][1] <= ordered[i][0]:
                best[i] = max(best[i], best[j] + 1)
    return n - max(best)`,
          JAVA: `class Solution {
    public int minTalksToDrop(int[][] talks) {
        int[][] ordered = talks.clone();
        Arrays.sort(ordered, (a, b) -> Integer.compare(a[0], b[0]));
        int n = ordered.length, kept = 0;
        int[] best = new int[n];
        for (int i = 0; i < n; i++) {
            best[i] = 1;
            for (int j = 0; j < i; j++) {
                if (ordered[j][1] <= ordered[i][0]) best[i] = Math.max(best[i], best[j] + 1);
            }
            kept = Math.max(kept, best[i]);
        }
        return n - kept;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n)",
        edgeCases: ["A single talk — nothing to drop."],
        commonMistakes: [
          "Using < instead of ≤ for compatibility, rejecting back-to-back talks.",
        ],
      },
      {
        title: "Optimal: earliest finish first",
        order: 2,
        intuition:
          "Take any optimal schedule and look at its first talk. Swapping it for the talk that ends earliest overall cannot create a clash — that talk ends no later — so some optimal schedule starts with the earliest finisher. Apply the same argument to what remains. Sorting by end turns that into one pass.",
        approach: [
          "Sort talks by end.",
          "Keep a count of kept talks and the end of the last kept talk.",
          "For each talk, if its start ≥ that end, keep it and update the end.",
          "Return total - kept.",
        ],
        code: {
          PYTHON: `def minTalksToDrop(talks: List[List[int]]) -> int:
    kept = 0
    free_from = None  # when the stage is next free

    for start, end in sorted(talks, key=lambda t: t[1]):
        if free_from is None or start >= free_from:
            kept += 1
            free_from = end

    return len(talks) - kept`,
          JAVA: `class Solution {
    public int minTalksToDrop(int[][] talks) {
        int[][] ordered = talks.clone();
        Arrays.sort(ordered, (a, b) -> Integer.compare(a[1], b[1]));

        int kept = 0;
        long freeFrom = Long.MIN_VALUE;
        for (int[] talk : ordered) {
            if (talk[0] >= freeFrom) {
                kept++;
                freeFrom = talk[1];
            }
        }
        return talks.length - kept;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n) for the sorted copy",
        edgeCases: [
          "Identical talks — all but one must go.",
          "Back-to-back talks, which all stay.",
          "Negative times.",
        ],
        commonMistakes: [
          "Sorting by start and keeping the earliest starter, which can keep one long talk that blocks many short ones.",
          "Sorting by duration — a short talk in the middle can still block two others.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "studios-needed",
    title: "How Many Studios?",
    difficulty: "MEDIUM",
    learningObjective:
      "Process intervals by start time while a min-heap of end times tells you whether an existing resource has freed up.",
    topics: ["intervals", "greedy"],
    patterns: ["merge-intervals", "heap"],
    statement: [
      para(
        "A podcast network books recording sessions. Each session is a row [start, end] and occupies a studio from start up to, but not including, end. A studio freed at minute t can host a session that starts at minute t."
      ),
      para(
        "Return the smallest number of studios that lets every session go ahead as booked."
      ),
      example(
        "sessions = [[9, 12], [12, 14], [10, 11], [13, 15]]",
        "2",
        [
          { state: "[9,12] → studio A", note: "ends: {12}" },
          { state: "[10,11] → studio B", note: "A busy until 12; ends: {11, 12}" },
          { state: "[12,14] → reuse B (free at 11)", note: "ends: {12, 14}" },
          {
            state: "[13,15] → reuse A (free at 12)",
            note: "ends: {14, 15} — never more than 2",
          },
        ],
        "Reuse the studio that frees up first"
      ),
    ],
    constraints: ["1 ≤ sessions.length ≤ 10000", "0 ≤ start < end ≤ 1000000"],
    signature: {
      params: ["int[][]"],
      paramNames: ["sessions"],
      returns: "int",
      functionName: "studiosNeeded",
    },
    tests: [
      {
        input: "3\n0 30\n5 10\n15 20",
        expected: "2",
        isSample: true,
        explanation:
          "[5,10] and [15,20] both run during [0,30], but not at the same time as each other.",
      },
      {
        input: "4\n9 12\n12 14\n10 11\n13 15",
        expected: "2",
        isSample: true,
        explanation: "Never more than two sessions are live at once.",
      },
      {
        input: "1\n2 4",
        expected: "1",
      },
      {
        input: "3\n1 5\n5 9\n9 12",
        expected: "1",
      },
      {
        input: "4\n1 10\n1 10\n1 10\n1 10",
        expected: "4",
      },
      {
        input: "5\n1 4\n2 5\n3 6\n4 7\n5 8",
        expected: "3",
      },
      {
        input: "4\n0 1\n100 200\n150 160\n155 156",
        expected: "3",
      },
      {
        input:
          "1500\n19415 19478\n11555 11685\n17239 17536\n9489 9521\n7719 7795\n4940 5004\n5577 5715\n19096 19207\n1413 1550\n11305 11338\n8990 9065\n6469 6500\n8120 8345\n16346 16466\n3208 3340\n4878 4959\n10557 10836\n4972 5144\n10013 10166\n9372 9414\n19089 19331\n14901 14949\n8244 8379\n11519 11590\n2055 2209\n11689 11721\n17547 17844\n3499 3716\n1806 1927\n5679 5813\n12304 12368\n2892 2918\n2507 2604\n1775 1985\n9480 9714\n14163 14377\n10401 10458\n7728 8016\n6126 6239\n8214 8445\n4507 4660\n8900 9020\n6969 7018\n11745 11952\n19375 19432\n3116 3176\n19122 19286\n11370 11411\n3643 3711\n11309 11503\n6164 6277\n7684 7941\n13186 13483\n9475 9727\n16270 16530\n6758 6954\n10360 10637\n1674 1929\n17624 17814\n2983 3267\n13806 13863\n19722 19740\n4083 4155\n17121 17193\n6496 6634\n12135 12183\n17046 17176\n9307 9321\n15831 15894\n6020 6223\n15555 15750\n7663 7865\n998 1293\n17729 17783\n6083 6264\n15297 15411\n3229 3511\n16066 16135\n6503 6634\n1199 1253\n6562 6723\n8511 8728\n4855 5042\n8712 8767\n9320 9327\n12149 12392\n9394 9433\n1936 1959\n12266 12486\n2997 3074\n15106 15120\n9924 10080\n481 646\n8469 8643\n2804 2890\n12644 12813\n8816 8935\n2445 2522\n7216 7391\n12188 12307\n13950 14001\n13956 13957\n771 840\n3130 3253\n17199 17232\n6402 6411\n17471 17688\n18253 18501\n15813 15966\n7942 8162\n3192 3367\n6572 6868\n11530 11539\n15052 15141\n18064 18194\n12866 12976\n5713 5740\n3215 3228\n5954 6250\n17110 17339\n13224 13353\n167 431\n12062 12153\n5132 5258\n13217 13511\n682 927\n19325 19493\n18674 18737\n9173 9281\n11726 11971\n8287 8363\n4665 4733\n1492 1767\n6040 6053\n2241 2384\n12605 12798\n17632 17866\n7318 7566\n3494 3730\n2510 2582\n12168 12402\n15785 15871\n4446 4531\n17489 17669\n2444 2522\n2993 3048\n5161 5174\n6891 7071\n9201 9267\n14169 14349\n1869 2006\n13743 13784\n18495 18692\n12515 12797\n16464 16511\n10983 11074\n5343 5373\n4477 4648\n15247 15498\n15438 15459\n2442 2698\n12312 12463\n6478 6589\n14745 14992\n3883 4064\n2949 3048\n6568 6678\n1096 1336\n7182 7237\n19601 19722\n19276 19448\n5931 6208\n3906 3954\n18551 18683\n8536 8702\n19486 19554\n12097 12388\n12054 12234\n8549 8654\n1269 1396\n18350 18400\n884 1126\n1193 1420\n7964 8146\n11475 11672\n6495 6622\n4769 4920\n8065 8182\n5876 6033\n2485 2603\n18178 18399\n6130 6304\n18303 18405\n7394 7430\n8896 8922\n17297 17509\n17082 17218\n10347 10375\n5050 5112\n14693 14842\n10957 10989\n19170 19333\n1956 2117\n5788 6015\n6016 6058\n9507 9742\n13593 13698\n1296 1331\n1741 1914\n10122 10252\n9563 9629\n16988 17030\n10004 10111\n13930 13968\n2414 2474\n9737 9802\n10191 10375\n1837 2044\n9725 9758\n3713 3874\n11288 11304\n3988 4245\n11019 11300\n18448 18640\n3446 3543\n2625 2805\n1406 1644\n17530 17625\n3612 3659\n9439 9440\n9429 9440\n2964 3117\n3846 4068\n12034 12069\n12354 12541\n18822 18969\n9022 9252\n461 574\n12980 13207\n17158 17356\n19934 19953\n6831 6995\n7038 7210\n10577 10714\n7969 8069\n14186 14434\n11161 11375\n18976 19008\n11157 11447\n9506 9731\n2335 2465\n12002 12142\n8025 8234\n8483 8653\n13887 13934\n11155 11404\n16073 16108\n3526 3791\n17510 17534\n4537 4539\n3754 3890\n12557 12803\n7320 7572\n12540 12807\n3856 3972\n10276 10479\n18022 18061\n1535 1770\n15002 15253\n2585 2842\n13272 13300\n3491 3536\n8399 8697\n2782 2797\n11768 12054\n18854 18938\n15516 15784\n11786 11906\n6126 6368\n12037 12304\n6187 6426\n2159 2364\n9906 9998\n18991 19042\n16757 16866\n12384 12681\n12445 12648\n8681 8694\n5647 5712\n19323 19427\n19788 20003\n9110 9279\n4069 4158\n14518 14589\n15523 15790\n8955 9019\n16533 16539\n19963 20053\n13055 13232\n549 833\n14203 14240\n11959 12167\n4498 4514\n17687 17931\n15601 15774\n12103 12398\n11825 11860\n14758 14932\n16605 16827\n2115 2256\n18521 18667\n4477 4484\n2716 2805\n11217 11325\n15402 15495\n2284 2345\n6956 7186\n4638 4750\n14643 14714\n3712 3756\n11356 11511\n7095 7109\n11510 11590\n14106 14288\n13078 13305\n16183 16404\n15560 15660\n16699 16847\n643 844\n4367 4516\n16503 16519\n6211 6440\n8215 8480\n13474 13498\n7820 8024\n1375 1466\n9665 9937\n4239 4302\n5639 5885\n10856 11028\n1222 1298\n8957 9121\n16401 16664\n19912 19956\n4718 4793\n1564 1794\n17460 17712\n16751 16864\n5087 5277\n14721 14812\n14578 14598\n16148 16213\n188 362\n3038 3275\n6956 7052\n8588 8612\n15352 15609\n15104 15293\n7545 7809\n10566 10682\n10813 10862\n9906 10053\n16550 16591\n2722 2921\n3515 3652\n14129 14320\n2532 2730\n8845 9133\n13065 13154\n9486 9617\n13090 13139\n2315 2514\n6609 6663\n14443 14668\n18806 18876\n7277 7538\n18664 18949\n4423 4593\n1748 1854\n379 475\n13020 13038\n9871 9918\n5288 5506\n7225 7436\n16638 16647\n9620 9667\n16001 16144\n19095 19393\n1407 1436\n13709 13957\n19052 19140\n8125 8175\n17705 17722\n1819 2020\n5617 5784\n13260 13300\n847 1041\n10994 11045\n12134 12393\n5015 5255\n6416 6675\n14483 14622\n14503 14579\n16856 17035\n10392 10512\n17355 17596\n18125 18182\n12925 13225\n7513 7643\n557 755\n12452 12614\n11923 12222\n1451 1684\n11199 11320\n6980 7027\n19091 19122\n9514 9603\n17434 17464\n12860 12987\n1086 1228\n13809 13836\n8398 8681\n14377 14646\n923 1098\n2624 2845\n14492 14710\n11939 12075\n9691 9751\n3506 3722\n3392 3540\n4030 4202\n16037 16301\n17633 17708\n19986 20191\n4238 4313\n18889 19166\n2204 2283\n11862 11926\n19498 19639\n2741 2846\n19616 19784\n12920 13112\n5064 5097\n2253 2341\n5287 5499\n18859 19047\n17563 17775\n18548 18823\n4158 4183\n17295 17513\n1241 1300\n13771 13855\n9726 9870\n2075 2186\n6956 7034\n18690 18718\n14204 14322\n1425 1635\n6028 6038\n785 908\n17955 17977\n2561 2637\n12230 12317\n4074 4325\n3032 3109\n4925 5222\n2255 2407\n16517 16785\n5957 6224\n7637 7878\n11878 11983\n14188 14374\n15959 16128\n6800 6970\n4032 4190\n9654 9910\n14694 14785\n3525 3553\n7068 7329\n8904 9193\n10579 10734\n9857 10029\n5351 5542\n11126 11192\n19584 19650\n9310 9445\n19134 19220\n813 901\n6042 6232\n8469 8479\n7866 8125\n17564 17646\n3979 4044\n879 949\n1722 1791\n1178 1332\n14608 14810\n14961 15062\n6036 6212\n8600 8803\n6217 6411\n1104 1154\n19743 20018\n7052 7255\n12948 13157\n13309 13456\n18498 18788\n8703 8752\n5833 6023\n6547 6804\n18259 18453\n17884 18016\n14598 14847\n2573 2669\n4521 4660\n19820 20086\n3882 4048\n13411 13647\n9745 9889\n3849 4126\n5021 5187\n8404 8440\n4992 5141\n2379 2471\n11974 12079\n17393 17404\n14157 14214\n11066 11172\n1893 2083\n16155 16256\n1080 1085\n12323 12578\n2266 2342\n13133 13139\n11930 12067\n15552 15590\n7337 7488\n12203 12284\n19636 19713\n10785 10870\n1706 1709\n175 183\n3484 3584\n11817 11905\n9938 10046\n13891 14015\n2779 2780\n6 182\n6176 6218\n806 1102\n15593 15797\n15501 15641\n14348 14588\n19561 19736\n19294 19511\n3385 3460\n5057 5320\n2892 2981\n11642 11844\n19367 19490\n8092 8234\n6441 6496\n8 176\n16974 17102\n15916 16147\n7213 7432\n8026 8196\n1520 1545\n1406 1433\n16156 16187\n4467 4497\n18189 18206\n19856 19981\n7692 7958\n2946 3127\n10700 10925\n7198 7354\n18059 18067\n19401 19629\n19571 19596\n19311 19490\n12187 12348\n3810 4080\n129 271\n6608 6865\n8792 8862\n11458 11640\n8201 8275\n11064 11133\n8629 8865\n17227 17438\n5465 5590\n11314 11406\n1653 1660\n11062 11200\n13821 13923\n727 887\n964 1002\n12207 12493\n8698 8780\n2065 2157\n2526 2670\n11629 11875\n1693 1905\n8980 9143\n18283 18358\n10318 10548\n17747 17781\n15267 15566\n3085 3231\n9804 9914\n19736 19979\n19431 19572\n7826 7884\n10812 10945\n6276 6462\n13767 13827\n19588 19671\n8610 8818\n2147 2426\n19426 19617\n5820 6099\n13441 13724\n10278 10575\n61 232\n4035 4109\n5198 5207\n14582 14664\n1331 1497\n13032 13043\n5016 5152\n9389 9468\n13108 13308\n18731 18749\n10333 10365\n6254 6412\n13204 13303\n9638 9722\n18904 19090\n13097 13269\n12609 12770\n3064 3300\n14738 14959\n15053 15349\n4782 4808\n6778 7024\n6284 6394\n8773 8868\n14734 14994\n10295 10315\n14301 14406\n1511 1567\n7457 7473\n625 920\n6829 7048\n5978 6230\n4101 4331\n2877 3090\n6732 6865\n14232 14298\n1774 1937\n14113 14117\n2634 2859\n13870 13910\n9999 10117\n14790 15064\n9531 9544\n3168 3395\n3585 3729\n10168 10271\n10670 10753\n6920 7007\n11836 11913\n8613 8678\n15128 15179\n11635 11686\n8349 8533\n17895 18089\n11091 11319\n11941 12128\n4512 4612\n2951 3065\n16558 16839\n14628 14849\n10616 10644\n1766 1842\n12817 12827\n6069 6230\n16308 16370\n7261 7471\n6395 6536\n305 505\n8770 8954\n16851 17055\n9139 9199\n14453 14651\n2 170\n16241 16357\n8858 8912\n7929 8190\n9934 10132\n18421 18672\n736 987\n1493 1770\n14256 14417\n648 890\n9367 9601\n13045 13143\n15209 15301\n3868 4037\n19803 19907\n4372 4432\n18864 18898\n4043 4281\n7219 7488\n2521 2647\n12307 12375\n4730 4850\n4482 4665\n5798 5896\n4711 4950\n8305 8489\n2890 3175\n14364 14554\n5710 5828\n17882 18008\n2290 2445\n2396 2545\n19595 19880\n14802 15028\n5341 5561\n10211 10255\n6031 6251\n12337 12589\n10019 10211\n10649 10700\n4330 4474\n15916 15921\n13938 14064\n12589 12650\n9378 9606\n17546 17701\n13180 13439\n4384 4637\n14415 14633\n15803 15842\n10491 10540\n10802 11097\n11942 11943\n1565 1683\n14404 14612\n13689 13838\n17501 17755\n8727 8783\n858 975\n16675 16677\n14239 14413\n233 348\n5181 5310\n15825 15909\n9181 9365\n16589 16707\n16287 16363\n15591 15735\n18626 18865\n787 916\n11086 11186\n10435 10486\n3973 4192\n2365 2645\n11936 11951\n12938 13122\n8149 8178\n7245 7298\n4855 5076\n15678 15766\n11672 11845\n6657 6758\n16910 17041\n12342 12578\n3070 3136\n13382 13490\n7855 8128\n723 752\n17864 18008\n18087 18260\n11703 11998\n6805 7016\n1169 1426\n3565 3726\n6893 7108\n2832 3101\n14261 14497\n11280 11440\n13629 13907\n12581 12659\n12126 12316\n5563 5729\n11984 12228\n19833 20040\n8350 8518\n6927 7192\n1250 1430\n10528 10769\n10835 10904\n14986 15285\n18846 18969\n6932 7215\n3939 4211\n11548 11656\n599 792\n572 616\n8918 9152\n16013 16184\n9764 9928\n12850 12976\n638 644\n985 1283\n18022 18220\n11875 11945\n6173 6468\n2933 2986\n507 691\n8128 8304\n8948 9123\n3124 3255\n13176 13315\n12604 12653\n9307 9533\n16819 17050\n16185 16208\n13459 13526\n7530 7623\n14283 14478\n1537 1803\n14287 14427\n1367 1425\n13580 13674\n16441 16486\n13998 14146\n1411 1533\n19817 19823\n2562 2728\n3531 3653\n8155 8301\n14244 14376\n12908 12974\n1281 1507\n15552 15557\n15140 15355\n6589 6796\n10901 10937\n3190 3367\n13571 13708\n4488 4616\n13236 13402\n344 366\n62 178\n13615 13782\n18062 18336\n11238 11478\n13802 14008\n7924 8068\n17171 17217\n5975 6043\n18232 18524\n15025 15106\n4275 4364\n3745 3794\n15536 15830\n7525 7710\n2847 2976\n6770 6998\n5410 5569\n8291 8485\n6063 6122\n7918 8134\n12163 12387\n1772 1939\n6644 6653\n8461 8527\n11701 11768\n8361 8505\n19928 20087\n19384 19625\n18263 18523\n17704 17823\n6747 6877\n17633 17906\n203 454\n17459 17746\n19438 19685\n5494 5741\n2125 2404\n5093 5324\n871 972\n9708 9908\n19173 19397\n2894 3050\n6752 6837\n7797 8038\n11469 11747\n15113 15336\n4940 5191\n13959 14022\n10266 10546\n11937 12177\n3044 3171\n6117 6172\n8573 8844\n17596 17823\n8559 8772\n17779 17934\n8388 8441\n16219 16340\n12906 13098\n18750 18934\n5626 5853\n8221 8332\n5706 5876\n14190 14235\n10986 11156\n12457 12557\n2711 2763\n6443 6666\n13953 13956\n8180 8367\n17301 17536\n11759 11805\n16110 16188\n4176 4462\n5750 5889\n13705 13765\n11386 11644\n4328 4410\n1358 1539\n15406 15645\n9605 9874\n14843 14910\n19431 19656\n9840 9854\n6052 6144\n16187 16311\n8073 8177\n11634 11730\n50 181\n10407 10488\n17547 17568\n17435 17484\n751 889\n14838 14882\n6023 6248\n6619 6818\n4989 5215\n14347 14511\n3674 3836\n19911 20077\n2209 2420\n2462 2638\n15659 15776\n4350 4640\n16542 16663\n2956 3180\n1730 1951\n5190 5315\n7738 7826\n15648 15811\n15034 15284\n3703 3712\n12932 13053\n553 804\n7346 7420\n11817 12100\n6875 7040\n7558 7735\n14873 14937\n12609 12786\n1492 1786\n4899 4976\n11297 11518\n17652 17828\n15036 15158\n7833 7879\n5578 5605\n15529 15790\n4117 4204\n15448 15690\n670 951\n135 332\n11083 11202\n11468 11707\n15202 15382\n1310 1343\n16594 16601\n15042 15071\n2678 2837\n18493 18744\n9062 9335\n7776 7898\n16784 16835\n10120 10248\n5760 5924\n15259 15297\n9257 9334\n1453 1679\n6175 6181\n16314 16376\n14221 14321\n8899 8928\n18680 18827\n9508 9713\n7810 7963\n18870 19109\n13063 13166\n16161 16251\n11880 12035\n12626 12908\n4468 4495\n10927 10930\n4549 4631\n504 550\n9443 9491\n6412 6551\n17805 17997\n10617 10801\n5510 5671\n2383 2606\n8137 8153\n7468 7576\n1742 1955\n1679 1837\n19830 19953\n2103 2119\n16399 16681\n7033 7177\n2909 2956\n7621 7873\n16755 16980\n9677 9699\n17901 18029\n10199 10468\n14065 14167\n17303 17543\n9155 9217\n1152 1298\n2300 2454\n11987 12120\n18063 18232\n3021 3163\n12907 13120\n3298 3565\n11353 11641\n2477 2545\n6713 6945\n5758 5892\n10545 10682\n235 391\n14726 14850\n16347 16413\n13686 13697\n7319 7528\n5738 5824\n14200 14339\n18021 18300\n17262 17436\n15178 15412\n17297 17543\n11303 11601\n15334 15622\n6621 6814\n10934 11035\n6857 6874\n15825 15853\n3458 3613\n11499 11626\n8015 8094\n2368 2487\n19177 19393\n5081 5327\n13922 14156\n14739 14917\n3718 3784\n10478 10634\n4148 4375\n14348 14640\n7220 7377\n3202 3440\n17562 17803\n15632 15672\n9473 9758\n2491 2599\n5047 5115\n15054 15088\n13914 13923\n7548 7789\n12732 12817\n3594 3632\n7995 8068\n14732 14967\n10905 11175\n5490 5681\n16110 16252\n19516 19699\n13766 13949\n19771 19987\n13829 13969\n10075 10140\n6295 6515\n10665 10947\n7407 7694\n17466 17717\n4854 5025\n16225 16351\n17241 17373\n1484 1512\n11852 12080\n3976 4164\n7250 7422\n3213 3419\n6989 7205\n355 630\n511 660\n7547 7586\n2553 2824\n3045 3268\n15138 15234\n11606 11835\n5407 5436\n2363 2615\n6206 6380\n8423 8701\n797 843\n17436 17493\n8955 9239\n13358 13382\n6774 6841\n9498 9623\n2288 2406\n1033 1130\n3839 3998\n12813 13081\n2580 2755\n1573 1788\n16142 16274\n3916 3979\n4949 5223\n6358 6468\n16451 16710\n15826 15900\n2000 2131\n11717 11833\n4022 4176\n17171 17356\n18819 19005\n389 446\n17798 17970\n4313 4461\n17447 17492\n7567 7844\n6029 6271\n15557 15663\n1566 1665\n11746 12032\n13674 13742\n19755 19805\n9123 9231\n19612 19711\n7156 7267\n15264 15541\n6307 6353\n3186 3316\n2279 2551\n3219 3403\n12111 12388\n1802 1920\n883 948\n10703 10892\n7350 7614\n16296 16518\n15708 15878\n2650 2845\n312 592\n17134 17262\n17170 17400\n13868 13965\n15170 15394\n6361 6447\n8906 8971\n1166 1413\n310 391\n5298 5590\n14054 14076\n13280 13410\n10837 10948\n536 619\n229 245\n18096 18109\n8694 8773\n9045 9109\n16493 16608\n15145 15320\n9764 9821\n19853 19903\n14339 14610\n11129 11134\n2580 2869\n5683 5950\n1167 1236\n19602 19891\n12458 12566\n12853 12877\n9172 9235\n5813 5987\n16773 17049\n12010 12170\n17108 17245\n9189 9335\n11936 12108\n4590 4657\n10930 10993\n17606 17624\n7584 7848\n5357 5654\n11239 11526\n16137 16382\n10134 10420\n1457 1497\n5955 6149\n956 1189\n1336 1556\n4289 4436\n7226 7313\n7224 7452\n15133 15231\n1571 1796\n17495 17507\n12275 12338\n10509 10692\n17448 17483\n6962 7174\n17126 17407\n18144 18406\n3720 3758\n9248 9320\n1134 1150\n17586 17752\n19134 19309\n15050 15236\n17322 17598\n19128 19230\n11020 11230\n16029 16252\n2140 2341\n7879 8031\n16276 16503\n11036 11311\n13944 14033\n18754 18792\n10308 10496\n8562 8805\n3757 3829\n8326 8359\n5127 5237\n9614 9853\n19373 19403\n15119 15314\n7312 7318\n12066 12224\n8366 8425\n8571 8856\n12396 12591\n8699 8860\n2809 2877\n5480 5649\n9239 9499\n10927 10985\n12237 12516\n6491 6511\n7259 7407\n8437 8688\n3286 3505\n6967 7233\n17841 17871\n13902 13944\n4901 5130\n18168 18334\n13570 13604\n12604 12659\n17224 17343\n14079 14162\n15672 15787\n5623 5645\n18272 18320\n9663 9809\n18340 18487\n2080 2166\n268 399\n13688 13950\n12197 12399\n2910 3013\n19659 19901\n17405 17438\n6804 6882\n12110 12287\n982 1153\n8004 8096\n2219 2303\n6453 6489\n6017 6298\n15602 15660\n11020 11316\n1140 1428\n17207 17317\n13777 13928\n7962 8065\n15906 15934\n8602 8765\n18950 18996\n7887 7966\n9794 10005\n15393 15517\n12846 13139\n9770 9827\n6810 6990\n10344 10545\n10201 10239\n9616 9910\n3598 3750\n89 375\n7357 7360\n6679 6807\n16794 16863\n1672 1854\n1828 2028\n15707 15830\n526 638\n15788 16021\n13403 13627\n6307 6472\n16965 16987\n1113 1127\n13077 13309\n8735 8976\n19973 20158\n456 662\n19083 19230\n2867 2973\n17448 17730\n69 260\n14871 15163\n10532 10727\n7483 7561\n14894 15127\n19682 19744\n17318 17370\n4699 4767\n15550 15663\n12035 12330\n6657 6888\n19043 19201\n6974 7044\n7578 7677\n994 1024\n9281 9338\n18046 18132\n11893 12064\n15435 15718\n10752 10839\n16439 16735\n19627 19773\n2511 2616\n19635 19757\n2313 2545\n5539 5615\n4025 4145\n12800 13004\n19108 19340\n9153 9194\n15801 15954\n5041 5174\n13500 13540\n869 1166\n9802 9959\n9458 9538\n8950 9058\n12018 12244\n11278 11339\n17113 17191\n893 1119\n16707 16730\n6317 6595\n2816 3110\n17750 17753\n12239 12537\n9855 9861\n10270 10347\n2498 2686\n6808 7066\n13389 13631\n17893 18125\n5779 5821\n17249 17419\n6526 6619\n16061 16332\n18646 18929\n16419 16518\n11737 12002\n19996 20032\n15877 15904\n19276 19361\n4355 4359\n6926 7135\n13985 14250\n7146 7264\n10343 10591\n831 1057\n11171 11328\n11945 12040\n2023 2073\n7981 8254\n10973 11048\n2655 2837\n19169 19467\n13927 14132\n4008 4238\n9397 9625\n8837 9095\n2288 2353\n3100 3230\n12050 12207\n7921 7926\n19677 19747\n11518 11569\n3278 3569\n14368 14635\n1359 1655\n13852 14115\n15881 15989\n16693 16965\n10090 10215\n16101 16145\n5312 5410\n19337 19379\n14567 14602\n19721 19737\n18240 18264\n2014 2192\n7137 7245\n13440 13578\n2213 2318\n18869 18965\n1194 1410\n19668 19945\n16048 16337\n16788 16965\n7657 7815\n13424 13500\n11023 11154\n4441 4617\n1080 1117\n11532 11651\n5114 5388\n12320 12612\n3348 3586\n3706 3931\n11605 11811\n3021 3285\n4316 4536\n19166 19331\n11272 11438\n10768 10850\n6103 6312\n3845 4026\n13887 14128\n12961 13243\n17725 18004\n13088 13270\n10437 10545\n18284 18567\n16544 16788\n17232 17518\n19693 19824\n11886 11928\n4465 4759\n15990 16215\n239 499\n5535 5603\n12167 12221\n19056 19246\n8284 8398\n17519 17803\n8475 8576\n13211 13290\n17086 17097\n5063 5138\n16339 16617\n9969 10135\n6396 6523\n836 897\n16463 16485",
        expected: "23",
      },
    ],
    hints: [
      "The answer is the largest number of sessions running at the same instant.",
      "That peak always happens at some session's start. You could count, for every start, how many sessions are live then.",
      "To do better, handle sessions in start order and remember when each busy studio frees up. Which studio do you want to check first?",
      "A min-heap of end times: if the earliest end is ≤ the new start, reuse that studio; otherwise open another. The heap's size is the answer.",
    ],
    solutions: [
      {
        title: "Count live sessions at every start",
        order: 1,
        intuition:
          "The number of studios needed equals the peak number of sessions happening at once, and the count only ever rises at a session's start. So test each start and count the sessions covering it.",
        approach: [
          "For each session start s, count sessions with start ≤ s < end.",
          "Return the largest count.",
        ],
        code: {
          PYTHON: `def studiosNeeded(sessions: List[List[int]]) -> int:
    peak = 0
    for s, _ in sessions:
        live = 0
        for a, b in sessions:
            if a <= s < b:
                live += 1
        peak = max(peak, live)
    return peak`,
          JAVA: `class Solution {
    public int studiosNeeded(int[][] sessions) {
        int peak = 0;
        for (int[] probe : sessions) {
            int live = 0;
            for (int[] s : sessions) {
                if (s[0] <= probe[0] && probe[0] < s[1]) live++;
            }
            peak = Math.max(peak, live);
        }
        return peak;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        edgeCases: ["Back-to-back sessions, which must not be counted together."],
        commonMistakes: ["Using s ≤ b, which counts a session that has just ended."],
      },
      {
        title: "Optimal: start order plus a min-heap of end times",
        order: 2,
        intuition:
          "Walk sessions in start order. The studios in use are represented by their end times. The only studio worth checking is the one that frees earliest: if even it is busy at the new start, every studio is. A min-heap gives that earliest end in O(log n), and the heap never shrinks below the true peak, so its final size is the answer.",
        approach: [
          "Sort sessions by start.",
          "Keep a min-heap of end times of studios in use.",
          "For each session, if the heap's smallest end ≤ start, that studio is free — replace its end with this session's end.",
          "Otherwise push this session's end, opening a new studio.",
          "Return the heap size.",
        ],
        code: {
          PYTHON: `import heapq


def studiosNeeded(sessions: List[List[int]]) -> int:
    ends = []  # min-heap: when each studio frees up

    for start, end in sorted(sessions):
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)  # reuse the earliest-free studio
        else:
            heapq.heappush(ends, end)  # every studio is busy: open another

    return len(ends)`,
          JAVA: `class Solution {
    public int studiosNeeded(int[][] sessions) {
        int[][] ordered = sessions.clone();
        Arrays.sort(ordered, (a, b) -> Integer.compare(a[0], b[0]));

        PriorityQueue<Integer> ends = new PriorityQueue<>();
        for (int[] s : ordered) {
            if (!ends.isEmpty() && ends.peek() <= s[0]) ends.poll();
            ends.offer(s[1]);
        }
        return ends.size();
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A session that starts exactly when another ends can share its studio.",
          "Many identical sessions — one studio each.",
          "A single session.",
        ],
        commonMistakes: [
          "Checking against the most recently assigned studio instead of the earliest-free one.",
          "Using < instead of ≤ when testing whether a studio is free.",
          "Forgetting to sort by start before the sweep.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "charging-loop-start",
    title: "Where the Shuttle Should Start",
    difficulty: "MEDIUM",
    learningObjective:
      "Use a running surplus that resets on failure, and a global total, to find a valid circular starting point in one pass.",
    topics: ["greedy", "arrays"],
    patterns: ["greedy"],
    statement: [
      para(
        "An electric shuttle drives a closed loop past n charging points, numbered 0 to n - 1 in driving order. At point i it can take on charge[i] units; driving from point i to the next point (wrapping from n - 1 back to 0) uses drain[i] units. The battery starts empty and is large enough never to fill up."
      ),
      para(
        "The shuttle picks a starting point, charges there, and must complete one full lap back to that point without the battery ever going negative on a leg. Return the smallest starting index that works, or -1 if no starting point can finish the lap."
      ),
      example(
        "charge = [1, 2, 3, 4, 5], drain = [3, 4, 5, 1, 2]",
        "3",
        [
          { state: "start 0: 1 - 3 < 0", note: "fails on the first leg → try 1" },
          { state: "start 1: 2 - 4 < 0", note: "fails → try 2" },
          { state: "start 2: 3 - 5 < 0", note: "fails → try 3" },
          { state: "start 3: +3, +3 → 6", note: "points 3 and 4 build a surplus" },
          { state: "total surplus 15 - 15 = 0 ≥ 0", note: "the lap closes from 3" },
        ],
        "Restart after each failure"
      ),
    ],
    constraints: [
      "1 ≤ n ≤ 100000",
      "charge.length = drain.length = n",
      "0 ≤ charge[i], drain[i] ≤ 10000",
    ],
    signature: {
      params: ["int[]", "int[]"],
      paramNames: ["charge", "drain"],
      returns: "int",
      functionName: "loopStart",
    },
    tests: [
      {
        input: "1 2 3 4 5\n3 4 5 1 2",
        expected: "3",
        isSample: true,
        explanation: "Starting at 3 the battery reads 3, 6, 4, 2, 0 after each leg.",
      },
      {
        input: "2 3 4\n3 4 3",
        expected: "-1",
        isSample: true,
        explanation: "Total charge 9 is less than total drain 10.",
      },
      {
        input: "5\n5",
        expected: "0",
      },
      {
        input: "4\n5",
        expected: "-1",
      },
      {
        input: "1 1\n1 1",
        expected: "0",
      },
      {
        input: "0 0 9\n3 3 3",
        expected: "2",
      },
      {
        input: "3 1 1\n1 2 2",
        expected: "0",
      },
      {
        input: "2 2 2 2\n1 3 1 3",
        expected: "0",
      },
      {
        input:
          "24 33 13 15 38 6 15 13 3 29 48 32 19 48 37 39 42 47 24 1 37 15 38 40 39 0 11 6 38 9 49 47 47 13 14 24 7 31 45 46 6 18 41 1 18 13 49 13 32 20 19 7 26 48 4 37 27 3 37 16 30 28 3 9 24 13 8 5 22 38 5 12 49 3 9 11 48 17 18 18 23 1 43 48 38 45 11 39 44 8 43 11 15 49 17 6 18 49 39 11 48 40 11 23 28 3 34 49 16 25 37 4 17 46 23 24 10 38 30 17 15 19 43 32 38 21 45 26 20 20 7 30 44 8 29 37 50 22 33 50 6 50 38 14 35 34 48 48 44 31 27 32 11 49 32 39 6 3 7 3 49 14 9 19 11 24 23 47 42 39 11 46 47 23 43 45 21 12 31 40 11 44 4 39 12 41 29 41 0 13 8 9 38 36 40 43 4 16 28 8 26 37 8 36 42 10 5 39 17 31 50 48 15 45 44 44 35 35 23 23 30 10 41 21 8 35 49 45 19 26 36 32 41 32 47 36 36 43 12 17 37 26 47 12 37 9 11 33 11 1 35 4 49 48 14 8 3 23 44 24 49 29 8 43 13 44 46 11 17 27 8 47 27 48 17 25 6 4 33 7 5 0 15 14 5 37 31 27 39 24 16 34 33 47 14 41 30 0 46 17 46 50 23 20 33 36 19 45 37 23 18 0 8 38 46 39 44 12 30 16 14 7 25 23 12 23 49 25 44 43 33 49 19 33 34 37 14 15 37 9 48 13 5 23 35 5 37 5 44 40 32 35 26 39 42 18 47 34 19 49 22 44 8 39 6 11 19 43 24 50 34 5 47 29 30 3 12 4 12 35 24 18 42 50 43 14 6 38 37 43 17 50 28 27 4 26 0 24 17 0 9 43 27 37 30 19 19 12 50 31 44 46 39 6 40 18 9 23 23 3 32 13 4 46 44 50 12 40 20 20 16 35 0 12 47 11 40 45 21 29 3 16 37 1 37 40 43 7 1 46 39 1 29 10 46 45 42 4 0 9 19 8 35 30 37 18 23 49 37 8 47 9 16 39 1 47 43 34 11 29 26 33 0 44 29 42 26 45 27 39 45 7 50 4 34 21 39 32 8 32 45 16 9 12 36 22 36 8 30 49 36 9 37 40 31 33 7 10 17 16 12 29 17 38 44 29 24 20 15 44 39 31 45 25 42 19 28 35 45 25 23 11 11 29 47 29 23 14 40 40 17 36 10 21 39 39 7 47 16 32 29 30 47 36 7 17 41 24 15 5 21 47 15 32 32 35 45 39 1 6 18 11 26 5 45 2 17 34 50 14 39 25 29 12 24 35 10 13 6 11 7 5 6 13 15 11 41 45 42 43 42 30 15 44 24 37 32 27 46 17 0 26 33 31 9 19 27 40 14 4 15 21 41 0 50 19 49 18 39 12 46 46 10 7 1 18 22 9 16 38 39 25 14 14 6 1 7 25 45 21 17 20 13 19 37 22 41 44 45 34 27 45 33 47 4 4 18 30 49 17 0 11 8 15 48 4 45 1 8 24 26 1 35 25 32 31 11 4 22 7 49 13 10 14 27 37 23 19 28 11 27 32 33 0 41 37 13 35 22 8 34 44 14 42 21 44 39 44 13 11 41 14 44 37 33 24 44 24 25 19 41 24 34 44 4 25 30 47 22 45 10 6 50 19 10 2 47 44 48 7 37 46 24 20 42 35 13 26 18 10 34 29 43 27 19 35 16 44 22 30 22 23 47 2 27 22 27 6 5 0 45 6 6 39 8 14 3 41 4 40 38 46 27 39 16 45 46 41 32 0 19 10 8 39 42 34 27 16 42 11 11 46 18 48 40 42 16 39 3 7 47 29 27 32 29 1 9 21 43 41 45 30 42 29 42 27 21 48 14 41 44 30 19 43 17 44 49 11 48 33 20 28 31 8 9 48 6 47 0 9 30 43 17 46 27 9 9 41 27 44 3 49 47 46 2 41 11 39 6 9 41 33 40 38 7 40 1 7 40 1 2 47 42 8 6 7 20 8 33 17 22 22 9 46 6 4 26 26 10 18 50 33 20 1 46 17 7 21 23 2 9 50 27 30 14 29 27 14 25 20 23 4 36 7 29 28 28 46 11 0 28 26 27 44 9 25 41 23 15 16 36 32 46 1 41 36 40 49 12 30 43 12 31 30 33 16 31 8 39 45 47 12 0 8 42 34 12 39 6 2 39 24 7 19 45 36 9 49 43 43\n23 15 20 35 13 40 29 6 20 26 24 14 42 5 39 35 11 48 2 8 18 25 40 26 27 43 4 7 8 50 19 44 1 11 3 47 4 23 4 30 48 29 30 14 24 31 16 13 34 0 15 38 42 3 34 50 4 14 18 50 3 13 1 47 2 20 19 36 8 25 39 10 6 36 35 18 2 2 18 39 1 32 2 36 45 46 43 2 45 48 4 24 4 12 42 25 27 12 36 28 26 7 1 35 1 33 45 5 36 47 6 38 11 27 1 12 10 42 33 21 3 50 10 9 3 1 16 20 1 12 11 39 15 43 33 43 10 44 49 2 24 48 16 9 30 7 33 8 44 16 5 20 10 8 19 5 17 42 0 2 9 0 43 6 9 18 16 22 12 6 20 33 21 15 48 8 1 27 9 31 46 21 25 21 12 48 29 44 14 10 26 46 34 5 2 0 31 16 11 1 47 3 44 24 18 39 37 6 19 44 13 5 14 47 8 37 43 11 1 2 40 4 1 50 23 48 31 6 17 41 15 29 1 15 49 7 9 39 41 29 39 49 6 37 41 48 11 20 34 47 24 40 50 4 44 30 12 0 26 38 42 32 14 7 9 6 2 19 21 39 47 37 3 31 28 17 36 6 36 2 11 5 15 38 48 1 46 19 44 35 28 17 20 47 29 40 49 36 42 26 2 11 9 23 22 44 39 22 9 22 41 27 5 25 43 49 5 38 15 20 2 41 16 32 32 11 36 29 8 49 12 15 38 23 12 32 18 38 19 42 14 7 36 21 38 14 41 34 15 28 41 34 23 26 14 9 26 25 8 39 12 50 48 1 45 2 29 4 29 36 5 22 16 36 5 23 36 18 27 23 35 23 44 5 18 31 11 21 17 40 10 20 20 1 28 2 43 28 20 45 23 16 50 34 42 21 29 43 48 38 23 43 30 44 38 12 28 37 16 41 11 47 7 29 26 11 6 12 6 21 29 0 34 34 11 13 26 42 21 48 41 12 19 14 21 36 36 30 27 38 35 38 36 22 39 14 49 20 48 10 22 48 5 10 2 31 50 34 31 6 31 42 45 13 38 48 44 6 37 12 33 0 10 29 46 7 29 40 40 17 42 36 49 50 16 22 0 25 22 46 36 17 39 9 16 36 16 37 41 34 2 17 26 10 27 12 22 28 43 18 6 48 14 12 4 12 30 33 20 2 31 36 43 34 50 44 22 34 13 42 16 35 50 15 38 47 32 40 14 11 34 41 21 36 24 11 16 49 32 37 31 25 34 18 22 41 29 29 47 48 20 42 23 1 27 13 40 20 50 29 14 50 48 44 15 9 25 37 37 8 41 25 15 9 16 4 33 5 19 18 5 45 8 30 1 46 38 41 42 18 2 10 20 47 49 30 10 42 19 8 45 44 36 31 41 33 21 34 48 16 16 41 31 36 34 34 23 16 0 6 29 31 20 20 30 11 13 9 19 0 43 40 26 36 45 21 32 3 26 8 4 4 48 23 35 9 21 50 27 15 36 12 8 10 6 11 21 34 3 20 11 21 3 15 1 2 13 36 8 3 23 38 44 3 50 36 33 8 3 42 25 42 45 5 22 38 24 44 37 44 3 26 10 3 33 31 45 45 38 10 17 50 24 15 24 26 34 6 12 43 43 44 29 4 6 4 25 13 11 17 7 28 29 22 9 2 6 35 40 24 9 0 12 21 5 3 16 44 2 50 27 3 27 34 12 29 12 18 5 2 31 36 7 3 31 15 17 29 39 17 12 49 28 5 30 41 16 11 30 49 6 35 32 20 8 22 7 12 8 3 41 2 12 24 9 47 32 46 28 12 17 45 18 28 46 46 30 28 40 43 28 49 41 34 36 38 37 44 0 38 42 7 28 47 50 0 4 19 16 0 19 8 35 5 22 21 38 31 21 0 47 35 13 7 2 43 50 7 44 16 40 35 7 30 37 27 43 26 3 2 47 15 19 25 38 20 15 48 43 37 50 19 42 12 35 50 27 38 38 14 43 41 43 36 49 46 30 27 12 10 20 21 49 44 21 26 36 24 33 0 40 41 26 48 22 34 28 1 26 12 38 50 0 19 31 40 17 35 45 39 22 33 24 14 14 0 10 8 43 44 1 2 5 2 27 10 50 8 7 43 23 13 30 43 3 30 22 40 16 17 45 6 3 11 34 4 34 28 37 14 31 1 19 46 44 23 47 44 2 15 9 2 14 42 17 37 21 3 47 0 16 3 15 21 7 13 27 40 10 15",
        expected: "9",
      },
      {
        input:
          "43 40 45 37 13 7 48 18 38 44 5 10 33 5 2 50 1 27 44 34 14 7 17 13 4 23 11 34 31 31 3 36 20 46 48 20 41 13 14 0 7 0 39 40 5 39 31 50 50 48 44 12 29 29 36 29 7 8 24 15 27 1 20 33 16 26 24 11 16 15 18 38 3 44 23 11 8 13 45 42 39 22 8 32 28 7 13 42 2 35 27 30 47 43 49 36 28 33 21 2 47 23 33 4 45 47 1 39 30 7 39 25 42 12 42 28 15 14 43 40 1 34 49 37 7 32 5 16 11 4 13 48 2 47 29 45 34 21 6 38 35 4 13 26 39 13 2 48 20 24 6 13 11 28 49 50 9 18 5 21 6 8 37 3 50 46 48 0 3 1 31 47 46 39 31 24 44 4 38 32 32 22 28 30 40 15 5 50 29 21 13 28 10 8 27 45 20 47 50 48 25 18 49 38 28 2 42 48 23 32 14 39 8 46 41 36 23 1 3 34 11 22 37 16 7 33 9 35 34 42 10 32 1 11 46 9 21 10 41 27 11 15 10 17 22 19 25 49 2 50 21 46 37 47 29 31 43 22 1 0 2 24 36 2 33 13 20 29 41 19 49 0 2 15 31 43 19 40 8 41 25 36 45 42 26 12 48 19 3 0 18 34 43 35 43 0 8 32 31 49 35 4 35 16 20 25 12 6 14 31 11 14 17 10 25 10 49 37 16 13 21 35 22 46 9 18 11 8 39 23 30 6 22 5 32 8 50 47 40 8 16 49 48 3 8 36 5 18 30 34 23 9 35 36 47 10 31 37 0 38 0 22 18 37 10 49 16 34 4 12 45 16 10 17 18 3 33 6 14 17 28 28 22 31 8 0 7 38 19 26 9 33 20 44 18 43 30 23 10 25 50 1 31 24 13 36 35 25 26 46 0 18 22 0 39 50 19 43 35 47 7 37 19 48 14 37 41 12 0 13 35 32 43 29 26 32 6 7 40 50 43 28 4 21 16 44 34 19 26 18 3 3 37 6 8 24 12 8 23 14 5 8 48 1 48 40 13 25 44 4 45 31 24 15 33 28 48 47 30 33 13 2 20 46 27 25 23 8 10 18 27 13 30 46 50 20 18 20 26 4 24 4 5 3 12 16 23 31 40 10 29 22 42 26 45 29 39 49 20 32 17 2 23 35 16 19 28 26 19 33 24 49 2 29 7 46 17 46 47 37 6 34 4 49 9 5 3 22 21 27 29 25 14 32 17 19 41 28 45 50 20 10 13 24 27 13 25 29 20 9 40 34 27 25 23 13 29 44 32 48 30 13 39 44 6 11 42 17 33 19 20 37 43 15 35 27 22 49 26 20 5 23 43 37 28 13 42 41 3 45 7 38 20 10 49 41 33 35 1 12 19 47 24 26 28 35 14 10 14 31 27 7 25 45 5 26 17 32 3 8 0 37 1 47 15 1 36 19 26 8 45 11 9 23 33 14 29 39 37 46 9 25 7 17 11 40 30 45 50 9 48 5 49 18 9 31 31 28 25 0 3 43 36 4 8 44 25 23 3 29 2 47 48 45 1 24 5 45 40 16 4 47 22 47 48 36 41 6 19 48 9 23 44 2 12 45 26 33 9 1 31 17 30 30 33 35 28 12 20 15 15 10 10 32 8 39 14 43 7 42 20 21 16 26 15 48 17 42 31 16 31 5 3 8 17 44 27 47 24 16 32 40 28 27 23 28 30 23 36 5 25 34 33 43 41 39 29 47 18 44 24 8 26 41 48 42 40 25 23 29 49 2 30 26 15 40 24 10 40 18 10 8 47 42 10 12 13 32 27 47 12 41 4 3 3 36 50 22 10 46 30 38 47 28 35 32 39 47 0 34 16 32 20 48 27 10 35 28 12 36 8 13 28 2 21 16 2 24 29 35 48 31 44 40 11 14 11 20 26 11 50 32 26 1 15 1 15 39 34 29 33 5 11 21 43 6 36 49 23 31 33 50 3 42 23 7 21 18 0 3 35 35 24 33 43 7 15 14 15 14 18 25 25 2 34 4 9 31 21 32 25 45 31 21 27 17 48 30 4 27 42 20 35 28 9 4 31 32 48 50 12 5 8 8 24 21 6 5 2 43 35 34 5 42 3 13 21 49 29 46 44 44 3 30 38 33 35 26 5 7 8 35 40 27 32 27 50 42 38 31 49 18 5 13 24 11 32 36 45 34 10 23 2 28 26 25 25 20 27 47 11 1 23 43 22 2 8 39 43 35\n23 25 45 14 29 37 19 39 5 43 45 50 26 23 40 30 7 14 25 10 44 17 46 36 6 30 40 9 39 41 29 10 31 21 20 20 12 2 33 13 31 26 0 32 31 10 12 11 24 49 28 2 34 39 0 2 31 35 5 34 15 25 12 8 42 26 46 34 27 50 33 20 33 7 8 18 12 7 11 4 22 10 2 43 31 10 41 37 40 23 49 48 33 5 26 42 1 6 43 1 11 47 30 11 13 36 21 14 31 45 15 20 42 44 4 15 24 26 49 28 45 42 22 23 13 17 29 13 32 35 22 13 31 8 25 27 45 1 32 40 44 9 11 40 36 14 30 43 6 30 0 39 6 44 26 45 45 37 32 48 16 32 48 21 16 6 32 29 20 20 44 34 3 46 6 23 2 49 16 11 10 44 39 35 4 28 5 19 49 25 47 44 29 25 31 3 14 50 47 10 12 45 26 19 44 34 18 14 47 35 11 37 13 2 30 37 34 39 45 17 30 6 39 14 48 7 43 40 31 45 45 28 38 18 7 30 4 46 10 32 33 30 34 49 19 16 29 8 45 25 36 49 37 16 5 13 35 36 19 10 16 8 48 2 36 45 31 23 48 36 17 7 11 37 11 45 14 3 16 29 47 12 43 10 29 4 34 47 1 13 37 12 21 47 46 32 26 14 25 42 22 26 20 5 24 36 26 21 28 30 21 17 19 48 47 13 22 35 4 24 19 39 7 4 1 4 27 41 30 28 32 16 36 46 38 48 11 14 18 30 21 7 16 30 34 14 7 34 24 2 46 10 46 24 5 36 44 5 23 19 35 26 36 5 35 8 14 28 14 44 42 9 3 26 25 37 11 24 2 19 5 38 15 10 4 13 26 42 1 35 40 2 50 23 24 19 2 26 34 16 5 4 44 6 6 22 19 5 35 14 15 25 23 16 29 12 50 46 43 5 39 43 36 17 49 42 24 30 28 39 50 30 11 20 21 19 31 49 41 16 40 11 14 21 13 14 41 24 23 50 50 20 30 3 27 33 44 34 12 11 49 44 2 19 16 41 2 10 4 8 2 30 30 21 42 40 16 48 46 27 50 9 23 41 45 44 34 15 9 44 29 12 43 40 47 45 22 43 20 0 44 33 30 26 18 41 14 8 4 38 27 41 41 16 29 11 1 13 17 25 9 25 0 33 20 20 19 34 32 32 16 8 3 49 1 35 16 41 25 37 16 44 47 6 39 48 28 1 24 16 3 44 41 28 11 40 22 23 19 8 5 43 6 0 48 41 15 49 5 37 26 43 48 1 29 41 47 24 45 12 1 9 14 4 9 37 15 13 48 12 29 0 42 40 41 43 44 4 1 11 28 8 49 30 8 48 29 4 11 25 11 23 8 18 23 8 27 44 12 30 26 41 16 40 16 46 36 19 24 38 47 14 32 43 31 36 2 10 26 31 29 32 41 8 10 1 44 25 20 30 41 40 25 18 36 23 23 40 42 47 10 6 44 23 50 35 11 33 33 44 30 16 29 26 11 6 35 35 8 21 41 49 18 50 46 27 45 11 49 35 23 4 13 50 23 27 46 25 14 36 27 9 18 32 29 2 19 33 34 7 23 39 28 26 17 38 45 46 1 24 50 10 26 40 13 8 50 11 50 27 45 26 43 19 29 46 22 39 21 35 11 7 50 26 9 42 8 33 9 26 44 0 18 32 23 31 50 19 25 2 30 34 21 46 28 28 36 14 1 1 9 42 34 23 15 15 23 43 30 26 41 12 43 27 26 11 20 7 37 3 44 23 47 21 44 7 28 16 13 12 50 7 21 24 20 43 3 40 38 30 40 49 35 30 3 25 37 32 44 10 30 24 34 31 14 33 47 8 37 27 6 46 20 1 29 8 27 45 43 34 49 38 16 0 18 36 40 33 12 39 45 26 37 19 13 5 49 31 28 8 7 15 1 8 17 37 49 48 34 16 11 49 40 19 16 13 34 12 50 31 39 49 46 34 2 22 1 43 19 6 46 29 49 3 28 45 38 24 38 37 22 49 44 11 18 22 31 38 11 2 12 23 42 38 26 33 0 26 4 24 20 33 26 47 15 6 31 46 14 42 5 12 9 32 39 0 36 33 13 4 10 23 1 9 46 50 10 7 9 6 29 0 29 32 26 34 22 23 46 37 4 36 17 28 6 12 3 27 47 15 48 44 9 39 37 4 38 20 10 25 35 24 22 9 24 7 8 46 44 42 18 42 50 21 16 30 14 9 16 24",
        expected: "-1",
      },
    ],
    hints: [
      "If the total charge is less than the total drain, no start can work. Is the converse also true?",
      "Simulating every possible start is O(n²). Suppose a run starting at s first fails just after point k. What can you say about starting anywhere between s and k?",
      "Every point between s and k was reached with a non-negative surplus, so starting there instead only removes surplus. They all fail by k too.",
      "So on failure, jump the candidate start to k + 1 and reset the running surplus. If the overall total is non-negative, the last candidate is the answer.",
    ],
    solutions: [
      {
        title: "Try every start",
        order: 1,
        intuition:
          "Simulate the lap from each candidate start in order and return the first one that never dips below zero.",
        approach: [
          "For each s from 0 to n - 1, drive n legs from s, adding charge[i] - drain[i].",
          "If the battery goes negative, abandon s.",
          "Return the first s that completes, or -1.",
        ],
        code: {
          PYTHON: `def loopStart(charge: List[int], drain: List[int]) -> int:
    n = len(charge)
    for s in range(n):
        battery = 0
        ok = True
        for step in range(n):
            i = (s + step) % n
            battery += charge[i] - drain[i]
            if battery < 0:
                ok = False
                break
        if ok:
            return s
    return -1`,
          JAVA: `class Solution {
    public int loopStart(int[] charge, int[] drain) {
        int n = charge.length;
        for (int s = 0; s < n; s++) {
            long battery = 0;
            boolean ok = true;
            for (int step = 0; step < n && ok; step++) {
                int i = (s + step) % n;
                battery += charge[i] - drain[i];
                if (battery < 0) ok = false;
            }
            if (ok) return s;
        }
        return -1;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        edgeCases: ["A single point."],
        commonMistakes: ["Forgetting to wrap the index around the loop."],
      },
      {
        title: "Optimal: one pass with a resetting surplus",
        order: 2,
        intuition:
          "Run a surplus from a candidate start. If it goes negative after point k, no point from the candidate up to k can be a start: each of them was entered with a surplus ≥ 0, so beginning there only loses that head start. Jump the candidate to k + 1. Separately, if the total charge covers the total drain, the final candidate is guaranteed to finish: the deficit it skips over is paid back by its own surplus. Every point before it was ruled out, so it is also the smallest valid start.",
        approach: [
          "Keep total (sum of all charge - drain), tank (surplus since the candidate) and start = 0.",
          "For each i, add charge[i] - drain[i] to both total and tank.",
          "If tank < 0, set start = i + 1 and tank = 0.",
          "Return start if total ≥ 0, else -1.",
        ],
        code: {
          PYTHON: `def loopStart(charge: List[int], drain: List[int]) -> int:
    total = 0
    tank = 0
    start = 0

    for i in range(len(charge)):
        gain = charge[i] - drain[i]
        total += gain
        tank += gain
        if tank < 0:
            # Nothing from start..i can work: restart after i.
            start = i + 1
            tank = 0

    return start if total >= 0 else -1`,
          JAVA: `class Solution {
    public int loopStart(int[] charge, int[] drain) {
        long total = 0, tank = 0;
        int start = 0;

        for (int i = 0; i < charge.length; i++) {
            int gain = charge[i] - drain[i];
            total += gain;
            tank += gain;
            if (tank < 0) {
                start = i + 1;
                tank = 0;
            }
        }

        return total >= 0 ? start : -1;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Total exactly equal to zero — still a valid lap.",
          "Several valid starts — the scan returns the smallest because every earlier index was ruled out.",
          "Every point is neutral (charge equals drain) — start 0.",
        ],
        commonMistakes: [
          "Advancing start to start + 1 instead of i + 1 on failure, which degrades to quadratic time.",
          "Returning start without checking the overall total.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "split-the-parade",
    title: "Split the Parade",
    difficulty: "MEDIUM",
    learningObjective:
      "Precompute each symbol's last position, then grow a segment until its end stops moving — an interval-merging greedy on a string.",
    topics: ["greedy", "strings"],
    patterns: ["greedy", "merge-intervals"],
    statement: [
      para(
        "A parade is described by a string of lowercase letters, one per float; the letter is the club that owns the float. The marshals want to cut the parade into as many consecutive sections as possible, with one rule: all floats of the same club must end up in the same section."
      ),
      para("Return the lengths of the sections, from front to back."),
      example(
        'parade = "abacdcdeff"',
        "[3, 4, 1, 2]",
        [
          { state: "a last seen at 2", note: "section must run to at least index 2" },
          {
            state: "aba | ...",
            note: "b's last is 1, nothing extends — cut after index 2",
          },
          { state: "cdcd", note: "c last at 5, d last at 6 — cut after 6" },
          { state: "e", note: "e appears once — cut" },
          { state: "ff", note: "sizes 3, 4, 1, 2" },
        ],
        "Stretch the section to cover every last appearance"
      ),
    ],
    constraints: [
      "1 ≤ parade.length ≤ 10000",
      "parade contains only lowercase English letters.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["parade"],
      returns: "int[]",
      functionName: "pieceSizes",
    },
    tests: [
      {
        input: "abacdcdeff",
        expected: "3 4 1 2",
        isSample: true,
        explanation: "Sections: aba | cdcd | e | ff.",
      },
      {
        input: "zyzyx",
        expected: "4 1",
        isSample: true,
        explanation: "Sections: zyzy | x.",
      },
      {
        input: "a",
        expected: "1",
      },
      {
        input: "aaaa",
        expected: "4",
      },
      {
        input: "abc",
        expected: "1 1 1",
      },
      {
        input: "abca",
        expected: "4",
      },
      {
        input: "abcbdeaf",
        expected: "7 1",
      },
      {
        input: "caedbdedda",
        expected: "1 9",
      },
      {
        input:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbccccccccccccccccccccccccccccccddddddddddddddddddddddddddddddeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeffffffffffffffffffffffffffffffgggggggggggggggggggggggggggggghhhhhhhhhhhhhhhhhhhhhhhhhhhhhhiiiiiiiiiiiiiiiiiiiiiiiiiiiiiijjjjjjjjjjjjjjjjjjjjjjjjjjjjjjkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkllllllllllllllllllllllllllllllmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnooooooooooooooooooooooooooooooppppppppppppppppppppppppppppppqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrssssssssssssssssssssssssssssssttttttttttttttttttttttttttttttuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
        expected:
          "30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30 30",
      },
      {
        input:
          "fjbdjebiembettiaqyhpabqkchcakzxhapdncjeyibwulgnovwqxaoqywxjguydyedltmuqxzxifhfmnvmndwyqnvbtrxteawbrsdaxnrckcuerijdmiqwcnlqmaeplwlbhvinjzvaurbbodvrrclswmyxitjsfvpnavwwbmsgtakdjahhujgflfftdfudqrmkgmwrcazmxjmcjkjmskpqlbkujgagjflxhvotqpghugiwdkbflxokbcvgknglopjboohcbptxczcafvdttpdhnayqyfokphcobquapamtisobmppsucyjuprvzwjafcvjuaflmbyafsfilrfirrklpbxkdqlzirxfhjsjrobkpfurykhayjmnodijsmtccqdfcwsgzrqaxtdcplwsjbjlujyizautisjsozewmfhrqnbxaktaugufltqaxfmfzjynvwzxqbojrgxpzhnbioafowortxguwpkpuooidwytlsjkloofvxttdqjvnorycouysdtutmrexwrqekjghqgsorfjgtsvjndcyhakpngdzudpwmuzjvhqefpfswhvgrsavygyxbffrcgrwrhnbnbneczjexexdfvzqvdemqpsceunshlajoqkpigkjxvobiiproefmjlyqaqxsscldnjlzjtzmmmvvgxewjnsasnrcflzlqcqhbkagwrtifrelqlhrfukyuxlkuhmxfyghlztucvtjirqvwijwsloapbhkhnfkasdkpgncmfdqiwpxrnixoekilmpvdfalsuymatjkfaxvjlkatfaeyacqyosgrjciwudyrklwrstuoaxrxtbqggpmbboslnvdqvltkdevclhkmkjrxxxsdnbztpinckflwzwfargnuxnzwkbmfxaepdohnrlmnoyihlnrikoxrprrwlgelwcywrolvtvgqbddjfoecinasluedkivhxueqdibaebhglkhqcgxqeerezkvvuhqclrbkhnjrjecyafynofivmgtrcijkwitxcyjbbwnnaoeyvlikuyfmtveomrtbzhjqnkneoqhoyzgtvjiowugnncstwbfnqyctpjxigvpyhudjrcokfoqqghnraloxincqpatsalhwnmpavsxmlbafyskugladjzwayohcsjkmhozopipntbtyncjgwrryxdtbbjkxjmqwlkgnnancohvpucyqjwthzzhmndxayqqhriopywoqzfrnxdhkljjtkbvimrszibwigzpaiorppcagnsqwukwdngxyhapopvwhppgwhpaofkzeddjmpdsvjceuhkltviivsqsovdapxkfptwewhaxlbglifhumwiqklbtvhevjeddtcrbsjcyvqvwmikwvgvvvculhwhbhodswjwnnqfbvpsafdgvgicsiamsjfbkxaljtgnivnppcggjtgnowxvhboyhxqwyqmzbpckbfzcwxjsdtjwwsizvrmmcsxvzfjdpfnvblquey",
        expected: "1500",
      },
      {
        input:
          "ababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd",
        expected: "600 600",
      },
    ],
    hints: [
      "The first section must contain every float of the first club. Where is the latest such float?",
      "Any club seen inside the section so far drags its end to that club's last float. When does the section stop growing?",
      "Record the last index of each letter up front. Then scan, keeping the furthest last-index seen in the current section; when the scan reaches it, cut.",
    ],
    solutions: [
      {
        title: "Grow each section by searching for last appearances",
        order: 1,
        intuition:
          "Start a section at the first unassigned float. Its end must cover the last appearance of every letter inside it, so keep scanning: each new letter may push the end further. Finding a letter's last appearance by searching the whole string makes this quadratic.",
        approach: [
          "Set start = 0.",
          "Set end = start; for every index i from start while i ≤ end, push end to the last occurrence of parade[i] (found by searching).",
          "Record end - start + 1, then start = end + 1.",
        ],
        code: {
          PYTHON: `def pieceSizes(parade: str) -> List[int]:
    sizes = []
    start = 0
    while start < len(parade):
        end = start
        i = start
        while i <= end:
            end = max(end, parade.rfind(parade[i]))
            i += 1
        sizes.append(end - start + 1)
        start = end + 1
    return sizes`,
          JAVA: `class Solution {
    public int[] pieceSizes(String parade) {
        List<Integer> sizes = new ArrayList<>();
        int start = 0;
        while (start < parade.length()) {
            int end = start;
            for (int i = start; i <= end; i++) {
                end = Math.max(end, parade.lastIndexOf(parade.charAt(i)));
            }
            sizes.add(end - start + 1);
            start = end + 1;
        }
        int[] out = new int[sizes.size()];
        for (int k = 0; k < out.length; k++) out[k] = sizes.get(k);
        return out;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1) beyond the output",
        edgeCases: ["One club only — a single section."],
        commonMistakes: [
          "Only looking at the first letter's last appearance and ignoring letters it drags in.",
        ],
      },
      {
        title: "Optimal: last-index table, one scan",
        order: 2,
        intuition:
          "Each letter defines an interval from its first to its last appearance, and sections are exactly the merged blocks of those intervals. Precomputing every letter's last index means the scan can extend the current block's end in O(1) per float, and cut the moment the scan index catches the end.",
        approach: [
          "Build last[c] = final index of each letter.",
          "Scan with i, keeping start of the current section and end = max(end, last[parade[i]]).",
          "When i == end, the section is closed: record i - start + 1 and set start = i + 1.",
        ],
        code: {
          PYTHON: `def pieceSizes(parade: str) -> List[int]:
    last = {}
    for i, club in enumerate(parade):
        last[club] = i

    sizes = []
    start = 0
    end = 0
    for i, club in enumerate(parade):
        end = max(end, last[club])  # this club drags the section to here
        if i == end:
            sizes.append(i - start + 1)
            start = i + 1

    return sizes`,
          JAVA: `class Solution {
    public int[] pieceSizes(String parade) {
        int[] last = new int[26];
        for (int i = 0; i < parade.length(); i++) last[parade.charAt(i) - 'a'] = i;

        List<Integer> sizes = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < parade.length(); i++) {
            end = Math.max(end, last[parade.charAt(i) - 'a']);
            if (i == end) {
                sizes.add(i - start + 1);
                start = i + 1;
            }
        }

        int[] out = new int[sizes.size()];
        for (int k = 0; k < out.length; k++) out[k] = sizes.get(k);
        return out;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) — at most 26 letters",
        edgeCases: [
          "Every float a different club — n sections of size 1.",
          "The first and last floats belong to the same club — one section.",
        ],
        commonMistakes: [
          "Cutting when a letter's last index is reached rather than when the running maximum is reached.",
          "Resetting end to 0 after a cut — harmless here, but conceptually it should continue from the next float.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "ferrying-hikers",
    title: "Ferrying Hikers Across the Lake",
    difficulty: "MEDIUM",
    learningObjective:
      "Pair the heaviest remaining item with the lightest one if they fit, using two pointers on sorted data.",
    topics: ["greedy", "arrays"],
    patterns: ["greedy", "two-pointers"],
    statement: [
      rich(
        "A trekking group must cross a lake in inflatable rafts. Each raft carries ",
        { strong: "at most two" },
        " hikers, and their combined weight may not exceed ",
        { code: "limit" },
        ". Every hiker weighs no more than the limit on their own."
      ),
      para(
        "Return the fewest rafts needed to get the whole group across (each raft crosses once)."
      ),
      example(
        "weights = [3, 5, 3, 4], limit = 5",
        "4",
        [
          {
            state: "sorted: 3 3 4 5",
            note: "lightest at the left, heaviest at the right",
          },
          { state: "5 + 3 > 5", note: "5 rides alone (raft 1)" },
          { state: "4 + 3 > 5", note: "4 rides alone (raft 2)" },
          { state: "3 + 3 > 5", note: "3 alone (raft 3), last 3 alone (raft 4)" },
        ],
        "Heaviest first, with a partner only if one fits"
      ),
    ],
    constraints: ["1 ≤ weights.length ≤ 50000", "1 ≤ weights[i] ≤ limit ≤ 30000"],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["weights", "limit"],
      returns: "int",
      functionName: "fewestRafts",
    },
    tests: [
      {
        input: "1 2\n3",
        expected: "1",
        isSample: true,
        explanation: "Both hikers fit on one raft: 1 + 2 = 3.",
      },
      {
        input: "3 5 3 4\n5",
        expected: "4",
        isSample: true,
        explanation: "No two hikers fit together under 5, so each needs a raft.",
      },
      {
        input: "4\n4",
        expected: "1",
      },
      {
        input: "2 2\n3",
        expected: "2",
      },
      {
        input: "3 2 2 1\n3",
        expected: "3",
      },
      {
        input: "5 1 4 2\n6",
        expected: "2",
      },
      {
        input: "1 1 1 1 1\n100",
        expected: "3",
      },
      {
        input: "10 10 10\n10",
        expected: "3",
      },
      {
        input:
          "2692 1882 792 2455 645 997 1062 1684 266 1594 2757 2379 593 1022 2789 1380 1260 1623 918 2884 219 1155 1458 2558 1691 617 2359 1503 2541 673 2171 1587 2360 2467 1010 1267 294 771 2048 1216 2147 1572 1788 2341 887 1216 2414 1184 1576 528 2763 1102 2439 1375 1903 1815 2293 929 1626 880 2146 2762 22 2749 1422 1689 1278 323 490 233 556 2815 1934 2183 398 893 382 2965 2401 2186 2910 2105 1159 1480 1093 2722 1887 2279 2927 224 1324 2813 385 2532 2784 2961 2117 278 1009 2765 2814 1327 795 852 2181 1977 1928 1635 2626 1604 551 1406 2891 2311 1545 2383 2053 951 2547 1620 765 181 480 797 1768 531 419 568 2467 2836 1872 378 1525 1179 2335 2262 1197 302 2736 1533 1554 1468 1705 785 1338 2498 469 351 841 1211 978 1571 1038 478 1123 2309 1616 1475 181 994 2427 2069 688 2351 65 696 2100 2017 529 607 446 1815 625 887 2597 1646 1248 1828 1518 1718 1670 72 311 2879 3 2380 2921 1002 1400 52 918 2584 2853 422 844 1657 2160 1033 2113 1270 2567 1833 447 306 2923 640 2332 1779 578 2050 39 2511 1912 2658 2062 1723 2991 429 2298 243 2521 232 2162 1142 2246 845 795 2127 2397 568 1167 2549 196 2035 522 2790 2543 2901 779 1678 2072 272 898 2071 897 2657 2834 2103 838 1941 2021 1278 2602 363 814 582 2751 162 2125 566 1838 300 893 672 607 488 948 2993 2462 306 2246 1927 2404 1501 2455 1549 891 244 1436 2504 2102 765 2808 551 1582 1597 1024 2050 1442 2698 2343 1214 1035 984 345 559 1593 1735 471 2120 2498 400 548 1208 397 1234 2028 1882 1532 1599 155 731 131 2292 711 604 1388 1605 1658 493 2068 227 1171 2295 2148 112 375 1504 2527 265 49 2088 1269 1369 1860 40 2030 2187 191 1535 707 1763 227 2716 852 2649 1195 962 2818 1111 1492 860 2735 1617 2046 955 1146 1126 1018 919 1705 1229 1868 2575 2537 191 1597 1399 906 1918 2485 2482 578 307 2257 1704 1223 2076 1915 1900 525 1147 2680 2808 27 699 69 1049 1773 2630 2385 2304 1957 338 1975 1462 2025 2968 968 1217 1506 2338 1618 282 1261 295 332 689 214 2754 176 1329 1246 2553 2908 1513 814 2549 394 1927 507 2418 2652 957 2142 1267 583 1038 27 49 2691 2136 111 2255 1171 2160 1421 2402 2387 925 2596 1372 2 754 2708 2353 1958 1048 2784 2875 2746 1841 2263 2966 1710 860 2965 2138 2656 907 2575 2917 2755 1847 2673 2152 492 2911 1360 1348 1751 1566 602 2398 1660 2094 157 2103 2616 2892 924 2037 42 295 1783 489 824 663 789 334 874 1645 989 2275 844 2427 2194 206 520 1050 1549 1474 1296 2123 733 512 2354 2073 258 2967 1038 1204 351 1113 781 919 1805 2546 2470 478 497 718 1728 2025 1020 592 1431 2235 1997 516 2342 364 1205 813 1259 2308 239 2422 2692 997 614 258 1478 2688 847 2438 1058 1196 2643 770 106 81 1581 2585 181 316 52 866 236 2596 1294 2162 2581 1559 789 62 571 611 1680 1602 1560 2418 1738 869 2737 443 1291 119 2694 280 1704 1041 1369 1734 533 36 993 830 608 2104 1397 105 1948 1351 2588 1501 1455 2953 1554 242 2363 2978 1000 2841 1302 1116 484 1789 1523 235 2150 643 2614 2750 1369 521 2881 1622 2686 2248 451 2953 2038 2285 1380 2025 136 2908 2525 287 414 2798 786 2084 1729 2414 2208 1951 734 580 2135 1102 802 2864 33 1944 2263 2010 730 2585 176 2250 1525 895 1789 668 2153 143 861 1230 2517 322 644 1376 2227 1800 2350 336 27 2472 695 1168 1204 2744 1046 257 2574 1350 2840 1018 1117 249 2246 2854 646 2533 88 2319 1349 1901 1914 2983 854 43 2872 1542 195 2424 575 1395 2254 1514 361 1921 2903 1410 23 1423 811 430 1156 2915 210 2785 2082 2244 2406 1911 1055 2549 140 640 1699 476 1436 1625 1542 723 2071 2012 754 187 2803 158 1525 2375 430 2396 1280 1654 587 1671 2871 1113 2968 1252 316 1562 1616 2701 685 1568 743 973 2359 1154 2796 2330 1557 135 245 1784 899 130 155 247 2274 1995 2185 61 465 1614 2127 1904 1796 675 2752 2930 2734 830 2491 1871 1593 1082 1890 2190 2301 1313 2771 208 2938 1618 2158 813 2003 650 1789 1590 2903 1568 337 17 241 2532 800 1774 1685 67 1031 2048 1120 616 2114 539 353 425 1690 295 1722 2295 431 2841 1452 2972 1363 1675 1142 2204 2103 2975 2665 78 1991 1006 1227 2456 2785 2505 1091 2479 2346 983 2599 362 2405 142 1839 1033 44 1374 1070 26 2962 2912 1018 351 1194 2432 1164 1155 126 1994 2913 2579 201 176 2530 1310 2510 2790 1538 2823 533 2546 1446 2977 2631 2658 2024 1458 1835 2728 1188 848 2049 1443 166 1339 2696 2235 2216 70 1760 954 2337 2298 1115 1412 1232 1234 2560 2479 509 448 2040 2874 2548 2067 1569 2866 1108 1638 2584 199 2567 26 2751 1899 1208 2390 44 439 896 102 229 2760 528 2534 748 644 2947 273 2467 907 529 403 1361 2316 2194 833 1450 2810 2946 1284 707 59 1618 50 1253 2784 1725 1868 272 46 936 2916 2300 2272 1313 533 1901 886 125 2057 632 1033 2605 1181 359 2114 2897 80 1276 932 1735 376 706 436 422 1071 1176 719 2099 845 2704 1506 297 719 706 2435 2595 2288 2696 1936 2394 2363 317 453 2542 2579 804 1066 65 2845 2757 270 291 951 2146 2481 875 1856 2882 1625 1326 729 2693 1576 415 439 801 1162 2572 422 675 1613 2773 1112 645 31 34 2775 1256 2500 1827 917 2849 1809 2758 2454 1991 1134 1727 2018 2414 2100 1663 238 415 1887 838 288 1428 60 1691 1385 1475 1689 1854 1832 935 2878 938 2402 654 747 1113 2330 2135 2156 991 2009 2913 1713 206 886 1022 1598 1266 1251 1012 1756 122 2987 2546 325 343 2150 1444 2580 299 1740 846 597 1670 2627 722 645 203 2838 2198 1293 2086 1471 629 1897 1304 1932 237 2438 2752 172 2599 2093 838 2523 2983 585 632 1693 1302 1573 2770 2315 643 1276 1908 638 2053 463 912 1859 1240 1011 2749 1432 1006 222 2947 2316 2904 464 2385 2886 366 1418 980 2649 1919 745 2238 2657 1312 1179 2339 1167 1733 164 1497 2744 941 2900 2587 1247 211 2620 1469 125 1680 2451 1374 1621 440 1074 2822 1764 585 1850 1753 363 1712 2175 2904 1570 1823 2936 2771 1455 2377 1696 190 2852 1624 2922 1796 2559 445 2345 184 2996 156 1329 1647 552 1690 227 1493 1127 836 1926 43 399 2735 2847 623 1285 663 1723 2765 918 2847 2790 2047 327 2564 2227 2456 298 257 1625 1571 2660 1461 289 885 912 161 1044 1999 1601 1223 120 2115 856 533 173 1891 1495 197 779 2775 1969 63 227 2275 157 1697 83 100 1351 1026 853 2878 2592 904 1207 2859 1191 2848 1309 1895 1872 413 1098 326 2901 2645 2846 874 1775 1426 582 1884 198 741 150 2643 929 2878 554 886 1721 2112 2137 463 2505 2710 2620 1292 2578 1281 886 2420 433 1607 1055 59 1969 912 214 518 1721 837 2883 710 337 2568 936 1577 1299 1578 551 205 2396 832 1483 2900 2584 64 94 2438 2669 1771 2871 374 1927 2015 1620 2124 2019 1619 24 54 1094 1888 939 1233 172 2631 202 2062 274 2924 1001 2288 2905 1248 637 1252 2442 931 332 624 1998 2699 1008 2456 644 1639 1316 38 2845 1263 1 5 1494 500 1872 685 1895 1712 1996 88 181 2949 33 2887 31 2863 2161 1309 2215 2123 2806 2685 48 2281 2940 995 1614 17 1593 2433 2725 2979 2482 2598 931 2876 1177 779 2036 1728 940 737 1887 2992 1406 1571 1655 1255 1849 1649 2583 2388 2466 2134 1950 2143 213 345 549 2358 1007 1151 2925 162 2816 1041 831 2127 586 1567 2894 1781 609 2387 12 1200 1368 1303 175 169 2356 1838 2755 318 1706 2600 2321 1822 2308 1031 1606 2038 59 1595 1820 646 2279 2856 441 2878 2161 601 2817 2813 1982 1741 1865 2326 1625 2432 2526 1862 1865 1342 1549 483 1696 619 772 2705 2973 2328 1861 206 2424 2080 2567 1837 136 1543 2309 2602 1387 1411 2573 272 522 2229 1097 140 2078 1157 2925 2487 1026 92 2987 824 1922 24 2457 1082 2262 1921 1347 2175 2315 2621 2225 2776 2381 670 1356 2303 1559 1502 424 214 1863 2305 1891 1792 2415 613 1857 2409 521 2623 1935 1151 2546 2326 94 1879 1549 1998 1803 257 925 2102 1745 983 151 140 1912 557 2260 2930 57 1066 1974 450 1402 1209 2228 1931 2852 878 797 183 2758 1743 2066 2622 2836 2583 1637 1730 245 1837 568 2276 1627 106 2212 527 44 2645 1442 1334 2167 189 2969 997 1861 2565 2679 423 2598 2626 1193 170 78 2577 211 2949 1271 502 1259 2568 2870 1942 454 222 2444 2256 1715 2148 2984 1378 574 1488 2109 211 2596 1726 212 121 1141 750 326 1817 2533 1014 2727 2013 2405 774 895 543 2077 1020 1882 10 2853 1644 291 887 2461 146 1166 2992 1041 2013 975 1062 1531 1286 984 2577 311 1781 2923 400 2888 2537 746 178 1164 68 750 1727 797 735 1809 2221 2572 903 281 744 1521 54 627 905 1331 2449 74 52 1944 1246 263 1097 62 1174 1235 310 1829 2048 2981 2109 735 1022 2001 1915 2197 949 911 2080 2292 2627 724 2195 2533 1332 2130 2725 1460 1795 2230 2335 2308 2401 1345 990 2201 880 1689 906 1685 2484 1980 1675 2389 1075 1469 2819 2555 2371 1326 2794 2999 274 535 564 2650 2002 2554 1854 910 1547 1388 659 1272 2870 1273 2753 884 1348 1898 2829 1235 1286 2698 2533 1479 2992 1086 623 2749 2531 2697 2875 19 1409 2107 842 1886 2804 2020 1050 101 2163 1291 1462 99 2949 264 2955 327 2799 417 2804 1593 2500 1558 1733 169 527 214 216 896 1521 2875 294 882 24 1345 138 525 638 2866 761 1562 2507 1294 1142 2791 2227 433 389 2596 2720 412 2955 934 1178 1821 228 963 1165 1320 690 1734 1792 942 669 2702 857 1888 2523 2603 1612 787 1138 363 744 2140 2352 1422 1406 55 1878 1440 1902 1296 2163 1091 530 50 1239 74 1148 390 77 287 1322 1651 2233 1904 2268 587 2487 1818 258 2555 1352 2640 107 2506 2847 2293 2470 1118 1004 1614 1309 1507 2180 1771 2136 81 607 710 2798 1653 714 1424 1030 1383 1388 1849 2356 1497 446 2558 2992 2819 1295 788 1675 1951 2314 1039 2002 703 53 167 1445 2342 1693 1420 2068 64 429 1165 2385 288 2984 434 890 527 2187 2046 522 1098 100 815 1401 1266 1756 1810 447 610 1353 2800 383 2831 2289 749 1465 114 244 2561 2251 2140 377 1423 604 2168 1661 1787 1601 1832 1976 2173 1532 2900 2760 1152 809 2744 1215 339 313 545 1223 1399 878 1084 195 1805 1338 2179 2439 2911 2055 1930\n3000",
        expected: "1013",
      },
    ],
    hints: [
      "The heaviest hiker needs a raft no matter what. Who, if anyone, should share it?",
      "If even the lightest hiker cannot ride with the heaviest, nobody can.",
      "If the lightest can ride with the heaviest, pairing them is never worse than any other partner choice.",
      "Sort, then move two pointers inward: the heaviest always leaves, the lightest leaves only if they fit.",
    ],
    solutions: [
      {
        title: "Heaviest first, search for the best partner",
        order: 1,
        intuition:
          "Take the heaviest unseated hiker and give them a raft. Then search the remaining hikers for the heaviest one who still fits alongside them. Searching linearly for every raft costs quadratic time.",
        approach: [
          "Sort weights descending and mark everyone unseated.",
          "For each unseated hiker in that order, open a raft for them.",
          "Scan for the heaviest other unseated hiker whose weight fits the remaining capacity; seat them too.",
        ],
        code: {
          PYTHON: `def fewestRafts(weights: List[int], limit: int) -> int:
    order = sorted(weights, reverse=True)
    seated = [False] * len(order)
    rafts = 0

    for i in range(len(order)):
        if seated[i]:
            continue
        seated[i] = True
        rafts += 1
        for j in range(i + 1, len(order)):
            if not seated[j] and order[i] + order[j] <= limit:
                seated[j] = True  # heaviest partner that fits
                break

    return rafts`,
          JAVA: `class Solution {
    public int fewestRafts(int[] weights, int limit) {
        int[] order = weights.clone();
        Arrays.sort(order);
        int n = order.length;
        boolean[] seated = new boolean[n];
        int rafts = 0;

        for (int i = n - 1; i >= 0; i--) {
            if (seated[i]) continue;
            seated[i] = true;
            rafts++;
            for (int j = i - 1; j >= 0; j--) {
                if (!seated[j] && order[i] + order[j] <= limit) {
                    seated[j] = true;
                    break;
                }
            }
        }
        return rafts;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n)",
        edgeCases: ["Everyone light enough to pair up."],
        commonMistakes: [
          "Allowing three hikers on a raft because their weights happen to fit.",
        ],
      },
      {
        title: "Optimal: sort and pinch with two pointers",
        order: 2,
        intuition:
          "The heaviest hiker always takes a raft. The best partner to offer them is the lightest hiker: if the lightest does not fit, no one does; if the lightest does fit, seating them here is never worse, since any partner who could ride with someone else could also ride with whoever the lightest would have joined. So each step seats the heaviest and maybe the lightest, and two pointers do it in one pass.",
        approach: [
          "Sort the weights.",
          "Set light = 0, heavy = n - 1, rafts = 0.",
          "While light ≤ heavy: if weights[light] + weights[heavy] ≤ limit, move light right.",
          "Always move heavy left and count a raft.",
        ],
        code: {
          PYTHON: `def fewestRafts(weights: List[int], limit: int) -> int:
    order = sorted(weights)
    light = 0
    heavy = len(order) - 1
    rafts = 0

    while light <= heavy:
        if order[light] + order[heavy] <= limit:
            light += 1  # the lightest rides along
        heavy -= 1  # the heaviest always leaves
        rafts += 1

    return rafts`,
          JAVA: `class Solution {
    public int fewestRafts(int[] weights, int limit) {
        int[] order = weights.clone();
        Arrays.sort(order);
        int light = 0, heavy = order.length - 1, rafts = 0;

        while (light <= heavy) {
            if (order[light] + order[heavy] <= limit) light++;
            heavy--;
            rafts++;
        }
        return rafts;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n) for the sorted copy",
        edgeCases: [
          "A single hiker.",
          "Every hiker weighs exactly the limit — one raft each.",
          "An odd number of hikers where the middle one rides alone.",
        ],
        commonMistakes: [
          "Using light < heavy, which forgets the last unpaired hiker.",
          "Pairing the two heaviest hikers that fit, which wastes light hikers on heavy ones.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "biggest-badge-number",
    title: "Biggest Badge Number",
    difficulty: "MEDIUM",
    learningObjective:
      "Derive a custom pairwise ordering (a before b when ab beats ba) and trust a sort to apply it globally.",
    topics: ["greedy", "strings"],
    patterns: ["greedy"],
    statement: [
      para(
        "A conference prints one long badge number for its anniversary by laying out the stickers it has collected, each showing a non-negative whole number, side by side in some order. Every sticker must be used exactly once, and stickers cannot be cut or flipped."
      ),
      para(
        'Return, as a string, the largest number that can be formed. The answer must not have leading zeros: if it would be all zeros, return "0".'
      ),
      example(
        "stickers = [3, 30, 34, 5, 9]",
        '"9534330"',
        [
          { state: "9 before 5", note: "95 > 59" },
          { state: "34 before 3", note: "343 > 334" },
          { state: "3 before 30", note: "330 > 303" },
          { state: "9 5 34 3 30", note: "joined: 9534330" },
        ],
        "Compare the two ways of gluing each pair"
      ),
    ],
    constraints: ["1 ≤ stickers.length ≤ 100", "0 ≤ stickers[i] ≤ 1000000000"],
    signature: {
      params: ["int[]"],
      paramNames: ["stickers"],
      returns: "string",
      functionName: "largestArrangement",
    },
    tests: [
      {
        input: "10 2",
        expected: "210",
        isSample: true,
        explanation: "2 before 10, since 210 > 102.",
      },
      {
        input: "3 30 34 5 9",
        expected: "9534330",
        isSample: true,
        explanation: "9, 5, 34, 3, 30.",
      },
      {
        input: "0",
        expected: "0",
      },
      {
        input: "0 0 0",
        expected: "0",
      },
      {
        input: "1",
        expected: "1",
      },
      {
        input: "121 12",
        expected: "12121",
      },
      {
        input: "12 121",
        expected: "12121",
      },
      {
        input: "8 89 898",
        expected: "898988",
      },
      {
        input: "0 9 90",
        expected: "9900",
      },
      {
        input: "824 938 1399 5607 6973 5703 9609 4398 8247",
        expected: "9609938824824769735703560743981399",
      },
      {
        input:
          "18593 18576 79902 8021 63695 40548 47771 13736 70427 78166 70125 67985 52307 28247 92172 60230 57011 5541 47429 11516 17443 73448 71070 84445 36834 37401 73702 63898 1053 48568 11463 55500 83112 17505 90545 5771 63736 3984 21867 65860 29239 43241 56917 60843 13501 94955 58750 85272 884 55570 42677 71922 47646 50441 43617 75722 84247 62433 61588 42280 49050 76865 75132 85479 7758 56114 87649 69651 84859 38599 29854 88355 12164 74905 40705 16081 34591 22434 72204 97146 43187 8256 89461 54486 4429 86649 70500 99080 4857 70188 45671 16438 93549 84320 24711 92742 2514 39433 17226 94369 59625 8297 37486 61675 36992 54343 92744 87845 88089 87730 12948 82637 74047 44545 4673 77823 12779 49212 87375 87065 39943 7320 65863 48794 53151 63071 1180 20809 31784 89568 3147 88872 67782 50352 68404 17219 92502 54897 92570 35206 10541 59447 36227 84663 30999 43194 44426 79339 90213 10713 63019 20420 72075 38257 35582 85685 43978 28370 20984 54285 96562 47401 30725 84656 56655 39675 36651 62590 91515 52213 45664 7340 83991 17188 63759 91550 89754 13457 30011 7875 11388 76401 61419 52123 93586 87189 24983 60336 37417 16306 58876 29939 81137 98734 5928 39110 63495 57202 30347 5985 53820 83115 49906 19444 99176 66326 94055 68803 61267 6470 19761 77501 360 1191 15539 30563 17153 37486 78369 54673 68964 49748 34986 85245 49786 68296 75534 36008 66405 20870 61516 43921 69004 72699 27906 18581 77457 73762 87475 71454 11590 15501 63679 83886 96985 28674 35482 93154 29973 37032 95182 95422 55882 98105 64916 46991 80563 52402 37833 80988 57665 43136 97974 42309 58907 7117 59599 28546 46802 95108 33920 76505 48170 16041 49785 8377 1429 82714 90116 42562 71498 14086 26932 83445 78218 24772 76768 53586 33102 83291 18325 77873 87808 23934 36149 23983 45186 53930 15609 10693 4102 24476 68042 14207 24559 55364 24714 169 71152 65782 87917 98888 27680 56541 28538 19797 57499 2800 42963 17440 11869 1950 48532 77349 45538 62492 15630 68156 72873 99079 65649 47990 60077 22939 89921 82201 95555 16252 35596 40970 90045 62974 44383 80870 29689 51957 75811 76895 6444 9960 62427 90432 99741 43394 41210 98925 74187 47975 24888 71069 4720 4490 58227 94405 61495 91192 21063 20577 83585 68805 7895 96439 52147 82197 26893 19869 93853 93540 59089 70502 31714 4352 82266 69384 24047 43029 73984 69667 40972 2435 83916 431 48141 7017 98736 78741 84117 1820 51112 85235 22106 93367 33573 23301 16027 72227 55147 9466 45744 37235 25053 68087 25150 18863 12035 40188 48391 45089 3174 20852 25218 26739 9362 14185 50187 93455 18907 5028 68818 87500 26484 34469 29294 38041 63019 54066 52798 57775 12023 21923 71784 52746 80275 87722 1237 61518 46407 28616 17067 89983 47255 69538 66820 68430 78333 64961 34867 40866 71495 32638 61979 22433 28765 97757 32929 5282 56113 61119 9519 26795 31506 99672 9414 30418 81213 4423 89094 65818 46175 13193 11109 59765 21950 60676 43335 16449 89036 35141 70463 57949 83623 37431 23915 52429 80628 33195 26022 99992 80474 42416 31757 21633 43115 86108 45157 43443 10092 92569 79821 12470 37378 75528 33349 60564 41204 63547 6078 7852 48354 68200 19681 72751 82190 83619 86861 44226 66253 55292 47600 38012 7080 98777 66106 24814 28996 35141 77197 13456 89586 60499 24601 37109 71652 35750 7123 67200 81626 9307 62997 5027 2032 29898 99596 61312 5101 49282 34845 15841 10278 50593 16671 4431 11423 88599 62966 54125 13108 9653 14272 70880 47214 32259 38190 28122 46064 3614 93433 56389 98343 30633 50387 94115 35591 44464 59465 14410 90047 5374 82299 81132 74201 74096 4865 90806 8008 13841 96960 68455 40847 35192 70374 73223 87328 3072 99238 26621 90204 96284 31542 55277 6418 77226 84397 46017 25609 74014 8674 87837 22411 22860 25224 77281 78697 18974 79823 93816 68501 50401 64133 48684 999 47197 94118 58390 71147 76653 29262 41996 89260 50474 20005 97869 92519 32798 490 49777 11743 9207 55481 20225 43947 39217 88855 45872 91249 64651 24069 62527 28062 54060 37199 19925 79111 28766 67305 1979 27219 81027 71535 55102 12192 23016 2452 21388 20045 61875 8698 80038 20335 14189 67249 43223 94290 85903 93392 50805 64079 52988 93808 81836 28225 71718 32087 36284 85976 51157 1807 69483 77921 95585 45385 43480 84614 92823 47281 18681 47544 577 73029 8067 96823 55620 78403 36454 7624 16628 32838 64334 73790 38117 13646 33201 75110 61709 34246 24475 80341 61153 16250 83363 22653 84292 9553 91706 91081 18493 85390 22933 13828 84772 56285 92766 43890 57538 23313 88792 46389 16271 63697 63685 91017 54388 7590 56575 14445 52377 14178 87609 63469 88661 97070 76665 41394 59839 78102 47646 67632 63299 88922 58417 61518 66357 84651 73115 27355 22645 1605 79395 79041 77255 22956 4800 2931 39172 4619 80643 95415 67370 58077 53447 21915 57153 74336 68616 11539 10843 71752 2663 93045 44791",
        expected:
          "9999999299741996729960995969923899176990809907998925988889877798736987349834398105979749786997757971469707096985969609682396562965396439962849558595555955395422954159519951829510894955946694405943699429094149411894115940559385393816938089362935869354993540934559343393392933679315493079304592823927669274492742925709256992519925029217292079170691550915159124991192910819101790806905459043290213902049011690047900458998389921897548958689568894618926089094890368892288872888558879288661885998848835588089879178784587837878088773087722876498760987500874758737587328871898706586988686186748664986108859768590385685854798539085272852458523584859847728466384656846518461484445843978432084292842478411783991839168388683778362383619835858344583363832918311583112829782714826378256822998226682201821978219081836816268121381137811328102780988808708067806438062880563804748034180275802180088003879902798237982179395793397911179041789578757874178697785278403783697833378218781667810277921778737782377587750177457773497728177255772267719776895768657676876665766537650576401762475907581175722755347552875132751107490574336742017418774096740477401473984737907376273702734487340732237320731157302972873727517269972227722047207571922717847175271718716527153571498714957145471237117711527114771070710697088070807050270500704637042770374701887017701256966769651695386948369384690046896468818688056880368616685016845568430684046829668200681566808768042679856778267632673706730567249672006682066405663576632666253661066586365860658186578265649649616491664706465164446433464186413364079638986375963736636976369563685636796354763495634696329963071630196301962997629746296662590625276249262433624276197961875617096167561588615186151861516614956141961312612676115361119608436078606766056460499603366023060077598559839597655962559599594655944759285908958907588765875058417583905822758077579495777557757715766557538574995720257153570115691756655565755654156389562855611456113558825562055570555005548155415536455292552775514755102548975467354486543885434354285541255406654060539305382053745358653447531515298852825279852746524295240252377523075221352147521235195751157511125101508055059350474504415040150387503525028502750187499064978649785497774974849282492124905049048794486844865485748568485324839148354481704814148004799047975477714764647646476004754447429474014728147255472144720471974699146802467346407463894619461754606446017458724574445671456644553845385451864515745089449044791445454446444426443834431442944234422643978439474392143890436174352434804344343394433354324143223431944318743143136431154302942963426774256242416423094228041996413944121041204410240972409704086640847407054054840188399433984396753943339217391723911038599382573819038117380413801237833374863748637431374173740137378372353719937109370323699236834366513645436284362273614936143603600835750355963559135582354823520635192351413514134986348673484534591344693424633920335733334933201331953310232929328383279832638322593208731784317573174317143154231506314730999307253072306333056330418303473001129973299392989829854296892931292942926229239289962876628765286742861628546285382837028247282252812228062280027906276802735527219269322689326795267392663266212648426022256092522425218251502514250532498324888248142477224714247112460124559245224476244752435240692404723983239342391523313233012301622956229392293322860226532264522434224332241122106219502192321915218672163321388210632098420870208522080920577204202033520322022520045200051992519869197971979197611968119501944418974189071886318681185931858118576184931832518201807175051744317440172261721917188171531706716916671166281644916438163061627116252162501608116051604116027158411563015609155391550114445144101429142721420714189141851417814086138411382813736136461350113457134561319313108129481277912470123712192121641203512023119111869118011743115901153911516114631142311388111091084310713106931054110531027810092",
      },
    ],
    hints: [
      "Sorting the numbers by value fails: 9 should come before 30. Sorting the digit strings alphabetically fails too: 3 should come before 30.",
      "Focus on just two stickers a and b. Which order is better is completely decided by comparing the strings a+b and b+a.",
      "That pairwise rule is consistent (transitive), so you can hand it to a sort as a comparator.",
      "Watch out for an input of only zeros.",
    ],
    solutions: [
      {
        title: "Try every ordering",
        order: 1,
        intuition:
          "With few stickers, form every permutation, glue each into a string, and keep the largest. Because all candidates have the same length, comparing them as strings is the same as comparing them as numbers.",
        approach: [
          "Generate every permutation of the stickers as strings.",
          "Join each and keep the lexicographically largest.",
          'Strip leading zeros by converting through an integer, or return "0".',
        ],
        code: {
          PYTHON: `from itertools import permutations


def largestArrangement(stickers: List[int]) -> str:
    best = ""
    for order in permutations([str(s) for s in stickers]):
        joined = "".join(order)
        if joined > best:
            best = joined
    return best.lstrip("0") or "0"`,
          JAVA: `class Solution {
    private String best = "";

    public String largestArrangement(int[] stickers) {
        String[] parts = new String[stickers.length];
        for (int i = 0; i < stickers.length; i++) parts[i] = String.valueOf(stickers[i]);
        permute(parts, 0);
        String trimmed = best.replaceFirst("^0+", "");
        return trimmed.isEmpty() ? "0" : trimmed;
    }

    private void permute(String[] parts, int k) {
        if (k == parts.length) {
            String joined = String.join("", parts);
            if (joined.compareTo(best) > 0) best = joined;
            return;
        }
        for (int i = k; i < parts.length; i++) {
            String t = parts[k]; parts[k] = parts[i]; parts[i] = t;
            permute(parts, k + 1);
            t = parts[k]; parts[k] = parts[i]; parts[i] = t;
        }
    }
}`,
        },
        timeComplexity: "O(n! · L) for total digit length L",
        spaceComplexity: "O(L)",
        edgeCases: ["All zeros."],
        commonMistakes: [
          "Comparing candidates of different lengths as strings — here all have the same length, so it is safe.",
        ],
      },
      {
        title: "Optimal: sort with the glue comparator",
        order: 2,
        intuition:
          "In any arrangement, if neighbours a, b satisfy b+a > a+b, swapping them makes the whole number larger, since the prefix and suffix are unchanged. So the best arrangement has every adjacent pair in 'glue order'. That relation is transitive, which makes it a valid sort order: sorting by it produces the best arrangement directly.",
        approach: [
          "Convert each sticker to a string.",
          "Sort with a comparator that places a before b when a+b > b+a.",
          "Join the strings.",
          "If the result starts with '0', every sticker was 0 — return \"0\".",
        ],
        code: {
          PYTHON: `from functools import cmp_to_key


def largestArrangement(stickers: List[int]) -> str:
    def glue_order(a: str, b: str) -> int:
        if a + b > b + a:
            return -1  # a should come first
        if a + b < b + a:
            return 1
        return 0

    parts = sorted([str(s) for s in stickers], key=cmp_to_key(glue_order))
    joined = "".join(parts)
    return "0" if joined[0] == "0" else joined`,
          JAVA: `class Solution {
    public String largestArrangement(int[] stickers) {
        String[] parts = new String[stickers.length];
        for (int i = 0; i < stickers.length; i++) parts[i] = String.valueOf(stickers[i]);

        Arrays.sort(parts, (a, b) -> (b + a).compareTo(a + b));

        if (parts[0].equals("0")) return "0";
        StringBuilder joined = new StringBuilder();
        for (String p : parts) joined.append(p);
        return joined.toString();
    }
}`,
        },
        timeComplexity: "O(n log n · d) for stickers of up to d digits",
        spaceComplexity: "O(n · d)",
        edgeCases: [
          'Every sticker is 0 — answer "0", not "000".',
          "Stickers that are prefixes of each other, such as 12 and 121.",
          "A single sticker.",
        ],
        commonMistakes: [
          "Sorting numerically or by plain string order.",
          "Returning the result as an integer, which overflows for long badges.",
          "Forgetting the all-zero case.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "reward-tokens",
    title: "Reward Tokens for the Relay Team",
    difficulty: "HARD",
    learningObjective:
      "Split a two-sided neighbour constraint into a left-to-right pass and a right-to-left pass, then combine them with max.",
    topics: ["greedy", "arrays"],
    patterns: ["greedy"],
    statement: [
      para(
        "A coach hands out reward tokens to a relay team standing in a line. Each runner has a training score. The rules are:"
      ),
      bullets(
        "Every runner receives at least one token.",
        "A runner whose score is strictly higher than an immediate neighbour's must receive strictly more tokens than that neighbour."
      ),
      para(
        "Neighbours with equal scores have no constraint between them. Return the fewest tokens the coach needs in total."
      ),
      example(
        "scores = [4, 6, 6, 5, 3]",
        "9",
        [
          { state: "left pass:  1 2 1 1 1", note: "6 beats 4 on its left" },
          { state: "right pass: 1 1 3 2 1", note: "6 beats 5 beats 3 on their right" },
          { state: "max:        1 2 3 2 1", note: "satisfy both sides" },
          { state: "total = 9", note: "" },
        ],
        "Two passes, then take the larger"
      ),
    ],
    constraints: ["1 ≤ scores.length ≤ 20000", "0 ≤ scores[i] ≤ 20000"],
    signature: {
      params: ["int[]"],
      paramNames: ["scores"],
      returns: "int",
      functionName: "minTokens",
    },
    tests: [
      {
        input: "1 0 2",
        expected: "5",
        isSample: true,
        explanation: "Tokens 2, 1, 2.",
      },
      {
        input: "4 6 6 5 3",
        expected: "9",
        isSample: true,
        explanation:
          "Tokens 1, 2, 3, 2, 1. The two 6s have no constraint between them.",
      },
      {
        input: "7",
        expected: "1",
      },
      {
        input: "2 2 2",
        expected: "3",
      },
      {
        input: "1 2 3 4 5",
        expected: "15",
      },
      {
        input: "5 4 3 2 1",
        expected: "15",
      },
      {
        input: "1 3 2 2 1",
        expected: "7",
      },
      {
        input: "1 2 87 87 87 2 1",
        expected: "13",
      },
      {
        input: "3 1 3 1 3",
        expected: "8",
      },
      {
        input:
          "457 13 157 468 405 278 904 55 2 439 788 547 601 677 389 253 531 337 777 186 421 680 373 877 474 470 224 969 509 827 161 805 902 350 308 794 290 656 222 149 228 991 561 554 6 239 423 376 471 275 41 344 864 639 540 751 752 349 859 315 956 860 907 774 106 346 551 877 775 582 919 814 265 378 734 19 7 363 116 584 646 425 960 619 634 521 284 202 103 633 821 524 322 132 638 368 800 569 691 768 895 590 195 260 586 367 799 423 842 786 212 200 717 884 761 775 250 424 921 100 759 875 492 860 691 454 271 310 743 520 667 795 206 352 919 402 170 336 689 60 80 108 208 459 145 977 471 509 748 360 699 379 533 295 831 149 401 758 63 837 508 840 939 228 638 973 852 625 956 144 915 857 849 262 257 340 534 303 135 44 602 853 473 97 585 827 684 136 289 754 7 723 864 432 176 82 841 602 987 466 514 428 107 474 431 76 808 513 184 267 935 825 374 331 244 436 729 144 430 468 814 525 491 999 529 281 721 711 872 503 103 97 470 171 521 480 775 359 827 353 672 881 297 26 394 725 610 639 435 859 76 91 169 8 549 234 546 816 152 880 870 484 863 185 178 95 328 294 465 673 953 374 32 472 696 109 28 74 130 890 469 960 754 865 760 935 99 626 918 379 838 499 655 407 500 226 881 651 604 95 915 646 621 197 626 299 125 135 461 362 437 44 584 407 942 946 450 191 664 699 136 120 511 927 479 575 313 783 380 745 912 857 489 217 573 195 807 619 470 992 239 890 954 309 34 520 85 718 352 295 166 91 816 762 444 12 615 361 835 973 7 515 299 979 976 523 248 66 774 522 114 947 289 457 860 379 4 673 425 124 28 437 996 327 421 749 913 296 736 437 487 165 768 554 844 412 517 278 306 823 392 784 347 968 364 329 765 591 167 251 918 224 307 444 154 91 681 973 641 421 477 38 557 275 135 130 73 461 974 828 128 724 687 666 206 98 17 97 689 995 450 156 69 759 62 329 702 631 802 285 886 514 512 326 533 1000 844 289 827 768 658 159 784 982 239 287 6 430 217 404 8 541 961 715 31 351 790 783 343 70 282 198 707 599 44 51 452 860 926 428 135 951 280 354 543 376 566 553 874 723 707 796 902 854 459 170 117 869 749 486 918 717 843 632 242 519 917 227 964 589 213 362 918 789 118 388 735 954 316 766 974 461 468 167 619 283 467 186 583 695 592 107 601 476 42 110 339 681 177 141 949 259 101 64 602 617 907 159 269 268 188 491 229 700 737 46 963 771 878 224 930 794 533 610 852 854 176 996 596 184 519 478 604 894 9 375 38 392 304 246 370 268 84 83 815 269 655 895 45 750 311 314 695 728 247 785 26 55 390 169 499 804 300 243 659 640 999 304 842 589 170 1000 616 548 774 260 951 513 697 893 747 289 413 857 601 195 944 547 283 643 95 220 907 646 468 405 328 396 970 768 22 265 950 287 458 976 536 341 222 552 393 3 163 195 814 152 73 987 394 89 625 888 36 435 855 169 60 883 977 977 655 982 230 331 345 132 482 522 440 967 391 919 65 39 949 883 152 983 167 676 22 668 344 991 711 458 271 461 384 809 756 600 381 914 364 504 937 298 647 371 562 275 762 458 255 17 662 538 434 638 676 75 559 503 862 23 608 15 214 264 448 357 741 980 169 325 594 567 516 199 609 734 741 818 693 418 572 503 846 853 353 600 714 306 83 457 298 854 49 578 507 92 902 603 382 456 562 715 852 892 826 649 578 345 329 848 705 514 239 243 81 117 612 232 70 453 937 150 183 926 225 886 390 878 195 329 810 476 830 991 428 181 885 170 782 292 496 738 950 628 857 645 381 96 107 478 388 956 713 851 328 476 947 38 483 488 897 73 63 449 73 990 659 109 392 144 846 319 589 877 456 343 160 454 653 540 761 512 83 28 710 32 646 866 256 361 148 676 425 346 95 199 461 644 508 873 923 711 978 381 592 606 293 117 281 636 300 767 601 324 886 766 394 659 701 563 225 126 550 808 306 3 869 831 231 342 315 579 266 108 151 883 710 88 410 611 600 287 805 802 593 1 818 520 8 561 813 432 370 166 813 690 23 892 329 770 268 213 614 819 865 170 328 719 185 174 778 109 956 653 480 669 270 750 479 62 890 289 47 599 805 992 584 289 717 235 286 197 60 594 320 627 258 936 612 541 455 395 849 965 209 296 886 811 795 472 479 122 484 784 830 66 647 980 631 997 396 218 901 775 730 1000 227 38 521 332 550 193 567 406 599 793 417 651 401 76 169 979 525 248 740 972 346 38 208 435 639 100 339 317 626 573 68 356 174 968 216 798 13 395 10 942 886 927 447 241 866 459 570 844 970 141 864 810 173 946 357 312 859 936 543 75 630 37 127 74 487 497 302 27 936 654 320 563 439 750 980 230 745 883 621 370 485 406 211 88 297 471 585 803 15 26 682 614 336 671 972 428 365 311 625 156 96 299 429 282 686 663 748 786 704 12 366 215 349 515 493 929 493 737 737 574 425 322 35 64 452 648 498 6 475 643 478 832 737 23 465 273 955 732 993 123 700 144 168 383 709 82 911 978 587 10 457 612 610 11 993 923 151 894 966 372 743 394 994 1000 119 639 127 255 222 847 823 383 639 223 652 892 83 365 459 724 973 963 726 96 6 986 981 965 69 267 587 858 266 705 329 557 764 939 380 617 70 635 75 856 313 772 360 77 621 433 455 966 501 267 47 758 749 889 515 279 282 401 486 726 306 783 10 521 650 75 517 168 244 907 708 798 528 606 708 380 859 925 710 61 667 393 697 9 529 96 442 770 234 224 546 612 285 651 276 452 664 290 587 592 577 893 759 801 830 625 305 636 203 853 986 951 700 29 714 196 267 51 176 383 321 827 225 495 770 396 834 761 178 314 446 409 112 603 258 220 607 586 60 923 351 111 494 781 581 401 714 664 772 635 395 576 624 553 503 474 393 606 395 70 159 302 615 73 92 880 734 22 788 463 148 800 619 145 841 260 178 883 513 590 692 536 542 919 750 387 964 713 838 329 595 62 354 345 363 318 408 461 897 379 877 795 675 823 419 531 359 987 132 632 970 461 858 28 64 181 203 40 227 303 945 57 448 962 816 587 513 435 656 567 64 901 358 326 585 693 585 799 578 477 174 842 719 386 975 1000 646 396 863 598 376 723 724 508 735 342 799 233 294 39 739 351 167 421 470 659 801 792 640 346 98 736 117 292 139 80 198 885 457 993 113 658 394 575 316 252 644 595 361 930 237 523 9 539 478 81 667 701 25 811 890 39 751 260 164 979 245 749 660 568 51 413 329 829 765 492 680 568 23 349 744 256 879 564 429 684 740 213 657 187 671 523 493 885 412 235 320 953 626 149 919 155 442 863 152 333 973 386 804 473 512 293 305 729 707 388 620 172 384 653 243 196 737 128 656 80 223 525 659 93 261 224 779 612 402 911 683 369 519 455 78 169 878 982 559 626 436 179 709 271 28 698 610 100 708 806 971 208 39 987 47 857 607 246 712 194 914 227 563 254 157 133 489 698 126 843 216 628 366 727 799 12 837 398 342 546 256 797 454 208 528 114 723 496 394 433 457 280 50 797 226 722 706 858 230 854 83 481 19 326 530 356 197 160 203 457 274 444 68 577 527 419 78 569 447 16 282 744 754 124 67 610 934 70 306 250 614 441 123 388 403 941 9 582 606 682 899 692 221 351 100 741 973 318 210 639 859 127 566 436 917 576 380 199 66 457 496 259 556 163 911 194 785 324 542 565 928 404 816 644 810 369 789 709 812 770 734 558 523 228 927 96 842 1000 40 147 913 806 834 958 0 529 101 987 879 756 78 204 538 662 122 545 763 981 927 728 954 905 26 277 938 36 359 826 997 272 178 879 215 257 716 618 356 1000 984 458 35 737 425 928 796 101 16 984 710 795 37 631 407 919 696 334 382 618 849 738 137 499 333 174 218 1 862 285 209 467 756 726 721 684 897 270 842 824 356 105 367 334 901 18 300 873 167 559 865 138 121 129 499 405 180 594 270 10 395 841 87 539 619 549 599 188 824 524 237 835 5 431 186 716 916 897 401 616 988 391 712 918 934 369 798 481 572 910 837 384 811 621 210 618 459 550 295 13 657 957 248 549 738 913 666 292 284 13 400 162 208 808 168 502 482 385 86 94 551 725 701 558 675 610 361 840 430 857 773 490 508 346 131 483 39 0 141 486 634 844 941 138 724 198 838 43 93 648 48 252 556 13 592 554 897 695 540 227 870 817 592 490 459 360 401 652 763 624 239 433 612 576 481 495 28 921 327 333 341 415 79 437 312 813 882 538 450 12 454 573 431 553 688 276 1 770 794 505 420 205 278 832 732 838 922 33 284 71 326 615 9 524 927 989 941 68 309 44 31 457 244 723 683 13 704 896 660 582 985 817 231 4 332 85 394 277 332 778 886 554 852 316 518 52 288 791 112 190 479 734 976 340 761 71 385 370 805 448",
        expected: "4131",
      },
      {
        input:
          "0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99 100 101 102 103 104 105 106 107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 122 123 124 125 126 127 128 129 130 131 132 133 134 135 136 137 138 139 140 141 142 143 144 145 146 147 148 149 150 151 152 153 154 155 156 157 158 159 160 161 162 163 164 165 166 167 168 169 170 171 172 173 174 175 176 177 178 179 180 181 182 183 184 185 186 187 188 189 190 191 192 193 194 195 196 197 198 199 200 201 202 203 204 205 206 207 208 209 210 211 212 213 214 215 216 217 218 219 220 221 222 223 224 225 226 227 228 229 230 231 232 233 234 235 236 237 238 239 240 241 242 243 244 245 246 247 248 249 250 251 252 253 254 255 256 257 258 259 260 261 262 263 264 265 266 267 268 269 270 271 272 273 274 275 276 277 278 279 280 281 282 283 284 285 286 287 288 289 290 291 292 293 294 295 296 297 298 299 300 301 302 303 304 305 306 307 308 309 310 311 312 313 314 315 316 317 318 319 320 321 322 323 324 325 326 327 328 329 330 331 332 333 334 335 336 337 338 339 340 341 342 343 344 345 346 347 348 349 350 351 352 353 354 355 356 357 358 359 360 361 362 363 364 365 366 367 368 369 370 371 372 373 374 375 376 377 378 379 380 381 382 383 384 385 386 387 388 389 390 391 392 393 394 395 396 397 398 399 400 401 402 403 404 405 406 407 408 409 410 411 412 413 414 415 416 417 418 419 420 421 422 423 424 425 426 427 428 429 430 431 432 433 434 435 436 437 438 439 440 441 442 443 444 445 446 447 448 449 450 451 452 453 454 455 456 457 458 459 460 461 462 463 464 465 466 467 468 469 470 471 472 473 474 475 476 477 478 479 480 481 482 483 484 485 486 487 488 489 490 491 492 493 494 495 496 497 498 499 500 501 502 503 504 505 506 507 508 509 510 511 512 513 514 515 516 517 518 519 520 521 522 523 524 525 526 527 528 529 530 531 532 533 534 535 536 537 538 539 540 541 542 543 544 545 546 547 548 549 550 551 552 553 554 555 556 557 558 559 560 561 562 563 564 565 566 567 568 569 570 571 572 573 574 575 576 577 578 579 580 581 582 583 584 585 586 587 588 589 590 591 592 593 594 595 596 597 598 599 600 601 602 603 604 605 606 607 608 609 610 611 612 613 614 615 616 617 618 619 620 621 622 623 624 625 626 627 628 629 630 631 632 633 634 635 636 637 638 639 640 641 642 643 644 645 646 647 648 649 650 651 652 653 654 655 656 657 658 659 660 661 662 663 664 665 666 667 668 669 670 671 672 673 674 675 676 677 678 679 680 681 682 683 684 685 686 687 688 689 690 691 692 693 694 695 696 697 698 699 700 701 702 703 704 705 706 707 708 709 710 711 712 713 714 715 716 717 718 719 720 721 722 723 724 725 726 727 728 729 730 731 732 733 734 735 736 737 738 739 740 741 742 743 744 745 746 747 748 749 750 751 752 753 754 755 756 757 758 759 760 761 762 763 764 765 766 767 768 769 770 771 772 773 774 775 776 777 778 779 780 781 782 783 784 785 786 787 788 789 790 791 792 793 794 795 796 797 798 799 800 801 802 803 804 805 806 807 808 809 810 811 812 813 814 815 816 817 818 819 820 821 822 823 824 825 826 827 828 829 830 831 832 833 834 835 836 837 838 839 840 841 842 843 844 845 846 847 848 849 850 851 852 853 854 855 856 857 858 859 860 861 862 863 864 865 866 867 868 869 870 871 872 873 874 875 876 877 878 879 880 881 882 883 884 885 886 887 888 889 890 891 892 893 894 895 896 897 898 899 900 901 902 903 904 905 906 907 908 909 910 911 912 913 914 915 916 917 918 919 920 921 922 923 924 925 926 927 928 929 930 931 932 933 934 935 936 937 938 939 940 941 942 943 944 945 946 947 948 949 950 951 952 953 954 955 956 957 958 959 960 961 962 963 964 965 966 967 968 969 970 971 972 973 974 975 976 977 978 979 980 981 982 983 984 985 986 987 988 989 990 991 992 993 994 995 996 997 998 999 1000 999 998 997 996 995 994 993 992 991 990 989 988 987 986 985 984 983 982 981 980 979 978 977 976 975 974 973 972 971 970 969 968 967 966 965 964 963 962 961 960 959 958 957 956 955 954 953 952 951 950 949 948 947 946 945 944 943 942 941 940 939 938 937 936 935 934 933 932 931 930 929 928 927 926 925 924 923 922 921 920 919 918 917 916 915 914 913 912 911 910 909 908 907 906 905 904 903 902 901 900 899 898 897 896 895 894 893 892 891 890 889 888 887 886 885 884 883 882 881 880 879 878 877 876 875 874 873 872 871 870 869 868 867 866 865 864 863 862 861 860 859 858 857 856 855 854 853 852 851 850 849 848 847 846 845 844 843 842 841 840 839 838 837 836 835 834 833 832 831 830 829 828 827 826 825 824 823 822 821 820 819 818 817 816 815 814 813 812 811 810 809 808 807 806 805 804 803 802 801 800 799 798 797 796 795 794 793 792 791 790 789 788 787 786 785 784 783 782 781 780 779 778 777 776 775 774 773 772 771 770 769 768 767 766 765 764 763 762 761 760 759 758 757 756 755 754 753 752 751 750 749 748 747 746 745 744 743 742 741 740 739 738 737 736 735 734 733 732 731 730 729 728 727 726 725 724 723 722 721 720 719 718 717 716 715 714 713 712 711 710 709 708 707 706 705 704 703 702 701 700 699 698 697 696 695 694 693 692 691 690 689 688 687 686 685 684 683 682 681 680 679 678 677 676 675 674 673 672 671 670 669 668 667 666 665 664 663 662 661 660 659 658 657 656 655 654 653 652 651 650 649 648 647 646 645 644 643 642 641 640 639 638 637 636 635 634 633 632 631 630 629 628 627 626 625 624 623 622 621 620 619 618 617 616 615 614 613 612 611 610 609 608 607 606 605 604 603 602 601 600 599 598 597 596 595 594 593 592 591 590 589 588 587 586 585 584 583 582 581 580 579 578 577 576 575 574 573 572 571 570 569 568 567 566 565 564 563 562 561 560 559 558 557 556 555 554 553 552 551 550 549 548 547 546 545 544 543 542 541 540 539 538 537 536 535 534 533 532 531 530 529 528 527 526 525 524 523 522 521 520 519 518 517 516 515 514 513 512 511 510 509 508 507 506 505 504 503 502 501 500 499 498 497 496 495 494 493 492 491 490 489 488 487 486 485 484 483 482 481 480 479 478 477 476 475 474 473 472 471 470 469 468 467 466 465 464 463 462 461 460 459 458 457 456 455 454 453 452 451 450 449 448 447 446 445 444 443 442 441 440 439 438 437 436 435 434 433 432 431 430 429 428 427 426 425 424 423 422 421 420 419 418 417 416 415 414 413 412 411 410 409 408 407 406 405 404 403 402 401 400 399 398 397 396 395 394 393 392 391 390 389 388 387 386 385 384 383 382 381 380 379 378 377 376 375 374 373 372 371 370 369 368 367 366 365 364 363 362 361 360 359 358 357 356 355 354 353 352 351 350 349 348 347 346 345 344 343 342 341 340 339 338 337 336 335 334 333 332 331 330 329 328 327 326 325 324 323 322 321 320 319 318 317 316 315 314 313 312 311 310 309 308 307 306 305 304 303 302 301 300 299 298 297 296 295 294 293 292 291 290 289 288 287 286 285 284 283 282 281 280 279 278 277 276 275 274 273 272 271 270 269 268 267 266 265 264 263 262 261 260 259 258 257 256 255 254 253 252 251 250 249 248 247 246 245 244 243 242 241 240 239 238 237 236 235 234 233 232 231 230 229 228 227 226 225 224 223 222 221 220 219 218 217 216 215 214 213 212 211 210 209 208 207 206 205 204 203 202 201 200 199 198 197 196 195 194 193 192 191 190 189 188 187 186 185 184 183 182 181 180 179 178 177 176 175 174 173 172 171 170 169 168 167 166 165 164 163 162 161 160 159 158 157 156 155 154 153 152 151 150 149 148 147 146 145 144 143 142 141 140 139 138 137 136 135 134 133 132 131 130 129 128 127 126 125 124 123 122 121 120 119 118 117 116 115 114 113 112 111 110 109 108 107 106 105 104 103 102 101 100 99 98 97 96 95 94 93 92 91 90 89 88 87 86 85 84 83 82 81 80 79 78 77 76 75 74 73 72 71 70 69 68 67 66 65 64 63 62 61 60 59 58 57 56 55 54 53 52 51 50 49 48 47 46 45 44 43 42 41 40 39 38 37 36 35 34 33 32 31 30 29 28 27 26 25 24 23 22 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1",
        expected: "1001001",
      },
    ],
    hints: [
      "Start everyone at one token. Which runners are clearly fine with just one?",
      "You could keep fixing violations until none remain — but a fix on one side can break the other side. How many rounds might that take?",
      "Handle the two directions separately: first make every runner beat a lower-scored left neighbour, then every runner beat a lower-scored right neighbour.",
      "The second pass must not undo the first: take the max of what the runner already has and right neighbour + 1.",
    ],
    solutions: [
      {
        title: "Repair violations until stable",
        order: 1,
        intuition:
          "Give everyone one token, then sweep the line repeatedly. Whenever a runner outscores a neighbour without having more tokens, raise them to neighbour + 1. Tokens only go up and stop at the true minimum, but a long descending run needs many sweeps to settle.",
        approach: [
          "Set every runner's tokens to 1.",
          "Sweep the line; for each runner, fix any violation against either neighbour.",
          "Repeat sweeps until one makes no change, then sum the tokens.",
        ],
        code: {
          PYTHON: `def minTokens(scores: List[int]) -> int:
    n = len(scores)
    tokens = [1] * n
    changed = True
    while changed:
        changed = False
        for i in range(n):
            if i > 0 and scores[i] > scores[i - 1] and tokens[i] <= tokens[i - 1]:
                tokens[i] = tokens[i - 1] + 1
                changed = True
            if i < n - 1 and scores[i] > scores[i + 1] and tokens[i] <= tokens[i + 1]:
                tokens[i] = tokens[i + 1] + 1
                changed = True
    return sum(tokens)`,
          JAVA: `class Solution {
    public int minTokens(int[] scores) {
        int n = scores.length;
        int[] tokens = new int[n];
        Arrays.fill(tokens, 1);
        boolean changed = true;
        while (changed) {
            changed = false;
            for (int i = 0; i < n; i++) {
                if (i > 0 && scores[i] > scores[i - 1] && tokens[i] <= tokens[i - 1]) {
                    tokens[i] = tokens[i - 1] + 1;
                    changed = true;
                }
                if (i < n - 1 && scores[i] > scores[i + 1] && tokens[i] <= tokens[i + 1]) {
                    tokens[i] = tokens[i + 1] + 1;
                    changed = true;
                }
            }
        }
        int total = 0;
        for (int t : tokens) total += t;
        return total;
    }
}`,
        },
        timeComplexity: "O(n²) — a descending run of length n needs about n sweeps",
        spaceComplexity: "O(n)",
        edgeCases: ["A single runner."],
        commonMistakes: ["Requiring more tokens for equal scores."],
      },
      {
        title: "Optimal: one pass each way, combine with max",
        order: 2,
        intuition:
          "Each runner faces two independent requirements: one from the left neighbour and one from the right. A left-to-right pass computes the smallest count meeting the left requirement for everyone (it chains up ascending runs). A right-to-left pass does the same for the right requirement. Each runner needs the larger of the two, and that combination still satisfies both sides, so it is optimal.",
        approach: [
          "Set tokens = [1] * n.",
          "Left pass: for i from 1, if scores[i] > scores[i-1], tokens[i] = tokens[i-1] + 1.",
          "Right pass: for i from n-2 down, if scores[i] > scores[i+1], tokens[i] = max(tokens[i], tokens[i+1] + 1).",
          "Return the sum.",
        ],
        code: {
          PYTHON: `def minTokens(scores: List[int]) -> int:
    n = len(scores)
    tokens = [1] * n

    # Beat a lower-scored left neighbour.
    for i in range(1, n):
        if scores[i] > scores[i - 1]:
            tokens[i] = tokens[i - 1] + 1

    # Beat a lower-scored right neighbour without losing the left rule.
    for i in range(n - 2, -1, -1):
        if scores[i] > scores[i + 1]:
            tokens[i] = max(tokens[i], tokens[i + 1] + 1)

    return sum(tokens)`,
          JAVA: `class Solution {
    public int minTokens(int[] scores) {
        int n = scores.length;
        int[] tokens = new int[n];
        Arrays.fill(tokens, 1);

        for (int i = 1; i < n; i++) {
            if (scores[i] > scores[i - 1]) tokens[i] = tokens[i - 1] + 1;
        }
        for (int i = n - 2; i >= 0; i--) {
            if (scores[i] > scores[i + 1]) tokens[i] = Math.max(tokens[i], tokens[i + 1] + 1);
        }

        int total = 0;
        for (int t : tokens) total += t;
        return total;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Equal neighbours, which may both receive one token.",
          "A strictly increasing or strictly decreasing line — the total is n(n+1)/2.",
          "A peak, where both passes disagree and the max decides.",
        ],
        commonMistakes: [
          "Overwriting instead of taking the max in the second pass, which breaks the left rule at peaks.",
          "Using ≥ for the comparison, which forces extra tokens between equal scores.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "fewest-sprinklers",
    title: "Fewest Sprinklers for the Lawn",
    difficulty: "HARD",
    learningObjective:
      "Convert a covering problem into 'farthest reach from each point', then cover a line with the fewest jumps greedily.",
    topics: ["greedy", "intervals"],
    patterns: ["greedy", "merge-intervals"],
    statement: [
      rich(
        "A park lawn runs along a line from position ",
        { code: "0" },
        " to position ",
        { code: "n" },
        ". A sprinkler is installed at every whole-number position 0, 1, …, n. The sprinkler at position i has radius radii[i] and, when switched on, waters the closed stretch [i - radii[i], i + radii[i]]. A radius of 0 means that sprinkler is broken and waters nothing."
      ),
      para(
        "Return the fewest sprinklers to switch on so that every point of the lawn from 0 to n is watered, or -1 if it cannot be done. Watering beyond either end of the lawn is allowed but does not help."
      ),
      example(
        "n = 7, radii = [1, 2, 1, 0, 2, 1, 0, 1]",
        "3",
        [
          { state: "sprinkler 1 covers [0, 3]", note: "best start: reaches 3" },
          { state: "from ≤ 3, sprinkler 4 covers [2, 6]", note: "farthest reach 6" },
          {
            state: "from ≤ 6, sprinkler 7 covers [6, 7]",
            note: "clipped at the end of the lawn",
          },
          { state: "3 sprinklers", note: "" },
        ],
        "Each choice reaches as far as possible"
      ),
    ],
    constraints: ["1 ≤ n ≤ 10000", "radii.length = n + 1", "0 ≤ radii[i] ≤ 100"],
    signature: {
      params: ["int", "int[]"],
      paramNames: ["n", "radii"],
      returns: "int",
      functionName: "fewestSprinklers",
    },
    tests: [
      {
        input: "7\n1 2 1 0 2 1 0 1",
        expected: "3",
        isSample: true,
        explanation: "Switch on sprinklers 1, 4 and 7.",
      },
      {
        input: "3\n0 0 0 0",
        expected: "-1",
        isSample: true,
        explanation: "Every sprinkler is broken.",
      },
      {
        input: "5\n3 4 1 1 0 0",
        expected: "1",
      },
      {
        input: "1\n1 0",
        expected: "1",
      },
      {
        input: "1\n0 0",
        expected: "-1",
      },
      {
        input: "2\n0 1 0",
        expected: "1",
      },
      {
        input: "4\n0 1 0 1 0",
        expected: "2",
      },
      {
        input: "4\n0 1 0 0 1",
        expected: "-1",
      },
      {
        input: "8\n4 0 0 0 0 0 0 0 4",
        expected: "2",
      },
      {
        input:
          "1999\n0 0 0 10 36 18 0 0 0 24 0 14 0 32 24 0 0 0 28 18 6 0 38 13 0 0 0 5 0 0 38 40 0 0 3 29 3 0 22 0 0 20 0 19 0 12 15 0 0 0 0 0 36 0 14 0 18 34 10 0 0 26 29 22 20 40 21 5 0 33 30 28 0 0 0 11 0 5 20 21 16 0 0 25 0 26 0 1 6 0 0 0 0 33 0 7 0 27 0 34 0 12 2 29 0 18 12 2 11 0 40 0 2 18 0 19 10 0 0 0 27 0 21 21 30 17 0 0 9 0 11 38 0 0 14 40 0 0 0 14 0 3 0 3 0 0 10 11 9 0 25 29 0 14 0 16 8 0 0 0 28 1 0 0 0 0 0 7 0 0 34 13 26 33 12 0 39 0 0 27 0 13 0 0 0 34 9 0 38 0 0 16 20 12 0 0 12 23 0 32 28 3 40 0 0 11 34 20 2 34 0 15 0 22 4 0 0 6 0 0 0 35 0 25 0 0 6 20 0 5 0 0 0 37 0 11 38 0 29 0 32 3 0 22 40 0 0 11 0 0 0 0 0 31 0 0 11 0 4 18 0 22 0 0 8 13 39 0 0 27 0 28 21 11 5 35 14 0 7 0 0 31 28 39 2 0 0 0 25 0 34 14 20 14 5 0 0 0 7 8 0 8 1 10 0 0 0 0 0 0 31 0 8 0 10 15 17 19 5 0 13 30 32 23 2 31 35 0 31 0 0 13 38 15 0 0 0 30 0 0 36 0 0 0 0 0 0 0 38 13 21 26 2 35 9 0 0 0 16 0 0 17 0 0 7 0 0 11 4 4 34 10 13 0 0 0 0 19 2 0 2 3 0 0 0 37 0 0 11 6 0 0 10 6 8 0 1 0 5 14 19 0 0 0 8 29 6 0 0 37 0 0 38 19 12 0 15 0 0 0 0 0 31 0 5 0 33 0 0 0 34 23 0 17 24 26 0 0 0 0 14 26 27 0 30 30 18 0 25 0 34 25 0 0 0 19 0 0 0 0 17 0 20 0 0 12 0 30 13 28 0 0 7 0 12 0 11 0 0 0 23 11 0 40 33 25 8 7 0 0 0 22 0 0 11 9 0 0 0 0 0 0 0 0 24 0 0 19 2 9 0 21 0 0 0 0 0 0 20 19 8 36 0 0 40 0 0 6 38 10 38 20 36 39 0 0 8 0 0 6 27 16 1 0 0 33 0 0 5 0 0 0 0 0 15 14 19 0 4 16 25 6 0 0 21 0 0 0 0 0 0 19 0 1 9 0 36 10 0 17 0 4 0 21 3 39 14 0 0 0 15 18 36 0 5 9 0 0 0 40 2 33 3 0 0 26 0 0 0 0 0 27 33 37 37 3 33 23 0 5 37 40 0 35 34 0 0 1 0 0 1 0 0 0 0 33 0 13 0 0 0 0 3 8 26 0 32 19 26 22 0 32 3 32 36 0 0 8 0 0 0 0 0 2 29 0 0 17 0 0 5 0 0 33 0 33 0 24 0 0 16 0 12 0 0 0 25 11 0 0 0 0 3 39 2 0 0 0 28 19 0 0 0 0 27 0 1 22 34 40 30 40 0 32 4 0 28 8 0 0 34 0 0 24 9 0 0 0 0 36 24 0 35 0 0 0 0 0 1 14 4 0 0 40 0 0 0 0 0 0 39 0 0 0 9 0 0 11 0 0 7 0 0 0 0 3 0 0 0 0 7 27 25 0 0 0 0 0 0 0 0 6 0 37 0 18 23 0 16 34 0 0 0 4 0 9 19 3 39 21 24 2 0 0 0 0 0 0 20 7 0 32 0 5 20 39 0 16 8 0 0 14 40 0 31 9 37 0 40 35 25 18 0 10 0 0 21 7 0 19 0 2 37 23 0 0 30 19 0 4 39 0 13 0 0 0 33 20 0 0 0 34 0 3 13 31 21 0 0 0 0 40 31 11 6 0 5 0 0 31 3 0 38 3 0 0 39 0 0 14 0 0 0 0 33 19 0 0 28 17 0 23 12 26 0 0 17 0 0 13 0 0 0 13 26 0 28 10 2 36 0 32 23 31 1 17 29 4 0 0 2 0 0 34 10 21 33 0 22 0 26 0 29 0 0 9 7 34 0 0 0 31 0 28 0 31 21 0 16 16 28 28 8 0 0 0 0 0 12 5 22 0 0 36 34 18 32 0 4 0 0 0 0 20 0 0 4 0 0 0 0 1 36 0 0 1 0 6 0 20 0 0 11 20 13 0 15 36 0 0 3 0 0 28 0 24 28 21 12 6 0 0 12 35 0 35 0 0 17 0 21 0 36 0 3 0 37 0 28 0 0 0 0 0 3 0 0 0 24 0 26 14 16 17 21 0 22 0 22 0 18 0 22 0 0 20 6 0 7 0 0 0 0 0 22 8 0 18 0 0 0 0 0 18 31 33 0 39 35 3 0 38 0 0 7 9 25 0 37 22 24 0 0 17 31 0 0 0 0 0 0 0 39 0 9 0 0 20 2 0 0 32 0 39 0 0 0 0 7 0 0 33 0 0 0 0 0 1 5 23 0 33 0 26 0 21 29 1 0 0 0 14 40 0 31 0 17 0 0 7 0 1 28 0 0 35 0 0 0 0 0 0 31 0 0 1 0 0 31 0 3 0 29 0 16 0 8 14 40 10 0 0 7 20 32 27 0 0 0 0 7 0 28 0 38 17 0 0 0 0 0 0 0 31 0 33 15 35 0 14 0 13 6 0 0 25 28 30 0 8 4 0 38 8 25 0 34 0 0 0 0 0 8 11 25 0 27 0 0 5 0 0 11 0 24 0 1 27 0 1 0 15 0 14 0 29 31 22 0 35 0 8 18 7 33 19 0 32 10 0 19 0 20 0 36 0 0 1 5 0 34 0 25 29 38 0 0 37 17 0 22 0 22 39 0 0 16 0 0 0 0 0 0 0 11 0 14 0 0 0 23 19 24 21 14 0 20 38 27 0 0 0 0 0 32 0 16 0 0 28 0 28 10 0 0 3 0 0 13 29 5 0 0 37 0 3 0 0 0 34 0 0 0 35 9 0 0 34 30 25 29 33 7 16 30 22 0 0 0 5 29 19 0 4 5 0 0 14 0 0 0 0 35 0 19 0 0 0 0 0 29 0 0 15 0 2 0 0 0 0 0 0 18 0 0 0 38 13 21 29 0 27 31 6 33 0 3 35 0 39 0 0 0 0 0 0 21 0 0 0 11 11 5 0 0 0 13 6 2 39 9 0 0 2 0 0 0 23 0 0 0 37 0 33 0 34 0 14 0 25 0 0 25 0 36 0 0 0 0 5 0 0 26 0 20 24 15 25 0 0 19 11 32 9 28 0 37 38 1 26 4 19 0 0 0 0 32 0 12 3 0 29 40 0 27 0 0 0 7 16 0 0 0 21 0 0 0 37 0 0 0 31 0 0 0 0 16 0 35 0 0 0 0 0 36 0 29 0 0 0 3 20 0 0 34 19 39 27 0 1 32 0 5 22 0 0 0 14 0 0 0 0 38 24 0 0 4 40 0 0 0 0 0 40 0 25 0 34 34 23 0 35 30 18 4 38 17 0 35 35 0 0 0 0 0 0 0 33 0 21 10 0 0 0 0 20 16 0 0 12 0 0 39 0 0 0 0 0 0 38 0 0 0 0 0 37 22 12 29 0 0 0 4 11 0 0 19 0 20 0 0 34 23 0 0 11 0 0 0 0 0 0 0 0 0 9 29 2 0 40 20 11 8 0 13 32 31 25 0 25 0 0 34 0 30 0 0 13 0 0 35 0 34 0 0 0 0 0 0 0 5 0 0 0 0 27 0 0 13 28 0 0 0 12 0 5 0 33 0 32 14 8 32 0 30 24 8 0 12 13 0 24 28 31 0 0 0 0 0 22 4 3 23 3 0 0 0 0 23 0 0 26 0 31 5 37 39 14 23 0 17 0 0 38 31 0 6 3 0 0 0 0 0 33 19 0 24 16 0 30 0 0 32 0 40 0 30 6 0 17 15 0 0 32 19 21 0 31 0 6 0 7 7 36 0 0 0 0 0 6 0 30 0 0 26 31 0 25 0 0 19 37 0 0 0 19 20 1 19 0 16 26 25 0 19 25 0 0 0 38 15 0 29 8 0 0 17 0 0 0 21 27 8 23 0 0 0 12 0 0 14 0 0 0 0 0 12 20 0 0 0 26 0 0 0 21 0 0 0 21 24 8 0 0 0 0 0 2 19 0 35 0 0 16 0 0 22 0 25 0 35 34 0 30 6 19 0 36 8 0 0 0 0 10 0 34 0 17 0 0 21 0 36 0 37 21 0 22 0 39 0 14 23 12 10 0 0 7 24 33 0 25 0 23 0 40 0 0 0 2 29 33 5 16 40 26 0 0 13 0 14 27 32 9 0 0 0 0 0 0 13 36 0 21 8 0 0 8 0 27 28 2 28 0 26 32 0 33 0 0 0 36 0 16 0 16 0 32 29 0",
        expected: "31",
      },
      {
        input:
          "1999\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1",
        expected: "1000",
      },
    ],
    hints: [
      "Each working sprinkler is an interval clipped to [0, n]. You need the fewest intervals whose union is the whole lawn.",
      "If you know the lawn is watered up to x, which sprinkler should you add next? Among those starting at or before x, the one that reaches farthest.",
      "Precompute, for every left edge, the farthest right edge of any sprinkler starting there. Now the problem looks like crossing a line with the fewest jumps.",
      "Scan positions, tracking the farthest reach seen so far. When you hit the end of the current coverage, you must switch on a sprinkler — and if the farthest reach does not move past you, return -1.",
    ],
    solutions: [
      {
        title: "Dynamic programming over covered prefixes",
        order: 1,
        intuition:
          "Let best[x] be the fewest sprinklers that water [0, x]. Process sprinklers sorted by left edge: a sprinkler covering [lo, hi] can extend any coverage that already reaches lo, so for every x in [lo, hi] we can set best[x] = min(best[x], min(best[lo..hi]) + 1). Sorting by left edge makes sure the prefixes it extends are already final.",
        approach: [
          "Clip each working sprinkler to [lo, hi] within [0, n] and sort by lo.",
          "Set best[0] = 0 and every other best to infinity.",
          "For each interval, take m = min(best[lo..hi]) and lower best[x] to m + 1 for x in lo..hi.",
          "Return best[n], or -1 if it is still infinity.",
        ],
        code: {
          PYTHON: `def fewestSprinklers(n: int, radii: List[int]) -> int:
    spans = sorted(
        (max(0, i - r), min(n, i + r)) for i, r in enumerate(radii) if r > 0
    )
    INF = float("inf")
    best = [INF] * (n + 1)
    best[0] = 0

    for lo, hi in spans:
        m = min(best[lo : hi + 1])
        for x in range(lo, hi + 1):
            best[x] = min(best[x], m + 1)

    return best[n] if best[n] != INF else -1`,
          JAVA: `class Solution {
    public int fewestSprinklers(int n, int[] radii) {
        List<int[]> spans = new ArrayList<>();
        for (int i = 0; i <= n; i++) {
            if (radii[i] > 0) spans.add(new int[] {Math.max(0, i - radii[i]), Math.min(n, i + radii[i])});
        }
        spans.sort((a, b) -> Integer.compare(a[0], b[0]));

        int INF = Integer.MAX_VALUE / 2;
        int[] best = new int[n + 1];
        Arrays.fill(best, INF);
        best[0] = 0;
        for (int[] s : spans) {
            int m = INF;
            for (int x = s[0]; x <= s[1]; x++) m = Math.min(m, best[x]);
            for (int x = s[0]; x <= s[1]; x++) best[x] = Math.min(best[x], m + 1);
        }
        return best[n] >= INF ? -1 : best[n];
    }
}`,
        },
        timeComplexity: "O(n · r) for maximum radius r, plus sorting",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Every sprinkler broken.",
          "A single sprinkler covering everything.",
        ],
        commonMistakes: [
          "Treating a radius-0 sprinkler as covering its own point and counting it.",
        ],
      },
      {
        title: "Optimal: farthest reach per left edge, then greedy jumps",
        order: 2,
        intuition:
          "Only two things matter about a sprinkler: where its watered stretch starts and how far right it reaches. For each starting point keep the farthest reach. Then walk the lawn like a jumping game: coverage currently ends at cur; among everything starting at or before cur, the farthest reach is far. When the walk arrives at cur, one more sprinkler is unavoidable, and the best one extends coverage to far. If far does not get past cur, there is an unwatered gap.",
        approach: [
          "Build reach[lo] = max right edge of any working sprinkler whose clipped stretch starts at lo.",
          "Set count = 0, cur = 0 (watered up to here), far = 0.",
          "For x from 0 to n - 1, update far = max(far, reach[x]).",
          "When x == cur: if far ≤ x, return -1; otherwise count += 1 and cur = far.",
          "Return count.",
        ],
        code: {
          PYTHON: `def fewestSprinklers(n: int, radii: List[int]) -> int:
    reach = [0] * (n + 1)  # farthest right edge for each left edge
    for i, r in enumerate(radii):
        if r == 0:
            continue
        lo = max(0, i - r)
        reach[lo] = max(reach[lo], min(n, i + r))

    count = 0
    cur = 0  # lawn is watered up to here
    far = 0  # farthest any reachable sprinkler could extend it
    for x in range(n):
        far = max(far, reach[x])
        if x == cur:
            if far <= x:
                return -1  # nothing waters past x
            count += 1
            cur = far

    return count`,
          JAVA: `class Solution {
    public int fewestSprinklers(int n, int[] radii) {
        int[] reach = new int[n + 1];
        for (int i = 0; i <= n; i++) {
            if (radii[i] == 0) continue;
            int lo = Math.max(0, i - radii[i]);
            reach[lo] = Math.max(reach[lo], Math.min(n, i + radii[i]));
        }

        int count = 0, cur = 0, far = 0;
        for (int x = 0; x < n; x++) {
            far = Math.max(far, reach[x]);
            if (x == cur) {
                if (far <= x) return -1;
                count++;
                cur = far;
            }
        }
        return count;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A gap between two sprinklers' stretches — return -1.",
          "Stretches that touch at a single point are enough to connect.",
          "Broken sprinklers next to working ones.",
          "One sprinkler that covers the whole lawn.",
        ],
        commonMistakes: [
          "Counting a sprinkler every time far grows, rather than only when the current coverage runs out.",
          "Looping x up to n inclusive, which adds a spurious extra sprinkler at the very end.",
          "Forgetting to clip the left edge at 0.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "fewest-depot-stops",
    title: "Fewest Depot Stops",
    difficulty: "HARD",
    learningObjective:
      "Defer each greedy decision until it is forced, using a max-heap of passed options so the choice can be made in hindsight.",
    topics: ["greedy", "arrays"],
    patterns: ["heap", "greedy"],
    statement: [
      rich(
        "A supply truck must drive ",
        { code: "target" },
        " kilometres along a straight road. It starts with ",
        { code: "startFuel" },
        " litres in a tank with no size limit and burns exactly one litre per kilometre."
      ),
      para(
        "Fuel depots stand along the road. Each row of depots is [position, litres]: the depot is position kilometres from the start and can give the truck that many litres, all at once. Depots are sorted by position, every position is strictly between 0 and target, and no two share a position. The truck may stop at a depot if it arrives with zero or more litres left."
      ),
      para(
        "Return the fewest depot stops needed to reach the destination, or -1 if it is impossible."
      ),
      example(
        "target = 100, startFuel = 10, depots = [[10, 60], [20, 30], [30, 30], [60, 40]]",
        "2",
        [
          { state: "fuel reaches 10", note: "passed: {60} — must stop, take the 60" },
          {
            state: "fuel reaches 70",
            note: "passed: {30, 30, 40} — still short of 100",
          },
          { state: "take the 40 (depot at 60)", note: "fuel reaches 110 ≥ 100" },
          { state: "2 stops", note: "" },
        ],
        "Stop only when forced, at the best depot already passed"
      ),
    ],
    constraints: [
      "1 ≤ target, startFuel ≤ 1000000000",
      "0 ≤ depots.length ≤ 500",
      "0 < position < target; positions strictly increasing",
      "1 ≤ litres ≤ 1000000",
    ],
    signature: {
      params: ["int", "int", "int[][]"],
      paramNames: ["target", "startFuel", "depots"],
      returns: "int",
      functionName: "fewestDepotStops",
    },
    tests: [
      {
        input: "100\n10\n4\n10 60\n20 30\n30 30\n60 40",
        expected: "2",
        isSample: true,
        explanation: "Stop at the depots at 10 and 60.",
      },
      {
        input: "100\n20\n2\n10 40\n50 20",
        expected: "-1",
        isSample: true,
        explanation: "Even stopping at both depots only reaches 80 kilometres.",
      },
      {
        input: "1\n1\n0",
        expected: "0",
      },
      {
        input: "100\n1\n1\n10 100",
        expected: "-1",
      },
      {
        input: "50\n50\n1\n25 25",
        expected: "0",
      },
      {
        input: "30\n10\n2\n10 10\n20 10",
        expected: "2",
      },
      {
        input: "30\n10\n2\n10 5\n20 50",
        expected: "-1",
      },
      {
        input:
          "1000\n299\n10\n13 21\n26 115\n100 47\n225 99\n299 141\n444 198\n608 190\n636 157\n647 255\n841 123",
        expected: "4",
      },
      {
        input:
          "10000\n50\n500\n29 40\n30 33\n35 42\n80 15\n84 52\n88 53\n93 29\n96 12\n108 21\n115 32\n123 11\n158 10\n163 30\n195 28\n216 35\n237 21\n258 54\n259 49\n306 54\n321 48\n330 9\n341 12\n375 45\n382 36\n383 31\n392 32\n453 7\n456 42\n555 38\n560 41\n628 6\n642 12\n643 39\n649 24\n681 17\n686 2\n711 4\n714 48\n735 47\n771 13\n815 32\n824 13\n829 20\n858 44\n866 41\n889 49\n909 9\n917 19\n924 2\n939 5\n1005 33\n1065 15\n1103 53\n1113 50\n1118 7\n1125 6\n1152 14\n1175 33\n1197 7\n1238 58\n1253 21\n1269 1\n1276 4\n1318 46\n1334 20\n1348 3\n1385 46\n1400 50\n1410 29\n1411 20\n1416 29\n1417 14\n1437 53\n1459 55\n1470 13\n1477 18\n1481 30\n1506 42\n1513 21\n1519 6\n1597 38\n1624 19\n1630 14\n1631 28\n1645 18\n1677 56\n1695 4\n1702 11\n1708 6\n1743 5\n1774 32\n1790 59\n1801 57\n1804 16\n1831 60\n1844 9\n1850 31\n1885 15\n1894 52\n1899 48\n1918 39\n1921 42\n1943 33\n1971 43\n1984 56\n1987 26\n2011 19\n2022 23\n2045 6\n2088 42\n2122 9\n2130 33\n2137 29\n2159 45\n2160 23\n2171 49\n2202 7\n2253 58\n2259 31\n2273 5\n2296 39\n2302 36\n2330 34\n2334 44\n2375 57\n2390 32\n2406 44\n2417 43\n2421 16\n2520 2\n2527 26\n2546 44\n2548 21\n2563 46\n2621 21\n2625 43\n2643 52\n2653 2\n2662 44\n2677 36\n2750 7\n2771 58\n2803 3\n2806 58\n2818 60\n2827 52\n2842 37\n2858 37\n2868 24\n2897 38\n2947 28\n3012 10\n3016 23\n3026 17\n3030 56\n3085 26\n3109 45\n3127 29\n3158 9\n3167 26\n3175 2\n3204 25\n3224 47\n3230 13\n3248 48\n3268 30\n3274 6\n3280 31\n3285 47\n3313 52\n3318 42\n3379 21\n3419 49\n3443 16\n3452 57\n3478 38\n3483 7\n3486 1\n3492 19\n3511 2\n3532 35\n3548 53\n3553 14\n3560 45\n3572 53\n3600 60\n3629 54\n3634 50\n3700 49\n3704 10\n3706 32\n3722 56\n3763 54\n3788 4\n3790 59\n3840 7\n3847 24\n3874 4\n3888 34\n3897 30\n3933 24\n3934 4\n3940 56\n3991 37\n4006 48\n4010 33\n4018 45\n4033 20\n4079 14\n4139 10\n4193 54\n4194 54\n4297 12\n4298 60\n4300 35\n4354 31\n4356 13\n4383 27\n4404 51\n4426 16\n4437 8\n4438 23\n4453 8\n4471 58\n4492 13\n4495 7\n4500 34\n4518 28\n4519 4\n4554 29\n4563 39\n4623 25\n4632 3\n4664 47\n4700 6\n4719 6\n4738 51\n4740 15\n4754 41\n4776 45\n4812 2\n4817 36\n4827 25\n4839 34\n4855 57\n4882 14\n4886 29\n4903 24\n4905 10\n4911 9\n4913 26\n4949 56\n4984 38\n4988 21\n5005 16\n5029 18\n5042 24\n5044 5\n5061 60\n5079 29\n5081 51\n5105 54\n5126 33\n5140 30\n5147 22\n5151 53\n5174 49\n5184 58\n5208 28\n5226 29\n5242 53\n5323 44\n5345 55\n5349 44\n5427 5\n5429 58\n5440 29\n5480 54\n5553 7\n5554 31\n5562 27\n5598 10\n5672 36\n5725 40\n5742 28\n5747 27\n5756 38\n5763 23\n5832 2\n5838 36\n5840 2\n5862 13\n5913 28\n5980 31\n6035 20\n6049 26\n6078 32\n6081 8\n6097 26\n6109 57\n6120 53\n6169 38\n6181 58\n6216 1\n6221 39\n6266 23\n6285 21\n6293 16\n6296 55\n6332 33\n6336 10\n6350 14\n6387 20\n6436 54\n6446 57\n6459 9\n6486 54\n6492 48\n6509 2\n6534 52\n6536 50\n6680 43\n6695 33\n6738 35\n6766 38\n6790 29\n6829 46\n6835 22\n6844 23\n6846 39\n6939 5\n6941 25\n6995 59\n7022 1\n7025 47\n7055 34\n7056 38\n7062 54\n7064 42\n7069 42\n7082 60\n7097 21\n7125 54\n7158 10\n7236 13\n7263 16\n7268 26\n7287 1\n7318 14\n7326 6\n7333 12\n7355 59\n7415 17\n7471 26\n7521 35\n7530 50\n7558 30\n7567 34\n7571 6\n7580 5\n7588 24\n7612 48\n7633 58\n7635 23\n7647 21\n7654 54\n7778 39\n7786 55\n7795 30\n7801 52\n7803 22\n7804 39\n7817 50\n7819 7\n7847 50\n7857 23\n7915 52\n7916 12\n7948 24\n7949 4\n7951 32\n7952 60\n7980 26\n7983 2\n7992 17\n8021 22\n8072 4\n8088 33\n8089 7\n8100 19\n8126 3\n8132 5\n8156 44\n8161 15\n8178 9\n8200 52\n8230 3\n8247 54\n8325 40\n8361 59\n8363 49\n8368 3\n8428 20\n8431 38\n8463 11\n8485 2\n8487 7\n8494 31\n8522 21\n8573 58\n8584 5\n8588 46\n8612 9\n8633 8\n8635 59\n8641 22\n8676 17\n8677 23\n8744 55\n8750 41\n8752 10\n8777 4\n8791 22\n8792 55\n8793 23\n8798 53\n8807 55\n8852 50\n8858 17\n8859 21\n8882 11\n8930 14\n8945 33\n8961 21\n8970 60\n8995 19\n8997 45\n9003 53\n9022 15\n9050 57\n9055 26\n9088 50\n9095 19\n9104 34\n9133 4\n9162 2\n9173 48\n9181 23\n9184 23\n9188 54\n9212 58\n9216 59\n9220 51\n9235 9\n9238 11\n9265 40\n9271 9\n9276 58\n9292 18\n9358 39\n9373 15\n9375 28\n9376 4\n9415 54\n9443 36\n9450 15\n9484 37\n9502 19\n9510 20\n9525 18\n9544 59\n9550 4\n9556 8\n9560 19\n9564 49\n9572 20\n9576 16\n9607 59\n9616 50\n9654 50\n9688 28\n9693 14\n9702 23\n9715 4\n9717 53\n9765 29\n9775 25\n9794 39\n9817 49\n9831 42\n9854 27\n9878 4\n9898 28\n9902 57\n9916 16\n9967 24\n9971 40\n9981 24\n9985 23\n9987 49",
        expected: "209",
      },
      {
        input:
          "10000\n1000\n999\n10 9\n20 9\n30 9\n40 9\n50 9\n60 9\n70 9\n80 9\n90 9\n100 9\n110 9\n120 9\n130 9\n140 9\n150 9\n160 9\n170 9\n180 9\n190 9\n200 9\n210 9\n220 9\n230 9\n240 9\n250 9\n260 9\n270 9\n280 9\n290 9\n300 9\n310 9\n320 9\n330 9\n340 9\n350 9\n360 9\n370 9\n380 9\n390 9\n400 9\n410 9\n420 9\n430 9\n440 9\n450 9\n460 9\n470 9\n480 9\n490 9\n500 9\n510 9\n520 9\n530 9\n540 9\n550 9\n560 9\n570 9\n580 9\n590 9\n600 9\n610 9\n620 9\n630 9\n640 9\n650 9\n660 9\n670 9\n680 9\n690 9\n700 9\n710 9\n720 9\n730 9\n740 9\n750 9\n760 9\n770 9\n780 9\n790 9\n800 9\n810 9\n820 9\n830 9\n840 9\n850 9\n860 9\n870 9\n880 9\n890 9\n900 9\n910 9\n920 9\n930 9\n940 9\n950 9\n960 9\n970 9\n980 9\n990 9\n1000 9\n1010 9\n1020 9\n1030 9\n1040 9\n1050 9\n1060 9\n1070 9\n1080 9\n1090 9\n1100 9\n1110 9\n1120 9\n1130 9\n1140 9\n1150 9\n1160 9\n1170 9\n1180 9\n1190 9\n1200 9\n1210 9\n1220 9\n1230 9\n1240 9\n1250 9\n1260 9\n1270 9\n1280 9\n1290 9\n1300 9\n1310 9\n1320 9\n1330 9\n1340 9\n1350 9\n1360 9\n1370 9\n1380 9\n1390 9\n1400 9\n1410 9\n1420 9\n1430 9\n1440 9\n1450 9\n1460 9\n1470 9\n1480 9\n1490 9\n1500 9\n1510 9\n1520 9\n1530 9\n1540 9\n1550 9\n1560 9\n1570 9\n1580 9\n1590 9\n1600 9\n1610 9\n1620 9\n1630 9\n1640 9\n1650 9\n1660 9\n1670 9\n1680 9\n1690 9\n1700 9\n1710 9\n1720 9\n1730 9\n1740 9\n1750 9\n1760 9\n1770 9\n1780 9\n1790 9\n1800 9\n1810 9\n1820 9\n1830 9\n1840 9\n1850 9\n1860 9\n1870 9\n1880 9\n1890 9\n1900 9\n1910 9\n1920 9\n1930 9\n1940 9\n1950 9\n1960 9\n1970 9\n1980 9\n1990 9\n2000 9\n2010 9\n2020 9\n2030 9\n2040 9\n2050 9\n2060 9\n2070 9\n2080 9\n2090 9\n2100 9\n2110 9\n2120 9\n2130 9\n2140 9\n2150 9\n2160 9\n2170 9\n2180 9\n2190 9\n2200 9\n2210 9\n2220 9\n2230 9\n2240 9\n2250 9\n2260 9\n2270 9\n2280 9\n2290 9\n2300 9\n2310 9\n2320 9\n2330 9\n2340 9\n2350 9\n2360 9\n2370 9\n2380 9\n2390 9\n2400 9\n2410 9\n2420 9\n2430 9\n2440 9\n2450 9\n2460 9\n2470 9\n2480 9\n2490 9\n2500 9\n2510 9\n2520 9\n2530 9\n2540 9\n2550 9\n2560 9\n2570 9\n2580 9\n2590 9\n2600 9\n2610 9\n2620 9\n2630 9\n2640 9\n2650 9\n2660 9\n2670 9\n2680 9\n2690 9\n2700 9\n2710 9\n2720 9\n2730 9\n2740 9\n2750 9\n2760 9\n2770 9\n2780 9\n2790 9\n2800 9\n2810 9\n2820 9\n2830 9\n2840 9\n2850 9\n2860 9\n2870 9\n2880 9\n2890 9\n2900 9\n2910 9\n2920 9\n2930 9\n2940 9\n2950 9\n2960 9\n2970 9\n2980 9\n2990 9\n3000 9\n3010 9\n3020 9\n3030 9\n3040 9\n3050 9\n3060 9\n3070 9\n3080 9\n3090 9\n3100 9\n3110 9\n3120 9\n3130 9\n3140 9\n3150 9\n3160 9\n3170 9\n3180 9\n3190 9\n3200 9\n3210 9\n3220 9\n3230 9\n3240 9\n3250 9\n3260 9\n3270 9\n3280 9\n3290 9\n3300 9\n3310 9\n3320 9\n3330 9\n3340 9\n3350 9\n3360 9\n3370 9\n3380 9\n3390 9\n3400 9\n3410 9\n3420 9\n3430 9\n3440 9\n3450 9\n3460 9\n3470 9\n3480 9\n3490 9\n3500 9\n3510 9\n3520 9\n3530 9\n3540 9\n3550 9\n3560 9\n3570 9\n3580 9\n3590 9\n3600 9\n3610 9\n3620 9\n3630 9\n3640 9\n3650 9\n3660 9\n3670 9\n3680 9\n3690 9\n3700 9\n3710 9\n3720 9\n3730 9\n3740 9\n3750 9\n3760 9\n3770 9\n3780 9\n3790 9\n3800 9\n3810 9\n3820 9\n3830 9\n3840 9\n3850 9\n3860 9\n3870 9\n3880 9\n3890 9\n3900 9\n3910 9\n3920 9\n3930 9\n3940 9\n3950 9\n3960 9\n3970 9\n3980 9\n3990 9\n4000 9\n4010 9\n4020 9\n4030 9\n4040 9\n4050 9\n4060 9\n4070 9\n4080 9\n4090 9\n4100 9\n4110 9\n4120 9\n4130 9\n4140 9\n4150 9\n4160 9\n4170 9\n4180 9\n4190 9\n4200 9\n4210 9\n4220 9\n4230 9\n4240 9\n4250 9\n4260 9\n4270 9\n4280 9\n4290 9\n4300 9\n4310 9\n4320 9\n4330 9\n4340 9\n4350 9\n4360 9\n4370 9\n4380 9\n4390 9\n4400 9\n4410 9\n4420 9\n4430 9\n4440 9\n4450 9\n4460 9\n4470 9\n4480 9\n4490 9\n4500 9\n4510 9\n4520 9\n4530 9\n4540 9\n4550 9\n4560 9\n4570 9\n4580 9\n4590 9\n4600 9\n4610 9\n4620 9\n4630 9\n4640 9\n4650 9\n4660 9\n4670 9\n4680 9\n4690 9\n4700 9\n4710 9\n4720 9\n4730 9\n4740 9\n4750 9\n4760 9\n4770 9\n4780 9\n4790 9\n4800 9\n4810 9\n4820 9\n4830 9\n4840 9\n4850 9\n4860 9\n4870 9\n4880 9\n4890 9\n4900 9\n4910 9\n4920 9\n4930 9\n4940 9\n4950 9\n4960 9\n4970 9\n4980 9\n4990 9\n5000 9\n5010 9\n5020 9\n5030 9\n5040 9\n5050 9\n5060 9\n5070 9\n5080 9\n5090 9\n5100 9\n5110 9\n5120 9\n5130 9\n5140 9\n5150 9\n5160 9\n5170 9\n5180 9\n5190 9\n5200 9\n5210 9\n5220 9\n5230 9\n5240 9\n5250 9\n5260 9\n5270 9\n5280 9\n5290 9\n5300 9\n5310 9\n5320 9\n5330 9\n5340 9\n5350 9\n5360 9\n5370 9\n5380 9\n5390 9\n5400 9\n5410 9\n5420 9\n5430 9\n5440 9\n5450 9\n5460 9\n5470 9\n5480 9\n5490 9\n5500 9\n5510 9\n5520 9\n5530 9\n5540 9\n5550 9\n5560 9\n5570 9\n5580 9\n5590 9\n5600 9\n5610 9\n5620 9\n5630 9\n5640 9\n5650 9\n5660 9\n5670 9\n5680 9\n5690 9\n5700 9\n5710 9\n5720 9\n5730 9\n5740 9\n5750 9\n5760 9\n5770 9\n5780 9\n5790 9\n5800 9\n5810 9\n5820 9\n5830 9\n5840 9\n5850 9\n5860 9\n5870 9\n5880 9\n5890 9\n5900 9\n5910 9\n5920 9\n5930 9\n5940 9\n5950 9\n5960 9\n5970 9\n5980 9\n5990 9\n6000 9\n6010 9\n6020 9\n6030 9\n6040 9\n6050 9\n6060 9\n6070 9\n6080 9\n6090 9\n6100 9\n6110 9\n6120 9\n6130 9\n6140 9\n6150 9\n6160 9\n6170 9\n6180 9\n6190 9\n6200 9\n6210 9\n6220 9\n6230 9\n6240 9\n6250 9\n6260 9\n6270 9\n6280 9\n6290 9\n6300 9\n6310 9\n6320 9\n6330 9\n6340 9\n6350 9\n6360 9\n6370 9\n6380 9\n6390 9\n6400 9\n6410 9\n6420 9\n6430 9\n6440 9\n6450 9\n6460 9\n6470 9\n6480 9\n6490 9\n6500 9\n6510 9\n6520 9\n6530 9\n6540 9\n6550 9\n6560 9\n6570 9\n6580 9\n6590 9\n6600 9\n6610 9\n6620 9\n6630 9\n6640 9\n6650 9\n6660 9\n6670 9\n6680 9\n6690 9\n6700 9\n6710 9\n6720 9\n6730 9\n6740 9\n6750 9\n6760 9\n6770 9\n6780 9\n6790 9\n6800 9\n6810 9\n6820 9\n6830 9\n6840 9\n6850 9\n6860 9\n6870 9\n6880 9\n6890 9\n6900 9\n6910 9\n6920 9\n6930 9\n6940 9\n6950 9\n6960 9\n6970 9\n6980 9\n6990 9\n7000 9\n7010 9\n7020 9\n7030 9\n7040 9\n7050 9\n7060 9\n7070 9\n7080 9\n7090 9\n7100 9\n7110 9\n7120 9\n7130 9\n7140 9\n7150 9\n7160 9\n7170 9\n7180 9\n7190 9\n7200 9\n7210 9\n7220 9\n7230 9\n7240 9\n7250 9\n7260 9\n7270 9\n7280 9\n7290 9\n7300 9\n7310 9\n7320 9\n7330 9\n7340 9\n7350 9\n7360 9\n7370 9\n7380 9\n7390 9\n7400 9\n7410 9\n7420 9\n7430 9\n7440 9\n7450 9\n7460 9\n7470 9\n7480 9\n7490 9\n7500 9\n7510 9\n7520 9\n7530 9\n7540 9\n7550 9\n7560 9\n7570 9\n7580 9\n7590 9\n7600 9\n7610 9\n7620 9\n7630 9\n7640 9\n7650 9\n7660 9\n7670 9\n7680 9\n7690 9\n7700 9\n7710 9\n7720 9\n7730 9\n7740 9\n7750 9\n7760 9\n7770 9\n7780 9\n7790 9\n7800 9\n7810 9\n7820 9\n7830 9\n7840 9\n7850 9\n7860 9\n7870 9\n7880 9\n7890 9\n7900 9\n7910 9\n7920 9\n7930 9\n7940 9\n7950 9\n7960 9\n7970 9\n7980 9\n7990 9\n8000 9\n8010 9\n8020 9\n8030 9\n8040 9\n8050 9\n8060 9\n8070 9\n8080 9\n8090 9\n8100 9\n8110 9\n8120 9\n8130 9\n8140 9\n8150 9\n8160 9\n8170 9\n8180 9\n8190 9\n8200 9\n8210 9\n8220 9\n8230 9\n8240 9\n8250 9\n8260 9\n8270 9\n8280 9\n8290 9\n8300 9\n8310 9\n8320 9\n8330 9\n8340 9\n8350 9\n8360 9\n8370 9\n8380 9\n8390 9\n8400 9\n8410 9\n8420 9\n8430 9\n8440 9\n8450 9\n8460 9\n8470 9\n8480 9\n8490 9\n8500 9\n8510 9\n8520 9\n8530 9\n8540 9\n8550 9\n8560 9\n8570 9\n8580 9\n8590 9\n8600 9\n8610 9\n8620 9\n8630 9\n8640 9\n8650 9\n8660 9\n8670 9\n8680 9\n8690 9\n8700 9\n8710 9\n8720 9\n8730 9\n8740 9\n8750 9\n8760 9\n8770 9\n8780 9\n8790 9\n8800 9\n8810 9\n8820 9\n8830 9\n8840 9\n8850 9\n8860 9\n8870 9\n8880 9\n8890 9\n8900 9\n8910 9\n8920 9\n8930 9\n8940 9\n8950 9\n8960 9\n8970 9\n8980 9\n8990 9\n9000 9\n9010 9\n9020 9\n9030 9\n9040 9\n9050 9\n9060 9\n9070 9\n9080 9\n9090 9\n9100 9\n9110 9\n9120 9\n9130 9\n9140 9\n9150 9\n9160 9\n9170 9\n9180 9\n9190 9\n9200 9\n9210 9\n9220 9\n9230 9\n9240 9\n9250 9\n9260 9\n9270 9\n9280 9\n9290 9\n9300 9\n9310 9\n9320 9\n9330 9\n9340 9\n9350 9\n9360 9\n9370 9\n9380 9\n9390 9\n9400 9\n9410 9\n9420 9\n9430 9\n9440 9\n9450 9\n9460 9\n9470 9\n9480 9\n9490 9\n9500 9\n9510 9\n9520 9\n9530 9\n9540 9\n9550 9\n9560 9\n9570 9\n9580 9\n9590 9\n9600 9\n9610 9\n9620 9\n9630 9\n9640 9\n9650 9\n9660 9\n9670 9\n9680 9\n9690 9\n9700 9\n9710 9\n9720 9\n9730 9\n9740 9\n9750 9\n9760 9\n9770 9\n9780 9\n9790 9\n9800 9\n9810 9\n9820 9\n9830 9\n9840 9\n9850 9\n9860 9\n9870 9\n9880 9\n9890 9\n9900 9\n9910 9\n9920 9\n9930 9\n9940 9\n9950 9\n9960 9\n9970 9\n9980 9\n9990 9",
        expected: "-1",
      },
    ],
    hints: [
      "Ask a different question first: with exactly k stops, how far can the truck possibly get?",
      "A dynamic programme over depots and stop counts answers that in O(n²). Can you avoid committing to stops in advance at all?",
      "Pretend the truck drives as far as its fuel allows, remembering every depot it passed. When it would run dry, it can 'retroactively' stop at one of them. Which one?",
      "Keep the passed depots' litres in a max-heap. Each time fuel falls short, pop the largest. If the heap is empty, the trip is impossible.",
    ],
    solutions: [
      {
        title: "Farthest reach for each number of stops",
        order: 1,
        intuition:
          "Let reach[k] be the farthest the truck can get using exactly k stops among the depots seen so far. Visiting depots in order, a depot at position p with L litres can be the (k+1)-th stop of any plan whose reach[k] ≥ p, giving reach[k+1] = max(reach[k+1], reach[k] + L). Updating k from high to low uses each depot at most once.",
        approach: [
          "reach[0] = startFuel, others 0.",
          "For each depot i, for k from i down to 0: if reach[k] ≥ position, reach[k+1] = max(reach[k+1], reach[k] + litres).",
          "Return the smallest k with reach[k] ≥ target, or -1.",
        ],
        code: {
          PYTHON: `def fewestDepotStops(target: int, startFuel: int, depots: List[List[int]]) -> int:
    n = len(depots)
    reach = [startFuel] + [0] * n
    for i, (position, litres) in enumerate(depots):
        for k in range(i, -1, -1):
            if reach[k] >= position:
                reach[k + 1] = max(reach[k + 1], reach[k] + litres)
    for k in range(n + 1):
        if reach[k] >= target:
            return k
    return -1`,
          JAVA: `class Solution {
    public int fewestDepotStops(int target, int startFuel, int[][] depots) {
        int n = depots.length;
        long[] reach = new long[n + 1];
        reach[0] = startFuel;
        for (int i = 0; i < n; i++) {
            for (int k = i; k >= 0; k--) {
                if (reach[k] >= depots[i][0]) reach[k + 1] = Math.max(reach[k + 1], reach[k] + depots[i][1]);
            }
        }
        for (int k = 0; k <= n; k++) if (reach[k] >= target) return k;
        return -1;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n)",
        edgeCases: ["Start fuel already enough — 0 stops."],
        commonMistakes: ["Updating k upward, which lets one depot be counted twice."],
      },
      {
        title: "Optimal: drive until dry, then refuel from the best passed depot",
        order: 2,
        intuition:
          "There is no need to decide at a depot whether to stop. Drive as far as the fuel reaches and keep every depot passed in a max-heap. When the fuel cannot reach the destination, one more stop is unavoidable, and the depot already passed with the most litres is the best one to have used — any stop extends the same range, and a bigger one extends it most. Repeat until the destination is in reach or no passed depots remain.",
        approach: [
          "Set fuel = startFuel (the farthest reachable position), stops = 0, i = 0, and an empty max-heap.",
          "While fuel < target: push the litres of every depot with position ≤ fuel.",
          "If the heap is empty, return -1.",
          "Pop the largest litres, add it to fuel, and count a stop.",
          "Return stops.",
        ],
        code: {
          PYTHON: `import heapq


def fewestDepotStops(target: int, startFuel: int, depots: List[List[int]]) -> int:
    passed = []  # max-heap (negated) of litres at depots within reach
    fuel = startFuel  # how far the truck can get right now
    stops = 0
    i = 0

    while fuel < target:
        while i < len(depots) and depots[i][0] <= fuel:
            heapq.heappush(passed, -depots[i][1])
            i += 1
        if not passed:
            return -1  # stranded: no depot within reach
        fuel += -heapq.heappop(passed)  # retroactively stop at the best one
        stops += 1

    return stops`,
          JAVA: `class Solution {
    public int fewestDepotStops(int target, int startFuel, int[][] depots) {
        PriorityQueue<Integer> passed = new PriorityQueue<>(Collections.reverseOrder());
        long fuel = startFuel;
        int stops = 0, i = 0;

        while (fuel < target) {
            while (i < depots.length && depots[i][0] <= fuel) {
                passed.offer(depots[i][1]);
                i++;
            }
            if (passed.isEmpty()) return -1;
            fuel += passed.poll();
            stops++;
        }
        return stops;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "No depots at all.",
          "Arriving at a depot with exactly zero fuel — it still counts as reachable.",
          "Depots beyond reach of every plan — return -1.",
        ],
        commonMistakes: [
          "Stopping at every depot that is reached, or at the nearest one, instead of the largest passed.",
          "Using strict < when deciding whether a depot is within reach.",
          "Overflowing a 32-bit fuel total in languages with fixed-width integers.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },
];
