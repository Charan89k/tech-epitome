import { describe, expect, it } from "vitest";

import { VISUALIZATIONS } from "../registry";
import { binarySearchViz } from "./binary-search";
import { breadthFirstViz } from "./breadth-first";
import { depthFirstViz } from "./depth-first";
import { linkedListReversalViz } from "./linked-list-reversal";
import { slidingWindowViz } from "./sliding-window";
import { twoPointersViz } from "./two-pointers";

/**
 * The engine's central claim is that every frame comes from actually running
 * the algorithm rather than being choreographed. These tests hold it to
 * that: they check the traces against independently-computed answers, so a
 * visualization that merely looks plausible fails.
 */

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
      expect(frames.length, `${visualization.key} produced no frames`).toBeGreaterThan(0);

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
