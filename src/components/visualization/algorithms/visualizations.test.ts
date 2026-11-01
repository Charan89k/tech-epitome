import { describe, expect, it } from "vitest";

import { VISUALIZATIONS } from "../registry";
import { balancedBracketsViz } from "./balanced-brackets";
import { bstInsertViz } from "./bst-insert";
import { dijkstraViz } from "./dijkstra";
import { bucketFor, hashTableViz } from "./hash-table";
import { insertionSortViz } from "./insertion-sort";
import { kruskalViz } from "./kruskal";
import { lcsViz } from "./longest-common-subsequence";
import { minHeapViz } from "./min-heap";
import { nQueensViz } from "./n-queens";
import { binarySearchViz } from "./binary-search";
import { breadthFirstViz } from "./breadth-first";
import { depthFirstViz } from "./depth-first";
import { linkedListReversalViz } from "./linked-list-reversal";
import { queueViz } from "./queue";
import { slidingWindowViz } from "./sliding-window";
import { twoPointersViz } from "./two-pointers";
import { writePointerViz } from "./write-pointer";

/**
 * The engine's central claim is that every frame comes from actually running
 * the algorithm rather than being choreographed. These tests hold it to
 * that: they check the traces against independently-computed answers, so a
 * visualization that merely looks plausible fails.
 */

describe("the algorithm traces reach the right answers", () => {
  const last = <T>(frames: T[]) => frames[frames.length - 1]!;

  it("insertion sort sorts", () => {
    const input = [9, 1, 8, 2, 7, 3, 3, -4];
    expect(last(insertionSortViz.buildFrames(input)).state.values).toEqual(
      [...input].sort((a, b) => a - b)
    );
  });

  it("the bracket stack accepts and refuses correctly", () => {
    for (const [text, expected] of [
      ["{[()]()}", true],
      ["([)]", false],
      ["((", false],
      ["())", false],
    ] as const) {
      expect(last(balancedBracketsViz.buildFrames(text)).state.result, text).toBe(
        expected
      );
    }
  });

  it("the BST holds every distinct value, in sorted drawing order", () => {
    const { nodes } = last(bstInsertViz.buildFrames([5, 3, 8, 3, 1, 9])).state;
    const left = [...nodes].sort((a, b) => a.x - b.x).map((n) => Number(n.label));
    expect(left).toEqual([1, 3, 5, 8, 9]);
  });

  it("the heap pops values in ascending order", () => {
    const frames = minHeapViz.buildFrames([9, 4, 7, 1, 8, 2]);
    expect(last(frames).variables.popped).toBe("1 2 4 7 8 9");
  });

  it("Dijkstra finds the shortest distances", () => {
    const { dist } = last(dijkstraViz.buildFrames(dijkstraViz.defaultInput)).state;
    expect(dist).toEqual({ A: 0, B: 3, C: 1, D: 8, E: 11 });
  });

  it("the queue removes in arrival order, wraps, and refuses when full", () => {
    const frames = queueViz.buildFrames([1, 2, 3, 4, 5, 6, "dequeue", "dequeue", 7]);
    const end = last(frames).state;
    expect(end.removed).toEqual([1, 2]);
    expect(end.slots).toEqual([7, null, 3, 4, 5]);
    expect(frames.some((f) => f.operation.includes("6 is refused"))).toBe(true);
    expect(last(queueViz.buildFrames(["dequeue"])).operation).toContain("empty");
  });

  it("the hash table holds each distinct key once, in its own bucket", () => {
    const input = [15, 8, 22, -6, 4, 15];
    const { buckets } = last(hashTableViz.buildFrames(input)).state;
    expect(buckets.flat().sort((a, b) => a - b)).toEqual([-6, 4, 8, 15, 22]);
    buckets.forEach((chain, index) =>
      chain.forEach((key) => expect(bucketFor(key)).toBe(index))
    );
    expect(bucketFor(-6)).toBe(1);
  });

  it("Kruskal's total matches an exhaustive search of spanning trees", () => {
    const edges = kruskalViz.defaultInput;
    const nodes = new Set(edges.flatMap(([a, b]) => [a, b]));
    let best = Infinity;
    for (let mask = 0; mask < 1 << edges.length; mask++) {
      const chosen = edges.filter((_, i) => mask & (1 << i));
      if (chosen.length !== nodes.size - 1) continue;
      const reached = new Set([edges[0]![0]]);
      for (let pass = 0; pass < nodes.size; pass++) {
        for (const [a, b] of chosen) {
          if (reached.has(a) || reached.has(b)) {
            reached.add(a);
            reached.add(b);
          }
        }
      }
      if (reached.size === nodes.size) {
        best = Math.min(
          best,
          chosen.reduce((sum, [, , w]) => sum + w, 0)
        );
      }
    }
    const end = last(kruskalViz.buildFrames(edges)).state;
    expect(end.total).toBe(best);
    expect(end.groups).toBe(1);
  });

  it("N-Queens ends on a valid board, for every offered size", () => {
    for (const n of [4, 5, 6]) {
      const { queens, solved } = last(nQueensViz.buildFrames(n)).state;
      expect(solved).toBe(true);
      expect(queens).toHaveLength(n);
      queens.forEach((a, i) =>
        queens.forEach((b, j) => {
          if (i < j) {
            expect(a).not.toBe(b);
            expect(Math.abs(a - b)).not.toBe(j - i);
          }
        })
      );
    }
  });

  it("LCS finds the known length", () => {
    const { table } = last(lcsViz.buildFrames({ a: "ABCBDAB", b: "BDCABA" })).state;
    expect(table[7]![6]).toBe(4);
  });
});

describe("the registry", () => {
  it("registers every visualization under its own key", () => {
    for (const [key, visualization] of Object.entries(VISUALIZATIONS)) {
      expect(visualization.key, `${key} is registered under the wrong key`).toBe(key);
    }
  });

  it("gives every visualization the metadata the player needs", () => {
    for (const visualization of Object.values(VISUALIZATIONS)) {
      expect(visualization.title.length).toBeGreaterThan(0);
      expect(visualization.description.length).toBeGreaterThan(20);
      expect(visualization.pseudocode.length).toBeGreaterThan(1);
      expect(visualization.complexity.time.length).toBeGreaterThan(0);
      expect(visualization.defaultInput).toBeDefined();
    }
  });

  it("produces frames whose highlighted line exists in the pseudocode", () => {
    for (const visualization of Object.values(VISUALIZATIONS)) {
      const frames = visualization.buildFrames(visualization.defaultInput);
      expect(frames.length, `${visualization.key} produced no frames`).toBeGreaterThan(
        0
      );

      for (const frame of frames) {
        expect(
          frame.line,
          `${visualization.key} highlights line ${frame.line}, out of range`
        ).toBeLessThan(visualization.pseudocode.length);
        expect(frame.line).toBeGreaterThanOrEqual(0);
        expect(frame.operation.length).toBeGreaterThan(0);
      }
    }
  });

  it("round-trips its input through format and parse", () => {
    for (const visualization of Object.values(VISUALIZATIONS)) {
      if (!visualization.parseInput || !visualization.formatInput) continue;

      const formatted = visualization.formatInput(visualization.defaultInput);
      const parsed = visualization.parseInput(formatted);

      expect(parsed.ok, `${visualization.key} cannot parse its own default`).toBe(true);
    }
  });

  it("rejects malformed input with a message rather than throwing", () => {
    for (const visualization of Object.values(VISUALIZATIONS)) {
      if (!visualization.parseInput) continue;
      const parsed = visualization.parseInput("");
      expect(parsed.ok).toBe(false);
      if (!parsed.ok) expect(parsed.error.length).toBeGreaterThan(5);
    }
  });
});

describe("two pointers", () => {
  it("finds the pair and reports its indices", () => {
    const frames = twoPointersViz.buildFrames({
      values: [2, 4, 7, 11, 15],
      target: 18,
    });
    const final = frames[frames.length - 1]!;

    expect(final.state.found).toEqual([2, 3]); // 7 + 11
  });

  it("eliminates exactly one candidate per comparison", () => {
    const frames = twoPointersViz.buildFrames({
      values: [1, 2, 3, 4, 5],
      target: 100, // unreachable, so it scans to exhaustion
    });
    const final = frames[frames.length - 1]!;

    // Five elements, pointers meeting: four eliminations.
    expect(final.state.excluded).toHaveLength(4);
    expect(final.state.found).toBeNull();
  });
});

describe("sliding window", () => {
  it("finds the longest distinct stretch", () => {
    const frames = slidingWindowViz.buildFrames({ text: "abcabcbb" });
    const final = frames[frames.length - 1]!;
    expect(final.state.best.length).toBe(3);
  });

  it("never moves the left edge backwards", () => {
    const frames = slidingWindowViz.buildFrames({ text: "abba" });
    const lefts = frames.map((frame) => frame.state.left);

    // This is the invariant that makes the scan linear, and "abba" is
    // precisely the input that breaks a naive implementation.
    for (let i = 1; i < lefts.length; i += 1) {
      expect(lefts[i]!).toBeGreaterThanOrEqual(lefts[i - 1]!);
    }
  });

  it("handles a string with no repeats", () => {
    const frames = slidingWindowViz.buildFrames({ text: "abcd" });
    expect(frames[frames.length - 1]!.state.best.length).toBe(4);
  });
});

describe("binary search", () => {
  it("finds a present value", () => {
    const frames = binarySearchViz.buildFrames({
      values: [1, 3, 5, 8, 12, 16, 21],
      target: 12,
    });
    const final = frames[frames.length - 1]!;
    expect(final.state.foundAt).toBe(4);
  });

  it("reports absence rather than a wrong index", () => {
    const frames = binarySearchViz.buildFrames({
      values: [1, 3, 5],
      target: 4,
    });
    expect(frames[frames.length - 1]!.state.foundAt).toBeNull();
  });

  it("takes a logarithmic number of probes", () => {
    const values = Array.from({ length: 16 }, (_, i) => i * 2);
    const frames = binarySearchViz.buildFrames({ values, target: 31 });

    // Each probe emits two frames — announcing the midpoint, then deciding
    // which half to discard — so count the announcements (pseudocode line 2).
    const probes = frames.filter((frame) => frame.line === 2);
    expect(probes.length).toBeLessThanOrEqual(5);
  });
});

describe("linked list reversal", () => {
  it("ends with every link pointing backwards", () => {
    const frames = linkedListReversalViz.buildFrames({ values: [1, 2, 3, 4] });
    const final = frames[frames.length - 1]!;

    // Node i should now point at i-1, and the original head at null.
    expect(final.state.nodes[0]!.next).toBeNull();
    expect(final.state.nodes[1]!.next).toBe(0);
    expect(final.state.nodes[2]!.next).toBe(1);
    expect(final.state.nodes[3]!.next).toBe(2);
    expect(final.state.prev).toBe(3); // the new head
  });

  it("handles a single node", () => {
    const frames = linkedListReversalViz.buildFrames({ values: [7] });
    const final = frames[frames.length - 1]!;
    expect(final.state.prev).toBe(0);
    expect(final.state.nodes[0]!.next).toBeNull();
  });
});

describe("graph traversals", () => {
  const input = {
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["C", "E"],
    ] as [string, string][],
    start: "A",
  };

  it("BFS visits in level order", () => {
    const frames = breadthFirstViz.buildFrames(input);
    const order = frames[frames.length - 1]!.state.order;

    expect(order[0]).toBe("A");
    // B and C are one hop; D and E are two. Level order means both of the
    // first group precede both of the second.
    expect(order.indexOf("B")).toBeLessThan(order.indexOf("D"));
    expect(order.indexOf("C")).toBeLessThan(order.indexOf("D"));
    expect(order.indexOf("C")).toBeLessThan(order.indexOf("E"));
  });

  it("BFS visits every reachable node exactly once", () => {
    const frames = breadthFirstViz.buildFrames(input);
    const order = frames[frames.length - 1]!.state.order;
    expect(new Set(order).size).toBe(order.length);
    expect(new Set(order)).toEqual(new Set(["A", "B", "C", "D", "E"]));
  });

  it("DFS goes deep before wide", () => {
    const frames = depthFirstViz.buildFrames(input);
    const order = frames[frames.length - 1]!.state.order;

    expect(order[0]).toBe("A");
    // Neighbours are sorted, so A -> B -> D happens before C is touched.
    // That is the defining contrast with BFS on the same graph.
    expect(order.indexOf("D")).toBeLessThan(order.indexOf("C"));
  });

  it("DFS visits every reachable node exactly once", () => {
    const frames = depthFirstViz.buildFrames(input);
    const order = frames[frames.length - 1]!.state.order;
    expect(new Set(order).size).toBe(order.length);
    expect(new Set(order)).toEqual(new Set(["A", "B", "C", "D", "E"]));
  });

  it("reaches a disconnected component", () => {
    const frames = depthFirstViz.buildFrames({
      edges: [
        ["A", "B"],
        ["X", "Y"],
      ],
      start: "A",
    });
    const order = frames[frames.length - 1]!.state.order;
    expect(new Set(order)).toEqual(new Set(["A", "B", "X", "Y"]));
  });
});

describe("write pointer", () => {
  /** The compaction every case below is checked against, computed independently. */
  function compact(values: number[]): number[] {
    const kept = values.filter((value) => value !== 0);
    return [...kept, ...Array(values.length - kept.length).fill(0)];
  }

  const finalOf = (values: number[]) => {
    const frames = writePointerViz.buildFrames({ values });
    return frames[frames.length - 1]!;
  };

  it("moves every zero to the end and keeps the rest in order", () => {
    const input = [0, 1, 0, 3, 12];
    expect(finalOf(input).state.values).toEqual(compact(input));
    expect(finalOf(input).state.values).toEqual([1, 3, 12, 0, 0]);
  });

  it("leaves the caller's array untouched", () => {
    const input = [0, 1, 0, 3, 12];
    writePointerViz.buildFrames({ values: input });
    expect(input).toEqual([0, 1, 0, 3, 12]);
  });

  it("ends with the write pointer at the number of kept values", () => {
    for (const input of [
      [0, 1, 0, 3, 12],
      [1, 2, 3],
      [0, 0, 0],
      [0, 0, 1],
    ]) {
      const expected = input.filter((value) => value !== 0).length;
      expect(finalOf(input).state.write, `for [${input}]`).toBe(expected);
    }
  });

  it("never lets the write pointer overtake the read pointer", () => {
    // This is the invariant that makes overwriting safe: every slot written
    // to has already been read, so no unread value is ever destroyed.
    const frames = writePointerViz.buildFrames({ values: [0, 1, 0, 3, 12, 0, 7] });
    for (const frame of frames) {
      expect(frame.state.write).toBeLessThanOrEqual(frame.state.read);
    }
  });

  it("advances the write pointer only on a keep", () => {
    const frames = writePointerViz.buildFrames({ values: [0, 1, 0, 3, 12] });
    const writes = frames.map((frame) => frame.state.write);

    // Monotonic, and it climbs exactly once per non-zero value.
    for (let i = 1; i < writes.length; i += 1) {
      expect(writes[i]!).toBeGreaterThanOrEqual(writes[i - 1]!);
    }
    expect(writes[writes.length - 1]!).toBe(3);
  });

  it("preserves the multiset of values at every step", () => {
    // A swap rearranges; it must never invent or lose a value.
    const input = [0, 4, 0, 9, 0, 2];
    const sorted = [...input].sort((a, b) => a - b);
    for (const frame of writePointerViz.buildFrames({ values: input })) {
      expect([...frame.state.values].sort((a, b) => a - b)).toEqual(sorted);
    }
  });

  it("does nothing to an array with no zeros", () => {
    const input = [4, 5, 6];
    const final = finalOf(input);
    expect(final.state.values).toEqual([4, 5, 6]);
    expect(final.state.write).toBe(3);
  });

  it("handles an array that is all zeros", () => {
    const final = finalOf([0, 0, 0]);
    expect(final.state.values).toEqual([0, 0, 0]);
    expect(final.state.write).toBe(0);
  });

  it("emits a swap frame for each kept value and none for a discarded one", () => {
    const frames = writePointerViz.buildFrames({ values: [0, 1, 0, 3, 12] });
    const swaps = frames.filter((frame) => frame.state.swapped !== null);
    expect(swaps).toHaveLength(3);
  });

  it("marks only the final frame as done", () => {
    const frames = writePointerViz.buildFrames({ values: [0, 1, 0, 3, 12] });
    expect(frames.filter((frame) => frame.state.done)).toHaveLength(1);
    expect(frames[frames.length - 1]!.state.done).toBe(true);
  });

  it("reports the gap between the pointers as the number discarded", () => {
    const frames = writePointerViz.buildFrames({ values: [0, 1, 0, 3, 12] });
    for (const frame of frames) {
      expect(frame.variables.gap).toBe(frame.state.read - frame.state.write);
    }
  });

  it("narrates every step in prose, so the trace is followable without the picture", () => {
    for (const frame of writePointerViz.buildFrames({ values: [0, 1, 0, 3, 12] })) {
      expect(frame.operation.length).toBeGreaterThan(20);
      expect(frame.operation).toMatch(/[.!]$/);
    }
  });
});
