import { frame, type Frame, type Visualization } from "../types";
import { cn } from "@/lib/utils";

type Node = { value: number; next: number | null };

type State = {
  nodes: Node[];
  prev: number | null;
  current: number | null;
  next: number | null;
};

type Input = { values: number[] };

/**
 * Iterative linked-list reversal.
 *
 * Nodes are drawn in their original left-to-right order and the arrows are
 * redrawn as pointers change, so the reader watches the links flip rather
 * than watching boxes slide around. That is the actual mutation.
 */
export const linkedListReversalViz: Visualization<State, Input> = {
  key: "linked-list-reversal",
  title: "Linked List Reversal",
  description:
    "Reverse a singly linked list by reassigning one pointer at a time. The whole difficulty is that overwriting next destroys your route to the rest of the list, so it must be saved first.",
  complexity: { time: "O(n)", space: "O(1)" },
  pseudocode: [
    "prev = null, node = head",
    "while node is not None:",
    "    nxt = node.next        # save before overwriting",
    "    node.next = prev       # flip the link",
    "    prev = node",
    "    node = nxt",
    "return prev                # the new head",
  ],
  defaultInput: { values: [1, 2, 3, 4] },
  inputHint: "A few values. Example: 1 2 3 4",

  parseInput(raw) {
    const values = raw
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (values.length < 1 || values.some((v) => !Number.isFinite(v))) {
      return { ok: false, error: "Enter at least one number." };
    }
    if (values.length > 7) {
      return { ok: false, error: "Keep it to 7 nodes so the arrows stay legible." };
    }
    return { ok: true, value: { values } };
  },

  formatInput: (input) => input.values.join(" "),

  buildFrames({ values }) {
    const nodes: Node[] = values.map((value, index) => ({
      value,
      next: index + 1 < values.length ? index + 1 : null,
    }));

    const frames: Frame<State>[] = [];
    let prev: number | null = null;
    let current: number | null = values.length > 0 ? 0 : null;
    let next: number | null = null;

    const snapshot = (line: number, operation: string) =>
      frames.push(
        frame(
          { nodes: nodes.map((n) => ({ ...n })), prev, current, next },
          line,
          operation,
          {
            prev: prev === null ? "null" : String(values[prev]),
            node: current === null ? "null" : String(values[current]),
            nxt: next === null ? "null" : String(values[next]),
          }
        )
      );

    snapshot(0, "prev starts as null; node starts at the head.");

    while (current !== null) {
      next = nodes[current]!.next;
      snapshot(2, `Save the rest of the list (${next === null ? "null" : values[next]}) before overwriting.`);

      nodes[current]!.next = prev;
      snapshot(3, `Point ${values[current]} back at ${prev === null ? "null" : values[prev]}.`);

      prev = current;
      current = next;
      snapshot(5, `Advance: prev is now ${values[prev]}, node is ${current === null ? "null" : values[current]}.`);
    }

    next = null;
    snapshot(6, `node is null, so prev (${prev === null ? "null" : values[prev]}) is the new head.`);
    return frames;
  },

  render(frameData) {
    const { nodes, prev, current, next } = frameData.state;

    return (
      <div className="space-y-4 overflow-x-auto pb-2">
        <div className="flex items-center gap-1">
          {nodes.map((node, index) => {
            const role =
              index === current
                ? "node"
                : index === prev
                  ? "prev"
                  : index === next
                    ? "nxt"
                    : null;

            return (
              <div key={index} className="flex shrink-0 flex-col items-center gap-1.5">
                <div className="flex h-3.5 items-end">
                  {role && (
                    <span className="text-ember-400 font-mono text-[0.6rem] leading-none">
                      {role}
                    </span>
                  )}
                </div>

                <div className="flex items-center">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-md border font-mono text-sm transition-colors",
                      index === current
                        ? "border-ember-500/55 bg-ember-500/15 text-ember-200"
                        : index === prev
                          ? "border-success/50 bg-success/12 text-success"
                          : index === next
                            ? "border-viz-compare/50 bg-viz-compare/12 text-viz-compare"
                            : "border-border bg-muted/30 text-muted-foreground"
                    )}
                  >
                    {node.value}
                  </div>

                  {/* The arrow between this node and the next drawn position. */}
                  <Arrow
                    direction={
                      node.next === index + 1
                        ? "right"
                        : node.next === index - 1
                          ? "left"
                          : node.next === null
                            ? "null"
                            : "other"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
};

function Arrow({ direction }: { direction: "right" | "left" | "null" | "other" }) {
  if (direction === "null") {
    return (
      <span className="text-muted-foreground/50 px-1.5 font-mono text-[0.65rem]">
        ∅
      </span>
    );
  }

  return (
    <span
      className={cn(
        "px-1.5 font-mono text-sm",
        direction === "left" ? "text-ember-400" : "text-muted-foreground/60"
      )}
      aria-label={direction === "left" ? "points backwards" : "points forwards"}
    >
      {direction === "left" ? "←" : direction === "right" ? "→" : "↷"}
    </span>
  );
}
