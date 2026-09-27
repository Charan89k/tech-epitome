import { describe, expect, it } from "vitest";

import {
  describeDiagram,
  diagramObservations,
  layoutDiagram,
} from "./layout";
import type { Diagram } from "./types";

/**
 * The layout, asserted where it matters.
 *
 * Not "does it look nice" — that is not testable and not the point. What
 * is testable, and what the product depends on, is that the same diagram
 * always produces the same picture (so a learner can compare theirs to the
 * reference), that the graph drives the tiers rather than just the node
 * kinds, and that the prose description says what the picture shows —
 * because that description is simultaneously the screen-reader text and
 * the context the AI reviewer receives.
 */

function diagram(
  nodes: Diagram["nodes"],
  edges: Diagram["edges"] = []
): Diagram {
  return { nodes, edges };
}

const simplePath: Diagram = diagram(
  [
    { id: "c", kind: "client", label: "Browser" },
    { id: "lb", kind: "load_balancer", label: "LB" },
    { id: "api", kind: "api", label: "API" },
    { id: "db", kind: "database", label: "Postgres" },
  ],
  [
    { id: "e1", from: "c", to: "lb", kind: "sync" },
    { id: "e2", from: "lb", to: "api", kind: "sync" },
    { id: "e3", from: "api", to: "db", kind: "sync" },
  ]
);

describe("layoutDiagram", () => {
  it("returns an empty canvas for an empty diagram", () => {
    const result = layoutDiagram({ nodes: [], edges: [] });
    expect(result.nodes).toEqual([]);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it("is deterministic", () => {
    // The reason there is no force simulation: a learner compares their
    // design to the reference beside it, and a picture that moves between
    // renders makes that impossible.
    const a = layoutDiagram(simplePath);
    const b = layoutDiagram(simplePath);
    expect(a).toEqual(b);
  });

  it("does not depend on the order nodes were added", () => {
    const shuffled = diagram(
      [...simplePath.nodes].reverse(),
      [...simplePath.edges].reverse()
    );
    const ordered = layoutDiagram(simplePath);
    const reversed = layoutDiagram(shuffled);

    const positions = (d: ReturnType<typeof layoutDiagram>) =>
      Object.fromEntries(d.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));

    expect(positions(reversed)).toEqual(positions(ordered));
  });

  it("orders a request path top to bottom", () => {
    const result = layoutDiagram(simplePath);
    const y = Object.fromEntries(result.nodes.map((n) => [n.id, n.y]));

    expect(y.c).toBeLessThan(y.lb!);
    expect(y.lb).toBeLessThan(y.api!);
    expect(y.api).toBeLessThan(y.db!);
  });

  it("lets the graph override the default tier for a kind", () => {
    // A cache hanging off a worker should draw below the worker, even
    // though caches normally sit above workers.
    const d = diagram(
      [
        { id: "w", kind: "worker", label: "Worker" },
        { id: "cache", kind: "cache", label: "Cache" },
      ],
      [{ id: "e", from: "w", to: "cache", kind: "sync" }]
    );
    const result = layoutDiagram(d);
    const w = result.nodes.find((n) => n.id === "w")!;
    const cache = result.nodes.find((n) => n.id === "cache")!;
    expect(cache.y).toBeGreaterThan(w.y);
  });

  it("terminates on a cycle", () => {
    // Legal in a real design: a worker republishing onto the queue it
    // reads from. The relaxation is bounded so this cannot spin.
    const d = diagram(
      [
        { id: "q", kind: "queue", label: "Queue" },
        { id: "w", kind: "worker", label: "Worker" },
      ],
      [
        { id: "e1", from: "q", to: "w", kind: "async" },
        { id: "e2", from: "w", to: "q", kind: "async" },
      ]
    );
    const result = layoutDiagram(d);
    expect(result.nodes).toHaveLength(2);
    expect(Number.isFinite(result.height)).toBe(true);
  });

  it("places nodes on the same tier side by side", () => {
    const d = diagram(
      [
        { id: "a", kind: "service", label: "A" },
        { id: "b", kind: "service", label: "B" },
      ],
      []
    );
    const result = layoutDiagram(d);
    expect(result.nodes[0]!.y).toBe(result.nodes[1]!.y);
    expect(result.nodes[0]!.x).not.toBe(result.nodes[1]!.x);
  });

  it("drops edges naming a node that is not present", () => {
    // Normal mid-edit in the workspace: a deleted component leaves its
    // edges behind for one render, and an arrow to nowhere would throw.
    const d = diagram(
      [{ id: "a", kind: "api", label: "API" }],
      [{ id: "e", from: "a", to: "ghost", kind: "sync" }]
    );
    expect(layoutDiagram(d).edges).toEqual([]);
  });

  it("keeps every node inside the reported canvas", () => {
    // The renderer scales this box to the container; a node outside it
    // would be clipped at every viewport.
    const result = layoutDiagram(simplePath);
    for (const node of result.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(result.width);
      expect(node.y + node.height).toBeLessThanOrEqual(result.height);
    }
  });
});

describe("describeDiagram", () => {
  it("says so when there is nothing to describe", () => {
    expect(describeDiagram({ nodes: [], edges: [] })).toMatch(/empty/i);
  });

  it("names every component and its kind", () => {
    const text = describeDiagram(simplePath);
    expect(text).toContain("Browser [client]");
    expect(text).toContain("Postgres [database]");
  });

  it("describes connections in reading order with direction", () => {
    const text = describeDiagram(simplePath);
    expect(text).toContain("Browser -> LB");
    expect(text).toContain("API -> Postgres");
  });

  it("distinguishes synchronous from asynchronous flow", () => {
    const d = diagram(
      [
        { id: "a", kind: "api", label: "API" },
        { id: "q", kind: "queue", label: "Jobs" },
      ],
      [{ id: "e", from: "a", to: "q", label: "publish", kind: "async" }]
    );
    const text = describeDiagram(d);
    expect(text).toContain("API ~> Jobs (publish)");
    expect(text).toMatch(/asynchronous/);
  });

  it("says when nothing is connected", () => {
    const text = describeDiagram(diagram([{ id: "a", kind: "api", label: "API" }]));
    expect(text).toMatch(/No connections/i);
  });

  it("reports groupings", () => {
    const d = diagram([
      { id: "a", kind: "service", label: "Auth", group: "Core" },
      { id: "b", kind: "service", label: "Links", group: "Core" },
    ]);
    expect(describeDiagram(d)).toContain("Core { Auth, Links }");
  });
});

describe("diagramObservations", () => {
  it("says nothing about an empty diagram", () => {
    expect(diagramObservations({ nodes: [], edges: [] })).toEqual([]);
  });

  it("flags an orphaned component", () => {
    const d = diagram(
      [
        { id: "a", kind: "api", label: "API" },
        { id: "orphan", kind: "cache", label: "Redis" },
      ],
      []
    );
    const notes = diagramObservations(d);
    expect(notes.some((n) => n.includes("Redis"))).toBe(true);
  });

  it("flags a queue with no consumer", () => {
    const d = diagram(
      [
        { id: "api", kind: "api", label: "API" },
        { id: "q", kind: "queue", label: "Jobs" },
      ],
      [{ id: "e", from: "api", to: "q", kind: "async" }]
    );
    expect(
      diagramObservations(d).some((n) => /no consumer/i.test(n))
    ).toBe(true);
  });

  it("notes when every read reaches the database", () => {
    expect(
      diagramObservations(simplePath).some((n) => /no cache/i.test(n))
    ).toBe(true);
  });

  it("stays quiet once a cache is in the path", () => {
    const withCache: Diagram = diagram(
      [
        ...simplePath.nodes,
        { id: "cache", kind: "cache", label: "Redis" },
      ],
      [
        ...simplePath.edges,
        { id: "e4", from: "api", to: "cache", kind: "sync" },
      ]
    );
    expect(
      diagramObservations(withCache).some((n) => /no cache/i.test(n))
    ).toBe(false);
  });

  it("returns observations, never a score", () => {
    // A number would invite ranking one architecture above another, which
    // is not a thing this product should pretend to do.
    for (const note of diagramObservations(simplePath)) {
      expect(note).not.toMatch(/\b\d+\s*(\/|out of|%)/);
    }
  });
});
