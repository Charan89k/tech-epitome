import { cn } from "@/lib/utils";

import { frame, type Frame, type Visualization } from "../types";

type Input = { a: string; b: string };
type State = {
  a: string;
  b: string;
  table: number[][];
  i: number;
  j: number;
  match: boolean;
};

/** Dynamic programming: each cell reuses answers to smaller subproblems. */
export const lcsViz: Visualization<State, Input> = {
  key: "longest-common-subsequence",
  title: "Dynamic Programming: LCS",
  description:
    "Fill a table where each cell is the answer for two prefixes. Each one reuses cells already computed, so nothing is solved twice.",
  complexity: { time: "O(n × m)", space: "O(n × m)" },
  pseudocode: [
    "table = (n + 1) by (m + 1) zeros",
    "for each i, j:",
    "    if a[i] == b[j]: table[i+1][j+1] = table[i][j] + 1",
    "    else: table[i+1][j+1] = max(left, above)",
    "return table[n][m]",
  ],
  defaultInput: { a: "ABCBDA", b: "BDCABA" },
  inputHint: "Two words separated by a space. Example: STONE LONGEST",
  parseInput(raw) {
    const parts = raw.trim().split(/\s+/);
    if (parts.length !== 2 || parts.some((p) => !/^[A-Za-z0-9]{1,10}$/.test(p))) {
      return { ok: false, error: "Enter two words of up to 10 letters or digits." };
    }
    return { ok: true, value: { a: parts[0]!, b: parts[1]! } };
  },
  formatInput: ({ a, b }) => `${a} ${b}`,

  buildFrames({ a, b }) {
    const table = Array.from({ length: a.length + 1 }, () =>
      new Array<number>(b.length + 1).fill(0)
    );
    const frames: Frame<State>[] = [];
    const snap = (line: number, op: string, i: number, j: number, match: boolean) =>
      frames.push(
        frame({ a, b, table: table.map((r) => [...r]), i, j, match }, line, op, {
          best: table[a.length]![b.length]!,
        })
      );

    snap(
      0,
      "Start from a table of zeros: an empty prefix shares nothing.",
      0,
      0,
      false
    );
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        const match = a[i] === b[j];
        table[i + 1]![j + 1] = match
          ? table[i]![j]! + 1
          : Math.max(table[i]![j + 1]!, table[i + 1]![j]!);
        snap(
          match ? 2 : 3,
          match
            ? `${a[i]} matches, so extend the diagonal to ${table[i + 1]![j + 1]}.`
            : `${a[i]} and ${b[j]} differ, so take the better of left and above: ${table[i + 1]![j + 1]}.`,
          i + 1,
          j + 1,
          match
        );
      }
    }
    snap(
      4,
      `The longest common subsequence has length ${table[a.length]![b.length]}.`,
      a.length,
      b.length,
      false
    );
    return frames;
  },

  render({ state }) {
    return (
      <div className="overflow-x-auto">
        <table className="mx-auto border-separate border-spacing-0.5 font-mono text-xs">
          <caption className="sr-only">Longest common subsequence table</caption>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col" />
              {[...state.b].map((c, j) => (
                <th
                  key={j}
                  scope="col"
                  className="px-2 py-1 font-normal text-muted-foreground"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.table.map((row, i) => (
              <tr key={i}>
                <th scope="row" className="px-2 font-normal text-muted-foreground">
                  {i === 0 ? "" : state.a[i - 1]}
                </th>
                {row.map((value, j) => {
                  const current = i === state.i && j === state.j;
                  const source =
                    (i === state.i - 1 && j === state.j - 1 && state.match) ||
                    (!state.match &&
                      ((i === state.i - 1 && j === state.j) ||
                        (i === state.i && j === state.j - 1)));
                  return (
                    <td
                      key={j}
                      className={cn(
                        "size-7 rounded-sm border border-border text-center",
                        current && "border-viz-compare/60 bg-viz-compare/15",
                        !current && source && "border-brand-500/50 bg-brand-500/10"
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};
