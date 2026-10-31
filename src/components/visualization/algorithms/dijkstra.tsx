import { Cell, CellRow } from "../cells";
import { frame, type Frame, type Visualization } from "../types";
import {
  GraphView,
  buildAdjacency,
  layoutByDistance,
  type GraphNodeTone,
} from "./graph-shared";

export type WeightedEdge = [string, string, number];
type Input = { edges: WeightedEdge[]; start: string };
type State = {
  tones: Record<string, GraphNodeTone>;
  dist: Record<string, number>;
  input: Input;
};

const INFINITY_LABEL = "∞";

/** Dijkstra's shortest paths: always settle the nearest unsettled node. */
export const dijkstraViz: Visualization<State, Input> = {
  key: "dijkstra",
  title: "Dijkstra's Shortest Paths",
  description:
    "Settle the nearest node, then see whether going through it shortens the way to its neighbours. Needs non-negative weights.",
  complexity: { time: "O((V + E) log V) with a heap", space: "O(V)" },
  pseudocode: [
    "dist[start] = 0; every other dist = infinity",
    "while an unsettled node is reachable:",
    "    u = the unsettled node with the smallest dist",
    "    for each edge u-v of weight w:",
    "        if dist[u] + w < dist[v]: dist[v] = dist[u] + w",
  ],
  defaultInput: {
    start: "A",
    edges: [
      ["A", "B", 4],
      ["A", "C", 1],
      ["C", "B", 2],
      ["B", "D", 5],
      ["C", "D", 8],
      ["D", "E", 3],
    ],
  },
  inputHint: "Weighted edges, then the start. Example: A-B:4 A-C:1 C-B:2 / A",

  parseInput(raw) {
    const [edgePart, startPart] = raw.split("/");
    const edges: WeightedEdge[] = [];
    for (const token of (edgePart ?? "").trim().split(/\s+/).filter(Boolean)) {
      const match = /^([A-Za-z0-9]{1,3})-([A-Za-z0-9]{1,3}):(\d{1,3})$/.exec(token);
      if (!match) return { ok: false, error: `Could not read "${token}". Use A-B:4.` };
      edges.push([match[1]!, match[2]!, Number(match[3])]);
    }
    if (edges.length === 0 || edges.length > 16) {
      return { ok: false, error: "Enter 1 to 16 edges." };
    }
    const start = (startPart ?? "").trim();
    if (!edges.some(([a, b]) => a === start || b === start)) {
      return {
        ok: false,
        error: "Name a start node from those edges after the slash.",
      };
    }
    return { ok: true, value: { edges, start } };
  },
  formatInput: ({ edges, start }) =>
    `${edges.map(([a, b, w]) => `${a}-${b}:${w}`).join(" ")} / ${start}`,

  buildFrames(input) {
    const nodes = [...new Set(input.edges.flatMap(([a, b]) => [a, b]))];
    const dist: Record<string, number> = Object.fromEntries(
      nodes.map((n) => [n, Infinity])
    );
    dist[input.start] = 0;
    const settled = new Set<string>();
    const frames: Frame<State>[] = [];

    const snap = (
      line: number,
      op: string,
      current: string | null,
      frontier: string | null = null
    ) => {
      const tones: Record<string, GraphNodeTone> = {};
      for (const n of nodes) {
        tones[n] =
          n === current
            ? "current"
            : n === frontier
              ? "frontier"
              : settled.has(n)
                ? "visited"
                : "idle";
      }
      frames.push(
        frame({ tones, dist: { ...dist }, input }, line, op, {
          settled: settled.size,
          current: current ?? "—",
        })
      );
    };

    snap(0, `Start at ${input.start} with distance 0.`, input.start);
    for (;;) {
      const next = nodes
        .filter((n) => !settled.has(n) && dist[n] !== Infinity)
        .sort((a, b) => dist[a]! - dist[b]!)[0];
      if (next === undefined) break;
      settled.add(next);
      snap(2, `${next} is nearest at ${dist[next]}, so it is settled.`, next);
      for (const [a, b, w] of input.edges) {
        if (a !== next && b !== next) continue;
        const v = a === next ? b : a;
        if (settled.has(v)) continue;
        const through = dist[next]! + w;
        if (through < dist[v]!) {
          dist[v] = through;
          snap(4, `Through ${next}, ${v} costs ${through}. That is shorter.`, next, v);
        } else {
          snap(3, `Through ${next}, ${v} would cost ${through}. Not shorter.`, next, v);
        }
      }
    }
    snap(1, "Every reachable node is settled.", null);
    return frames;
  },

  render({ state }) {
    const pairs: [string, string][] = state.input.edges.map(([a, b]) => [a, b]);
    const adjacency = buildAdjacency(pairs);
    const layout = layoutByDistance(adjacency, state.input.start);
    const height = Math.max(...Object.values(layout).map((p) => p.y)) + 30;
    return (
      <div className="space-y-4">
        <GraphView
          adjacency={adjacency}
          layout={layout}
          tones={state.tones}
          height={height}
        />
        <CellRow>
          {Object.entries(state.dist).map(([node, d]) => (
            <Cell
              key={node}
              value={d === Infinity ? INFINITY_LABEL : d}
              label={node}
              showIndex={false}
              tone={
                state.tones[node] === "visited"
                  ? "done"
                  : state.tones[node] === "current"
                    ? "active"
                    : "idle"
              }
            />
          ))}
        </CellRow>
        <p className="text-xs text-muted-foreground">
          Edge weights:{" "}
          <span className="font-mono">
            {state.input.edges.map(([a, b, w]) => `${a}-${b} ${w}`).join(", ")}
          </span>
        </p>
      </div>
    );
  },
};
