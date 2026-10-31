import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";
import { formatNumbers, parseNumbers } from "./input";
import { TreeView, type TreeNode } from "./tree-view";

type State = { heap: number[]; active: number | null; other: number | null };

function heapNodes(heap: readonly number[]): TreeNode[] {
  return heap.map((value, i) => {
    const depth = Math.floor(Math.log2(i + 1));
    const row = 2 ** depth;
    return {
      id: i,
      label: String(value),
      x: ((i + 1 - row + 0.5) / row) * 100,
      depth,
      parent: i === 0 ? null : Math.floor((i - 1) / 2),
    };
  });
}

/** A binary min-heap: an array that is also a tree, kept in order by sifting. */
export const minHeapViz: Visualization<State, number[]> = {
  key: "min-heap",
  title: "Min-Heap: Push and Pop",
  description:
    "Push each value and sift it up, then pop the minimum and sift the replacement down. The array and the tree are the same data.",
  complexity: { time: "O(log n) per operation", space: "O(n)" },
  pseudocode: [
    "push: append value",
    "    while value < parent: swap with parent",
    "pop: take the root, move the last value to the root",
    "    while value > smaller child: swap with that child",
  ],
  defaultInput: [9, 4, 7, 1, 8, 2],
  inputHint: "Numbers to push. Example: 5 3 8 1",
  parseInput: (raw) => parseNumbers(raw, 15),
  formatInput: formatNumbers,

  buildFrames(input) {
    const heap: number[] = [];
    const popped: number[] = [];
    const frames: Frame<State>[] = [];
    const snap = (
      line: number,
      op: string,
      active: number | null,
      other: number | null = null
    ) =>
      frames.push(
        frame({ heap: [...heap], active, other }, line, op, {
          size: heap.length,
          popped: popped.join(" ") || "—",
        })
      );

    for (const value of input) {
      heap.push(value);
      let i = heap.length - 1;
      snap(0, `Push ${value} at the end.`, i);
      while (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        if (heap[i]! >= heap[parent]!) break;
        snap(1, `${heap[i]} < ${heap[parent]}, so swap with its parent.`, i, parent);
        [heap[i], heap[parent]] = [heap[parent]!, heap[i]!];
        i = parent;
        snap(1, "Moved up.", i);
      }
    }

    while (heap.length > 0) {
      const min = heap[0]!;
      const last = heap.pop()!;
      popped.push(min);
      if (heap.length === 0) {
        snap(2, `Pop ${min}. The heap is empty.`, null);
        break;
      }
      heap[0] = last;
      snap(2, `Pop ${min}, then move ${last} to the root.`, 0);
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < heap.length && heap[l]! < heap[smallest]!) smallest = l;
        if (r < heap.length && heap[r]! < heap[smallest]!) smallest = r;
        if (smallest === i) break;
        snap(
          3,
          `${heap[i]} > ${heap[smallest]}, so swap with the smaller child.`,
          i,
          smallest
        );
        [heap[i], heap[smallest]] = [heap[smallest]!, heap[i]!];
        i = smallest;
      }
    }
    return frames;
  },

  render({ state }) {
    return (
      <div className="space-y-4">
        <TreeView
          nodes={heapNodes(state.heap)}
          active={state.active}
          visited={state.other === null ? [] : [state.other]}
        />
        <CellRow>
          {state.heap.map((value, i) => (
            <Cell
              key={i}
              index={i}
              value={value}
              tone={
                i === state.active ? "compare" : i === state.other ? "active" : "idle"
              }
            />
          ))}
        </CellRow>
      </div>
    );
  },
};
