import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";
import { formatNumbers, parseNumbers } from "./input";

type State = {
  values: number[];
  sortedUpTo: number;
  comparing: number | null;
  key: number | null;
};

/** Insertion sort: the sorted prefix grows by one each pass. */
export const insertionSortViz: Visualization<State, number[]> = {
  key: "insertion-sort",
  title: "Insertion Sort",
  description:
    "Grow a sorted prefix by sliding each new value left until it fits. Fast on nearly sorted data.",
  complexity: { time: "O(n²), O(n) if nearly sorted", space: "O(1)" },
  pseudocode: [
    "for i from 1 to n - 1:",
    "    key = values[i]; j = i - 1",
    "    while j >= 0 and values[j] > key:",
    "        values[j + 1] = values[j]; j -= 1",
    "    values[j + 1] = key",
  ],
  defaultInput: [7, 3, 9, 1, 6, 2, 8],
  inputHint: "Numbers separated by spaces. Example: 5 2 9 1",
  parseInput: (raw) => parseNumbers(raw, 16),
  formatInput: formatNumbers,

  buildFrames(input) {
    const values = [...input];
    const frames: Frame<State>[] = [];
    const snap = (
      line: number,
      op: string,
      sortedUpTo: number,
      comparing: number | null,
      key: number | null
    ) =>
      frames.push(
        frame({ values: [...values], sortedUpTo, comparing, key }, line, op, {
          key: key ?? "—",
          i: sortedUpTo,
        })
      );

    for (let i = 1; i < values.length; i++) {
      const key = values[i]!;
      let j = i - 1;
      snap(1, `Take ${key} and find its place in the sorted prefix.`, i, i, key);
      while (j >= 0 && values[j]! > key) {
        snap(2, `${values[j]} > ${key}, so it moves right.`, i, j, key);
        values[j + 1] = values[j]!;
        j -= 1;
        snap(3, "Shift one place right.", i, j + 1, key);
      }
      values[j + 1] = key;
      snap(4, `${key} goes at index ${j + 1}.`, i + 1, j + 1, null);
    }
    if (frames.length === 0) snap(0, "Nothing to sort.", values.length, null, null);
    return frames;
  },

  render({ state }) {
    return (
      <CellRow>
        {state.values.map((value, i) => (
          <Cell
            key={i}
            index={i}
            value={value}
            tone={
              i === state.comparing ? "compare" : i < state.sortedUpTo ? "done" : "idle"
            }
            label={i === state.comparing ? "j" : undefined}
          />
        ))}
      </CellRow>
    );
  },
};
