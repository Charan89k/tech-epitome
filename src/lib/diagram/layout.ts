import {
  NODE_KIND_TIER,
  type Diagram,
  type DiagramEdge,
  type DiagramNode,
} from "./types";

/**
 * Turning a graph into coordinates, deterministically.
 *
 * No force simulation and no drag-and-drop canvas. Two reasons, and both
 * are about the product rather than the algorithm:
 *
 *   1. A force layout gives a different picture every render, so a learner
 *      cannot compare their design to the reference, and a screenshot in a
 *      lesson never matches the one beside it.
 *   2. Dragging boxes is unusable on a phone, and the teaching point is
 *      which components talk to which — not whether the boxes are pretty.
 *
 * So nodes are assigned to horizontal tiers by what they *are* (a cache
 * sits between services and the database), refined by what they are
 * connected to, and ordered within a tier to reduce crossings. The result
 * is stable: the same diagram data always produces the same picture.
 */

export const LAYOUT = {
  nodeWidth: 132,
  nodeHeight: 54,
  /** Vertical gap between tiers. */
  tierGap: 78,
  /** Horizontal gap between nodes in the same tier. */
  nodeGap: 26,
  padding: 16,
} as const;

export type PositionedNode = DiagramNode & {
  x: number;
  y: number;
  width: number;
  height: number;
  tier: number;
};

export type LaidOutDiagram = {
  nodes: PositionedNode[];
  edges: DiagramEdge[];
  width: number;
  height: number;
};

/**
 * Refines each node's tier from the graph.
 *
 * The kind gives a sensible default, but a design where the cache hangs
 * off a worker rather than the API should draw that way. A node with
 * incoming edges is pushed below its deepest predecessor; the pass is
 * bounded so a cycle (which is legal — think a worker writing back to a
 * queue) terminates instead of spinning.
 */
function assignTiers(diagram: Diagram): Map<string, number> {
  const tiers = new Map<string, number>();
  for (const node of diagram.nodes) {
    tiers.set(node.id, NODE_KIND_TIER[node.kind] ?? 3);
  }

  const incoming = new Map<string, string[]>();
  for (const edge of diagram.edges) {
    if (!tiers.has(edge.from) || !tiers.has(edge.to)) continue;
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge.from]);
  }

  // Bounded relaxation. Each pass can only push nodes down, and the depth
  // of a DAG over n nodes is at most n, so n passes is a hard ceiling — a
  // cycle simply stops improving rather than looping forever.
  const passes = Math.min(diagram.nodes.length, 12);
  for (let pass = 0; pass < passes; pass += 1) {
    let moved = false;
    for (const node of diagram.nodes) {
      const sources = incoming.get(node.id);
      if (!sources?.length) continue;

      const deepest = Math.max(
        ...sources.map((id) => tiers.get(id) ?? 0)
      );
      const current = tiers.get(node.id) ?? 0;
      if (current <= deepest) {
        tiers.set(node.id, deepest + 1);
        moved = true;
      }
    }
    if (!moved) break;
  }

  return tiers;
}

/**
 * Orders nodes within a tier by the average position of their neighbours
 * in the tier above — the standard barycentre heuristic, which is cheap
 * and removes most crossings on diagrams of this size.
 *
 * Ties break on node id so the result is stable across renders.
 */
function orderWithinTiers(
  byTier: Map<number, DiagramNode[]>,
  diagram: Diagram,
  tiers: Map<string, number>
): void {
  const sortedTiers = [...byTier.keys()].sort((a, b) => a - b);
  const indexInTier = new Map<string, number>();

  for (const tier of sortedTiers) {
    const nodes = byTier.get(tier)!;

    if (tier === sortedTiers[0]) {
      nodes.sort((a, b) => a.id.localeCompare(b.id));
    } else {
      const barycentre = (node: DiagramNode): number => {
        const parents = diagram.edges
          .filter((e) => e.to === node.id && (tiers.get(e.from) ?? 0) < tier)
          .map((e) => indexInTier.get(e.from))
          .filter((i): i is number => i !== undefined);
        if (parents.length === 0) return Number.MAX_SAFE_INTEGER;
        return parents.reduce((sum, i) => sum + i, 0) / parents.length;
      };

      nodes.sort((a, b) => {
        const diff = barycentre(a) - barycentre(b);
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      });
    }

    nodes.forEach((node, index) => indexInTier.set(node.id, index));
  }
}

/**
 * Lays a diagram out into a fixed coordinate space.
 *
 * The returned width/height describe the diagram's intrinsic size; the
 * renderer scales it to the container with a viewBox, so the same layout
 * works at 320px and on a desktop without recomputing anything.
 */
export function layoutDiagram(diagram: Diagram): LaidOutDiagram {
  if (diagram.nodes.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const tiers = assignTiers(diagram);

  const byTier = new Map<number, DiagramNode[]>();
  for (const node of diagram.nodes) {
    const tier = tiers.get(node.id) ?? 0;
    byTier.set(tier, [...(byTier.get(tier) ?? []), node]);
  }

  orderWithinTiers(byTier, diagram, tiers);

  // Tiers are renumbered to be contiguous, so an empty tier (a design with
  // no cache, say) does not leave a band of white space.
  const sortedTiers = [...byTier.keys()].sort((a, b) => a - b);
  const widest = Math.max(
    ...sortedTiers.map((tier) => byTier.get(tier)!.length)
  );

  const contentWidth =
    widest * LAYOUT.nodeWidth + (widest - 1) * LAYOUT.nodeGap;
  const width = contentWidth + LAYOUT.padding * 2;
  const height =
    sortedTiers.length * LAYOUT.nodeHeight +
    (sortedTiers.length - 1) * LAYOUT.tierGap +
    LAYOUT.padding * 2;

  const positioned: PositionedNode[] = [];

  sortedTiers.forEach((tier, row) => {
    const nodes = byTier.get(tier)!;
    const rowWidth =
      nodes.length * LAYOUT.nodeWidth + (nodes.length - 1) * LAYOUT.nodeGap;
    // Each tier is centred, so a two-node tier under a four-node tier reads
    // as a funnel rather than as a left-aligned list.
    const startX = LAYOUT.padding + (contentWidth - rowWidth) / 2;

    nodes.forEach((node, column) => {
      positioned.push({
        ...node,
        tier: row,
        x: startX + column * (LAYOUT.nodeWidth + LAYOUT.nodeGap),
        y: LAYOUT.padding + row * (LAYOUT.nodeHeight + LAYOUT.tierGap),
        width: LAYOUT.nodeWidth,
        height: LAYOUT.nodeHeight,
      });
    });
  });

  // Edges naming a node that is not in the diagram are dropped rather than
  // drawn to nowhere. This happens routinely in the workspace: deleting a
  // component leaves its edges behind for one render.
  const ids = new Set(positioned.map((n) => n.id));
  const edges = diagram.edges.filter((e) => ids.has(e.from) && ids.has(e.to));

  return { nodes: positioned, edges, width, height };
}

/**
 * The diagram as an ordered prose description.
 *
 * Serves two consumers that both need words rather than geometry: screen
 * readers, which get this as the SVG's description, and the AI reviewer,
 * which gets it as context. Sending coordinates to a language model would
 * be asking it to do OCR on numbers.
 */
export function describeDiagram(diagram: Diagram): string {
  if (diagram.nodes.length === 0) return "The diagram is empty.";

  const label = (id: string): string => {
    const node = diagram.nodes.find((n) => n.id === id);
    return node ? node.label || node.kind : id;
  };

  const lines: string[] = [];

  lines.push(
    `Components (${diagram.nodes.length}): ` +
      diagram.nodes
        .map((n) => `${n.label || n.kind} [${n.kind}]${n.note ? ` — ${n.note}` : ""}`)
        .join("; ")
  );

  if (diagram.edges.length === 0) {
    lines.push("No connections have been drawn between them.");
  } else {
    lines.push(
      `Connections (${diagram.edges.length}): ` +
        diagram.edges
          .map((e) => {
            const arrow =
              e.kind === "async" ? "~>" : e.kind === "replication" ? "=>" : "->";
            return `${label(e.from)} ${arrow} ${label(e.to)}${e.label ? ` (${e.label})` : ""}`;
          })
          .join("; ")
    );
  }

  // Groupings are described whether or not anything is connected yet: a
  // learner who has laid out their services but not wired them up has
  // still expressed a decision worth reading back to them.
  const grouped = diagram.nodes.filter((n) => n.group);
  if (grouped.length > 0) {
    const groups = [...new Set(grouped.map((n) => n.group!))];
    lines.push(
      "Groupings: " +
        groups
          .map(
            (g) =>
              `${g} { ${grouped
                .filter((n) => n.group === g)
                .map((n) => n.label || n.kind)
                .join(", ")} }`
          )
          .join("; ")
    );
  }

  if (diagram.edges.length > 0) {
    lines.push(`Legend: -> synchronous, ~> asynchronous, => replication.`);
  }

  return lines.join("\n");
}

/**
 * Structural observations about a design.
 *
 * Deliberately *not* a score. These are facts the reviewer and the
 * workspace both surface ("nothing reads from the database", "the queue has
 * no consumer") — statements a learner can check, rather than a number
 * pretending to rank their architecture.
 */
export function diagramObservations(diagram: Diagram): string[] {
  const notes: string[] = [];
  if (diagram.nodes.length === 0) return notes;

  const kinds = new Set(diagram.nodes.map((n) => n.kind));
  const outgoing = new Set(diagram.edges.map((e) => e.from));
  const incoming = new Set(diagram.edges.map((e) => e.to));

  for (const node of diagram.nodes) {
    if (!outgoing.has(node.id) && !incoming.has(node.id)) {
      notes.push(`"${node.label || node.kind}" is not connected to anything.`);
    }
  }

  if (kinds.has("queue")) {
    const queues = diagram.nodes.filter((n) => n.kind === "queue");
    for (const queue of queues) {
      if (!outgoing.has(queue.id)) {
        notes.push(`"${queue.label || "Queue"}" has no consumer reading from it.`);
      }
    }
  }

  if (!kinds.has("client")) {
    notes.push("No client is shown, so the entry point to the system is implicit.");
  }

  if (kinds.has("database") && kinds.has("api") && !kinds.has("cache")) {
    notes.push("Every read appears to reach the database; there is no cache.");
  }

  return notes;
}
