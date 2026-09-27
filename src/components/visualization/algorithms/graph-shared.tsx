import { cn } from "@/lib/utils";

/**
 * Shared graph drawing for BFS and DFS.
 *
 * The layout is fixed rather than force-directed: a stable picture is far
 * easier to follow across frames than one that shifts as nodes are visited,
 * and the point is the traversal order, not the embedding.
 */

export type GraphInput = { edges: [string, string][]; start: string };

export type GraphLayout = Record<string, { x: number; y: number }>;

export type GraphNodeTone = "idle" | "frontier" | "current" | "visited";

export function buildAdjacency(edges: [string, string][]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const [a, b] of edges) {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push(b);
    adjacency.get(b)!.push(a);
  }
  // Deterministic neighbour order, so the traversal is reproducible and the
  // narration matches what the reader sees.
  for (const list of adjacency.values()) list.sort();
  return adjacency;
}

/**
 * Lays nodes out on concentric rings by distance from the start, which makes
 * BFS's level structure visible without any extra annotation.
 */
export function layoutByDistance(
  adjacency: Map<string, string[]>,
  start: string
): GraphLayout {
  const levels: string[][] = [];
  const seen = new Set<string>([start]);
  let frontier = [start];

  while (frontier.length > 0) {
    levels.push(frontier);
    const next: string[] = [];
    for (const node of frontier) {
      for (const neighbour of adjacency.get(node) ?? []) {
        if (!seen.has(neighbour)) {
          seen.add(neighbour);
          next.push(neighbour);
        }
      }
    }
    frontier = next;
  }

  // Anything unreachable goes in a final row rather than being dropped.
  const unreached = [...adjacency.keys()].filter((node) => !seen.has(node));
  if (unreached.length > 0) levels.push(unreached);

  const layout: GraphLayout = {};
  const rowHeight = 74;
  levels.forEach((row, rowIndex) => {
    const width = 100;
    row.forEach((node, columnIndex) => {
      const slot = (columnIndex + 1) / (row.length + 1);
      layout[node] = { x: slot * width, y: 30 + rowIndex * rowHeight };
    });
  });

  return layout;
}

const TONE_FILL: Record<GraphNodeTone, string> = {
  idle: "var(--viz-idle)",
  frontier: "var(--viz-compare)",
  current: "var(--ember-500)",
  visited: "var(--viz-done)",
};

export function GraphView({
  adjacency,
  layout,
  tones,
  height,
}: {
  adjacency: Map<string, string[]>;
  layout: GraphLayout;
  tones: Record<string, GraphNodeTone>;
  height: number;
}) {
  const nodes = [...adjacency.keys()];
  const drawn = new Set<string>();

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className="h-auto w-full"
      style={{ maxHeight: height * 3.2 }}
      role="img"
      aria-label="Graph traversal state"
    >
      {/* Edges first so nodes sit on top of them. */}
      {nodes.flatMap((node) =>
        (adjacency.get(node) ?? []).map((neighbour) => {
          const key = [node, neighbour].sort().join("-");
          if (drawn.has(key)) return null;
          drawn.add(key);

          const a = layout[node];
          const b = layout[neighbour];
          if (!a || !b) return null;

          return (
            <line
              key={key}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--border)"
              strokeWidth={0.7}
            />
          );
        })
      )}

      {nodes.map((node) => {
        const position = layout[node];
        if (!position) return null;
        const tone = tones[node] ?? "idle";

        return (
          <g key={node}>
            <circle
              cx={position.x}
              cy={position.y}
              r={7.5}
              fill={TONE_FILL[tone]}
              fillOpacity={tone === "idle" ? 0.25 : 0.9}
              stroke={TONE_FILL[tone]}
              strokeWidth={1}
              className={cn("transition-all duration-200")}
            />
            <text
              x={position.x}
              y={position.y + 2.6}
              textAnchor="middle"
              fontSize={7}
              fontFamily="var(--font-mono)"
              fill={tone === "idle" ? "var(--muted-foreground)" : "var(--background)"}
              fontWeight={600}
            >
              {node}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function parseGraph(
  raw: string
): { ok: true; value: GraphInput } | { ok: false; error: string } {
  const [edgePart, startPart] = raw.split("/");
  const edges: [string, string][] = [];

  for (const pair of (edgePart ?? "").trim().split(/[\s,]+/).filter(Boolean)) {
    const [a, b] = pair.split("-");
    if (!a || !b) {
      return { ok: false, error: `"${pair}" is not an edge. Use the form A-B.` };
    }
    edges.push([a, b]);
  }

  if (edges.length === 0) {
    return { ok: false, error: "Enter at least one edge, such as A-B." };
  }
  if (edges.length > 14) {
    return { ok: false, error: "Keep it to 14 edges so the drawing stays readable." };
  }

  const start = (startPart ?? "").trim() || edges[0]![0];
  if (!edges.some(([a, b]) => a === start || b === start)) {
    return { ok: false, error: `Start node "${start}" does not appear in any edge.` };
  }

  return { ok: true, value: { edges, start } };
}

export function formatGraph(input: GraphInput): string {
  return `${input.edges.map(([a, b]) => `${a}-${b}`).join(" ")} / ${input.start}`;
}
