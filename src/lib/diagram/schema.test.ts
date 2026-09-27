import { describe, expect, it, vi } from "vitest";

import { assertDiagram, LIMITS, parseDiagram } from "./schema";
import type { Diagram } from "./types";

/**
 * Diagram validation.
 *
 * This is a user-writable Json column: a learner's design arrives from the
 * browser and is stored verbatim. Every bound here exists because without
 * it somebody can put something in the database that every subsequent
 * render, and every AI request, has to carry.
 */

const valid: Diagram = {
  nodes: [
    { id: "c", kind: "client", label: "Browser" },
    { id: "api", kind: "api", label: "API" },
  ],
  edges: [{ id: "e1", from: "c", to: "api", kind: "sync" }],
};

describe("assertDiagram", () => {
  it("accepts a well-formed diagram", () => {
    expect(assertDiagram(valid)).toEqual(valid);
  });

  it("rejects an unknown component kind", () => {
    // The palette is closed on purpose: "you put a cache in front of the
    // database" is only checkable if a cache is a known thing.
    expect(() =>
      assertDiagram({ nodes: [{ id: "x", kind: "blockchain", label: "X" }], edges: [] })
    ).toThrow();
  });

  it("rejects duplicate node ids", () => {
    expect(() =>
      assertDiagram({
        nodes: [
          { id: "a", kind: "api", label: "One" },
          { id: "a", kind: "cache", label: "Two" },
        ],
        edges: [],
      })
    ).toThrow(/Duplicate node id/);
  });

  it("rejects an edge to a node that does not exist", () => {
    expect(() =>
      assertDiagram({
        nodes: [{ id: "a", kind: "api", label: "API" }],
        edges: [{ id: "e", from: "a", to: "ghost", kind: "sync" }],
      })
    ).toThrow(/not in the diagram/);
  });

  it("rejects ids outside the safe alphabet", () => {
    // Ids reach SVG attributes and the prose handed to the model; a
    // restricted alphabet means neither consumer has to escape them.
    expect(() =>
      assertDiagram({
        nodes: [{ id: '"><script>', kind: "api", label: "API" }],
        edges: [],
      })
    ).toThrow();
  });

  it("caps the number of nodes", () => {
    const nodes = Array.from({ length: LIMITS.maxNodes + 1 }, (_, i) => ({
      id: `n${i}`,
      kind: "service" as const,
      label: `S${i}`,
    }));
    expect(() => assertDiagram({ nodes, edges: [] })).toThrow();
  });

  it("caps the number of edges", () => {
    const edges = Array.from({ length: LIMITS.maxEdges + 1 }, (_, i) => ({
      id: `e${i}`,
      from: "c",
      to: "api",
      kind: "sync" as const,
    }));
    expect(() => assertDiagram({ ...valid, edges })).toThrow();
  });

  it("caps label length", () => {
    expect(() =>
      assertDiagram({
        nodes: [{ id: "a", kind: "api", label: "x".repeat(LIMITS.maxLabel + 1) }],
        edges: [],
      })
    ).toThrow();
  });

  it("accepts an empty diagram", () => {
    // The starting state of every workspace.
    expect(assertDiagram({ nodes: [], edges: [] })).toEqual({ nodes: [], edges: [] });
  });
});

describe("parseDiagram", () => {
  it("returns the diagram when it is valid", () => {
    expect(parseDiagram(valid)).toEqual(valid);
  });

  it("degrades to empty rather than throwing on malformed data", () => {
    // A bad reference architecture should cost that lesson its picture,
    // not take the page down.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseDiagram({ nodes: "not an array" })).toEqual({ nodes: [], edges: [] });
    expect(parseDiagram(null)).toEqual({ nodes: [], edges: [] });
    expect(parseDiagram(undefined)).toEqual({ nodes: [], edges: [] });
    warn.mockRestore();
  });
});
