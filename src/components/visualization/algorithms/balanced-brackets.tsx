import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";

type State = { text: string; at: number; stack: string[]; result: boolean | null };

const PAIRS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

/** A stack matching brackets: each closer must match the newest open one. */
export const balancedBracketsViz: Visualization<State, string> = {
  key: "balanced-brackets",
  title: "Stack: Balanced Brackets",
  description:
    "Push each opening bracket; each closing bracket must match the top of the stack. Last in, first out.",
  complexity: { time: "O(n)", space: "O(n)" },
  pseudocode: [
    "for each character c:",
    "    if c opens: push c",
    "    else if stack is empty or top does not match: return false",
    "    else: pop",
    "return stack is empty",
  ],
  defaultInput: "{[()]()}",
  inputHint: "Brackets only. Example: ([]{})",
  parseInput(raw) {
    const text = raw.trim();
    if (!/^[()[\]{}]{1,24}$/.test(text)) {
      return { ok: false, error: "Use 1 to 24 of these characters: ( ) [ ] { }" };
    }
    return { ok: true, value: text };
  },
  formatInput: (input) => input,

  buildFrames(text) {
    const frames: Frame<State>[] = [];
    const stack: string[] = [];
    const snap = (
      line: number,
      op: string,
      at: number,
      result: boolean | null = null
    ) =>
      frames.push(
        frame({ text, at, stack: [...stack], result }, line, op, {
          depth: stack.length,
        })
      );

    for (let i = 0; i < text.length; i++) {
      const c = text[i]!;
      const open = PAIRS[c];
      if (!open) {
        stack.push(c);
        snap(1, `${c} opens, so push it.`, i);
      } else if (stack[stack.length - 1] !== open) {
        snap(2, `${c} has no matching ${open} on top. Not balanced.`, i, false);
        return frames;
      } else {
        stack.pop();
        snap(3, `${c} matches the top, so pop it.`, i);
      }
    }
    const balanced = stack.length === 0;
    snap(
      4,
      balanced
        ? "The stack is empty. Balanced."
        : "Openers are left over. Not balanced.",
      text.length,
      balanced
    );
    return frames;
  },

  render({ state }) {
    return (
      <div className="space-y-4">
        <CellRow>
          {[...state.text].map((c, i) => (
            <Cell
              key={i}
              index={i}
              value={c}
              tone={i === state.at ? "compare" : i < state.at ? "visited" : "idle"}
            />
          ))}
        </CellRow>
        <div>
          <p className="mb-1 label-mono">Stack, top on the right</p>
          <CellRow>
            {state.stack.length === 0 ? (
              <span className="text-sm text-muted-foreground">Empty</span>
            ) : (
              state.stack.map((c, i) => (
                <Cell
                  key={i}
                  value={c}
                  showIndex={false}
                  tone={i === state.stack.length - 1 ? "active" : "idle"}
                  label={i === state.stack.length - 1 ? "top" : undefined}
                />
              ))
            )}
          </CellRow>
        </div>
        {state.result !== null && (
          <p
            className={
              state.result ? "text-sm text-success" : "text-sm text-destructive"
            }
          >
            {state.result ? "Balanced" : "Not balanced"}
          </p>
        )}
      </div>
    );
  },
};
