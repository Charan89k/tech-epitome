import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";

type State = {
  values: number[];
  left: number;
  right: number;
  /** Indices already eliminated by an earlier comparison. */
  excluded: number[];
  found: [number, number] | null;
};

type Input = { values: number[]; target: number };

/**
 * Opposite-direction two pointers on a sorted array.
 *
 * The teaching point is elimination: every frame records which index was
 * just ruled out and why, because "move the smaller one" is a rule people
 * memorise without understanding.
 */
export const twoPointersViz: Visualization<State, Input> = {
  key: "two-pointers",
  title: "Two Pointers",
  description:
    "Find a pair summing to a target in a sorted array. Each comparison eliminates one endpoint permanently, which is why a single pass suffices.",
  complexity: { time: "O(n)", space: "O(1)" },
  pseudocode: [
    "left = 0, right = n - 1",
    "while left < right:",
    "    total = values[left] + values[right]",
    "    if total == target: return [left, right]",
    "    if total < target: left += 1   # left can never reach the target",
    "    else: right -= 1               # right is too large for any partner",
    "return not found",
  ],
  defaultInput: { values: [2, 4, 7, 11, 15, 20], target: 22 },
  inputHint: "Sorted values, then the target. Example: 2 4 7 11 15 20 / 22",

  parseInput(raw) {
    const [valuePart, targetPart] = raw.split("/");
    const values = (valuePart ?? "")
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);

    if (values.length < 2 || values.some((v) => !Number.isFinite(v))) {
      return { ok: false, error: "Enter at least two numbers before the slash." };
    }
    if (values.length > 16) {
      return { ok: false, error: "Keep it to 16 values so the row stays readable." };
    }
    const target = Number((targetPart ?? "").trim());
    if (!Number.isFinite(target)) {
      return { ok: false, error: "Enter a target number after the slash." };
    }
    // The elimination argument only holds on sorted input, so sort rather
    // than silently producing a wrong trace.
    return { ok: true, value: { values: [...values].sort((a, b) => a - b), target } };
  },

  formatInput: (input) => `${input.values.join(" ")} / ${input.target}`,

  buildFrames({ values, target }) {
    const frames: Frame<State>[] = [];
    const excluded: number[] = [];
    let left = 0;
    let right = values.length - 1;

    const snapshot = (line: number, operation: string, found: [number, number] | null = null) =>
      frames.push(
        frame(
          { values, left, right, excluded: [...excluded], found },
          line,
          operation,
          {
            left,
            right,
            sum: (values[left] ?? 0) + (values[right] ?? 0),
            target,
          }
        )
      );

    snapshot(0, "Start with one pointer at each end.");

    while (left < right) {
      const total = values[left]! + values[right]!;
      snapshot(2, `Sum of ${values[left]} and ${values[right]} is ${total}.`);

      if (total === target) {
        snapshot(3, `Found: ${values[left]} + ${values[right]} = ${target}.`, [left, right]);
        return frames;
      }

      if (total < target) {
        snapshot(
          4,
          `${total} is below ${target}. ${values[left]} is already paired with the largest value left, so it can never work — eliminate it.`
        );
        excluded.push(left);
        left += 1;
      } else {
        snapshot(
          5,
          `${total} is above ${target}. ${values[right]} is too large for any remaining partner — eliminate it.`
        );
        excluded.push(right);
        right -= 1;
      }
    }

    snapshot(6, "The pointers met without finding a pair.");
    return frames;
  },

  render(frameData) {
    const { values, left, right, excluded, found } = frameData.state;
    const excludedSet = new Set(excluded);

    return (
      <CellRow>
        {values.map((value, index) => {
          const isFound = found ? index === found[0] || index === found[1] : false;
          const tone = isFound
            ? "done"
            : excludedSet.has(index)
              ? "excluded"
              : index === left || index === right
                ? "active"
                : "idle";

          const label =
            index === left && index === right
              ? "L R"
              : index === left
                ? "L"
                : index === right
                  ? "R"
                  : undefined;

          return (
            <Cell
              key={index}
              value={value}
              index={index}
              tone={tone}
              label={label}
            />
          );
        })}
      </CellRow>
    );
  },
};
