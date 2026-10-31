import { frame, type Frame, type Visualization } from "../types";
import { formatNumbers, parseNumbers } from "./input";
import { TreeView, type TreeNode } from "./tree-view";

type State = { nodes: TreeNode[]; active: number | null; path: number[] };

type Bst = { value: number; left: Bst | null; right: Bst | null; id: number };

/** Positions come from in-order rank, so the drawing reads left to right in sorted order. */
function layout(root: Bst | null): TreeNode[] {
  const ordered: { node: Bst; depth: number; parent: number | null }[] = [];
  const walk = (n: Bst | null, depth: number, parent: number | null) => {
    if (!n) return;
    walk(n.left, depth + 1, n.id);
    ordered.push({ node: n, depth, parent });
    walk(n.right, depth + 1, n.id);
  };
  walk(root, 0, null);
  return ordered.map(({ node, depth, parent }, i) => ({
    id: node.id,
    label: String(node.value),
    x: ((i + 1) / (ordered.length + 1)) * 100,
    depth,
    parent,
  }));
}

/** Binary search tree insertion: each comparison discards a whole subtree. */
export const bstInsertViz: Visualization<State, number[]> = {
  key: "bst-insert",
  title: "Binary Search Tree Insert",
  description:
    "Walk down from the root, going left for smaller and right for larger, until there is an empty spot.",
  complexity: { time: "O(h), where h is the height", space: "O(h)" },
  pseudocode: [
    "for each value:",
    "    node = root",
    "    while node exists:",
    "        go left if value < node, else right",
    "    attach value at the empty spot",
  ],
  defaultInput: [50, 30, 70, 20, 40, 60, 80],
  inputHint: "Numbers to insert, in order. Duplicates are skipped. Example: 8 3 10 1",
  parseInput: (raw) => parseNumbers(raw, 15),
  formatInput: formatNumbers,

  buildFrames(input) {
    const frames: Frame<State>[] = [];
    let root: Bst | null = null;
    let nextId = 0;
    const snap = (
      line: number,
      op: string,
      active: number | null,
      path: number[],
      value: number
    ) =>
      frames.push(
        frame({ nodes: layout(root), active, path: [...path] }, line, op, {
          inserting: value,
          nodes: nextId,
        })
      );

    for (const value of input) {
      if (!root) {
        root = { value, left: null, right: null, id: nextId++ };
        snap(4, `The tree is empty, so ${value} becomes the root.`, root.id, [], value);
        continue;
      }
      const path: number[] = [];
      let node: Bst = root;
      for (;;) {
        path.push(node.id);
        snap(3, `Compare ${value} with ${node.value}.`, node.id, path, value);
        if (value === node.value) {
          snap(2, `${value} is already here, so skip it.`, node.id, path, value);
          break;
        }
        const side: "left" | "right" = value < node.value ? "left" : "right";
        const child: Bst | null = node[side];
        if (!child) {
          const added: Bst = { value, left: null, right: null, id: nextId++ };
          node[side] = added;
          snap(
            4,
            `Attach ${value} as the ${side} child of ${node.value}.`,
            added.id,
            path,
            value
          );
          break;
        }
        node = child;
      }
    }
    return frames;
  },

  render({ state }) {
    return <TreeView nodes={state.nodes} active={state.active} visited={state.path} />;
  },
};
