import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";

type Operation = number | "dequeue";
type State = {
  slots: (number | null)[];
  head: number;
  tail: number;
  active: number | null;
  removed: number[];
};

const CAPACITY = 5;
const MAX_OPERATIONS = 16;

/** A queue in a fixed array: both ends move forward and wrap, so nothing shifts. */
export const queueViz: Visualization<State, Operation[]> = {
  key: "circular-queue",
  title: "Queue in a Circular Array",
  description:
    "First in, first out. Head and tail only move forward and wrap around, so both ends cost O(1) and no value is ever moved.",
  complexity: { time: "O(1) per operation", space: "O(capacity)" },
  pseudocode: [
    "enqueue(x): if size == capacity, refuse",
    "    slots[tail] = x; tail = (tail + 1) % capacity; size += 1",
    "dequeue(): if size == 0, refuse",
    "    x = slots[head]; head = (head + 1) % capacity; size -= 1",
  ],
  defaultInput: [4, 7, 1, "dequeue", 9, 2, 6, 8, "dequeue", "dequeue", 3],
  inputHint: `Numbers enqueue and "d" dequeues. The array holds ${CAPACITY}. Example: 4 7 d 9`,
  parseInput(raw) {
    const tokens = raw
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (tokens.length === 0 || tokens.length > MAX_OPERATIONS) {
      return { ok: false, error: `Enter 1 to ${MAX_OPERATIONS} operations.` };
    }
    const value: Operation[] = [];
    for (const token of tokens) {
      if (token.toLowerCase() === "d") value.push("dequeue");
      else if (Number.isFinite(Number(token))) value.push(Number(token));
      else return { ok: false, error: `Could not read "${token}". Use a number or d.` };
    }
    return { ok: true, value };
  },
  formatInput: (input) =>
    input.map((op) => (op === "dequeue" ? "d" : String(op))).join(" "),

  buildFrames(input) {
    const slots: (number | null)[] = Array(CAPACITY).fill(null);
    const removed: number[] = [];
    let head = 0;
    let tail = 0;
    let size = 0;
    const frames: Frame<State>[] = [];
    const snap = (line: number, operation: string, active: number | null) =>
      frames.push(
        frame(
          { slots: [...slots], head, tail, active, removed: [...removed] },
          line,
          operation,
          { head, tail, size }
        )
      );

    snap(0, `An empty queue with room for ${CAPACITY}.`, null);
    for (const op of input) {
      if (op === "dequeue") {
        if (size === 0) {
          snap(2, "The queue is empty, so there is nothing to remove.", null);
          continue;
        }
        const taken = head;
        const value = slots[taken]!;
        slots[taken] = null;
        removed.push(value);
        head = (head + 1) % CAPACITY;
        size -= 1;
        snap(3, `Remove ${value}, the oldest value, and move head to ${head}.`, taken);
      } else {
        if (size === CAPACITY) {
          snap(0, `The array is full, so ${op} is refused.`, null);
          continue;
        }
        const placed = tail;
        slots[placed] = op;
        tail = (tail + 1) % CAPACITY;
        size += 1;
        snap(1, `Put ${op} in slot ${placed} and move tail to ${tail}.`, placed);
      }
    }
    return frames;
  },

  render({ state }) {
    return (
      <div className="space-y-4">
        <CellRow>
          {state.slots.map((value, index) => {
            const marks = [
              index === state.head ? "head" : null,
              index === state.tail ? "tail" : null,
            ].filter(Boolean);
            return (
              <Cell
                key={index}
                index={index}
                value={value ?? "·"}
                label={marks.join(" ") || undefined}
                tone={
                  index === state.active
                    ? "active"
                    : value === null
                      ? "excluded"
                      : "idle"
                }
              />
            );
          })}
        </CellRow>
        <p className="font-mono text-xs text-muted-foreground">
          Removed, in order: {state.removed.join(" ") || "nothing yet"}
        </p>
      </div>
    );
  },
};
