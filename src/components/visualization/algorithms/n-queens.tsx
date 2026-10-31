import { cn } from "@/lib/utils";

import { frame, type Frame, type Visualization } from "../types";

type State = {
  n: number;
  queens: number[];
  trying: { row: number; col: number } | null;
  conflict: boolean;
  solved: boolean;
};

/** Backtracking on N-Queens: place, recurse, and undo when a row has no safe square. */
export const nQueensViz: Visualization<State, number> = {
  key: "n-queens",
  title: "Backtracking: N-Queens",
  description:
    "Place one queen per row. When a row has no safe square, undo the last choice and try the next. Recursion is what remembers where to resume.",
  complexity: { time: "O(n!) in the worst case", space: "O(n)" },
  pseudocode: [
    "place(row):",
    "    if row == n: a solution is found",
    "    for each column in row:",
    "        if safe: put a queen, place(row + 1)",
    "        if that failed: remove the queen (backtrack)",
  ],
  defaultInput: 5,
  inputHint: "Board size, from 4 to 6.",
  parseInput(raw) {
    const n = Number(raw.trim());
    if (!Number.isInteger(n) || n < 4 || n > 6) {
      return { ok: false, error: "Choose a board size from 4 to 6." };
    }
    return { ok: true, value: n };
  },
  formatInput: (n) => String(n),

  buildFrames(n) {
    const frames: Frame<State>[] = [];
    const queens: number[] = [];
    let backtracks = 0;
    const snap = (
      line: number,
      op: string,
      trying: State["trying"],
      conflict = false,
      solved = false
    ) =>
      frames.push(
        frame({ n, queens: [...queens], trying, conflict, solved }, line, op, {
          placed: queens.length,
          backtracks,
        })
      );
    const safe = (row: number, col: number) =>
      queens.every((c, r) => c !== col && Math.abs(c - col) !== row - r);

    const place = (row: number): boolean => {
      if (row === n) {
        snap(1, "Every row has a queen. Solved.", null, false, true);
        return true;
      }
      for (let col = 0; col < n; col++) {
        if (!safe(row, col)) {
          snap(2, `Row ${row + 1}, column ${col + 1} is attacked.`, { row, col }, true);
          continue;
        }
        queens.push(col);
        snap(3, `Put a queen at row ${row + 1}, column ${col + 1}.`, { row, col });
        if (place(row + 1)) return true;
        queens.pop();
        backtracks += 1;
        snap(
          4,
          `Row ${row + 2} has no safe square. Take back row ${row + 1}.`,
          { row, col },
          true
        );
      }
      return false;
    };
    place(0);
    return frames;
  },

  render({ state }) {
    return (
      <div
        role="img"
        aria-label={`${state.n} by ${state.n} board with ${state.queens.length} queens`}
        className="mx-auto grid max-w-xs gap-px rounded-md border border-border bg-border"
        style={{ gridTemplateColumns: `repeat(${state.n}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: state.n * state.n }, (_, i) => {
          const row = Math.floor(i / state.n);
          const col = i % state.n;
          const queen = state.queens[row] === col;
          const trying = state.trying?.row === row && state.trying.col === col;
          return (
            <div
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center font-mono text-sm",
                (row + col) % 2 === 0 ? "bg-card" : "bg-muted/60",
                trying && state.conflict && "bg-destructive/20",
                trying && !state.conflict && "bg-brand-500/20",
                state.solved && queen && "bg-success/20"
              )}
            >
              {queen ? "Q" : ""}
            </div>
          );
        })}
      </div>
    );
  },
};
