import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";

type State = {
  values: string[];
  left: number;
  right: number;
  shrinking: boolean;
  best: { start: number; length: number };
};

type Input = { text: string };

/**
 * Variable-size sliding window: the longest run of distinct characters.
 *
 * Shrink steps get their own frames and their own colour, because the two
 * phases — grow and restore validity — are what people conflate.
 */
export const slidingWindowViz: Visualization<State, Input> = {
  key: "sliding-window",
  title: "Sliding Window",
  description:
    "Find the longest stretch with no repeated character. The right edge grows the window; the left edge only moves to restore validity. Neither ever moves backwards.",
  complexity: { time: "O(n)", space: "O(k)" },
  pseudocode: [
    "left = 0, best = 0",
    "for right in range(n):",
    "    while text[right] in window:",
    "        remove text[left]; left += 1",
    "    add text[right]",
    "    best = max(best, right - left + 1)",
    "return best",
  ],
  defaultInput: { text: "abcabcbb" },
  inputHint: "A short string. Example: abcabcbb",

  parseInput(raw) {
    const text = raw.trim();
    if (!text) return { ok: false, error: "Enter a string." };
    if (text.length > 18) {
      return { ok: false, error: "Keep it to 18 characters so the row stays readable." };
    }
    return { ok: true, value: { text } };
  },

  formatInput: (input) => input.text,

  buildFrames({ text }) {
    const values = [...text];
    const frames: Frame<State>[] = [];
    const window = new Set<string>();
    let left = 0;
    let best = { start: 0, length: 0 };

    const snapshot = (line: number, operation: string, right: number, shrinking = false) =>
      frames.push(
        frame(
          { values, left, right, shrinking, best: { ...best } },
          line,
          operation,
          {
            left,
            right,
            width: Math.max(0, right - left + 1),
            best: best.length,
            window: [...window].join(""),
          }
        )
      );

    for (let right = 0; right < values.length; right += 1) {
      const char = values[right]!;

      while (window.has(char)) {
        snapshot(
          3,
          `"${char}" is already in the window. Drop "${values[left]}" from the left.`,
          right,
          true
        );
        window.delete(values[left]!);
        left += 1;
      }

      window.add(char);
      snapshot(4, `Add "${char}" on the right.`, right);

      const width = right - left + 1;
      if (width > best.length) {
        best = { start: left, length: width };
        snapshot(5, `Window is ${width} wide — a new best.`, right);
      }
    }

    frames.push(
      frame(
        { values, left, right: values.length - 1, shrinking: false, best: { ...best } },
        6,
        `Longest stretch with no repeats: ${best.length}.`,
        { best: best.length }
      )
    );

    return frames;
  },

  render(frameData) {
    const { values, left, right, shrinking, best } = frameData.state;

    return (
      <CellRow>
        {values.map((value, index) => {
          const inWindow = index >= left && index <= right;
          const inBest =
            !inWindow && index >= best.start && index < best.start + best.length;

          return (
            <Cell
              key={index}
              value={value}
              index={index}
              tone={
                inWindow ? (shrinking ? "pivot" : "active") : inBest ? "done" : "idle"
              }
              label={
                index === left && index === right
                  ? "L R"
                  : index === left
                    ? "L"
                    : index === right
                      ? "R"
                      : undefined
              }
            />
          );
        })}
      </CellRow>
    );
  },
};
