import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";

type State = {
  values: number[];
  lo: number;
  hi: number;
  mid: number | null;
  discardedLeft: number;
  discardedRight: number;
  foundAt: number | null;
};

type Input = { values: number[]; target: number };

/**
 * Binary search, drawn as a shrinking interval.
 *
 * Discarded halves stay on screen greyed out rather than disappearing, so
 * the reader can see how much of the space each step eliminates — which is
 * the entire point of the algorithm.
 */
export const binarySearchViz: Visualization<State, Input> = {
  key: "binary-search",
  title: "Binary Search",
  description:
    "Locate a value in a sorted array by halving the interval. Each comparison discards half of what remains, so a million elements take about twenty steps.",
  complexity: { time: "O(log n)", space: "O(1)" },
  pseudocode: [
    "lo = 0, hi = n - 1",
    "while lo <= hi:",
    "    mid = lo + (hi - lo) // 2",
    "    if values[mid] == target: return mid",
    "    if values[mid] < target: lo = mid + 1",
    "    else: hi = mid - 1",
    "return -1",
  ],
  defaultInput: { values: [1, 3, 5, 8, 12, 16, 21, 27, 34, 40], target: 21 },
  inputHint: "Sorted values, then the target. Example: 1 3 5 8 12 / 8",

  parseInput(raw) {
    const [valuePart, targetPart] = raw.split("/");
    const values = (valuePart ?? "")
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);

    if (values.length < 1 || values.some((v) => !Number.isFinite(v))) {
      return { ok: false, error: "Enter some numbers before the slash." };
    }
    if (values.length > 20) {
      return { ok: false, error: "Keep it to 20 values so the row stays readable." };
    }
    const target = Number((targetPart ?? "").trim());
    if (!Number.isFinite(target)) {
      return { ok: false, error: "Enter a target number after the slash." };
    }
    return { ok: true, value: { values: [...values].sort((a, b) => a - b), target } };
  },

  formatInput: (input) => `${input.values.join(" ")} / ${input.target}`,

  buildFrames({ values, target }) {
    const frames: Frame<State>[] = [];
    let lo = 0;
    let hi = values.length - 1;
    let discardedLeft = 0;
    let discardedRight = 0;

    const snapshot = (
      line: number,
      operation: string,
      mid: number | null,
      foundAt: number | null = null
    ) =>
      frames.push(
        frame(
          { values, lo, hi, mid, discardedLeft, discardedRight, foundAt },
          line,
          operation,
          {
            lo,
            hi,
            mid: mid ?? "—",
            remaining: Math.max(0, hi - lo + 1),
            target,
          }
        )
      );

    snapshot(0, `Search the whole array for ${target}.`, null);

    while (lo <= hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      snapshot(2, `Midpoint is index ${mid}, holding ${values[mid]}.`, mid);

      if (values[mid] === target) {
        snapshot(3, `Found ${target} at index ${mid}.`, mid, mid);
        return frames;
      }

      if (values[mid]! < target) {
        snapshot(
          4,
          `${values[mid]} is below ${target}, so everything up to index ${mid} is too small — discard it.`,
          mid
        );
        discardedLeft = mid + 1;
        lo = mid + 1;
      } else {
        snapshot(
          5,
          `${values[mid]} is above ${target}, so everything from index ${mid} up is too large — discard it.`,
          mid
        );
        discardedRight = values.length - mid;
        hi = mid - 1;
      }
    }

    snapshot(6, `${target} is not in the array.`, null);
    return frames;
  },

  render(frameData) {
    const { values, lo, hi, mid, discardedLeft, discardedRight, foundAt } =
      frameData.state;

    return (
      <CellRow>
        {values.map((value, index) => {
          const discarded =
            index < discardedLeft || index >= values.length - discardedRight;
          const inRange = index >= lo && index <= hi;

          const tone =
            foundAt === index
              ? "done"
              : index === mid
                ? "compare"
                : discarded
                  ? "excluded"
                  : inRange
                    ? "active"
                    : "idle";

          const label =
            index === mid
              ? "mid"
              : index === lo && inRange
                ? "lo"
                : index === hi && inRange
                  ? "hi"
                  : undefined;

          return (
            <Cell key={index} value={value} index={index} tone={tone} label={label} />
          );
        })}
      </CellRow>
    );
  },
};
