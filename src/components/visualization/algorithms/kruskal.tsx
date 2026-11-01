import { Cell, CellRow, type CellTone } from "../cells";
import { frame, type Frame, type Visualization } from "../types";
import { GraphView, buildAdjacency, edgeKey, layoutByDistance } from "./graph-shared";
import type { WeightedEdge } from "./dijkstra";

type Verdict = "waiting" | "checking" | "taken" | "skipped";
type State = {
  edges: { edge: WeightedEdge; verdict: Verdict }[];
  total: number;
  groups: number;
};

const VERDICT_TONE: Record<Verdict, CellTone> = {
  waiting: "idle",
  checking: "active",
  taken: "done",
  skipped: "excluded",
};

const edgeLabel = ([a, b]: WeightedEdge) => `${a}-${b}`;

/** Kruskal's algorithm: take the cheapest edge that joins two separate groups. */
export const kruskalViz: Visualization<State, WeightedEdge[]> = {
  key: "kruskal",
  title: "Kruskal's Minimum Spanning Tree",
  description:
    "Sort every edge by cost and take each one unless it would close a loop. Disjoint set union answers that question quickly.",
  complexity: { time: "O(E log E)", space: "O(V)" },
  pseudocode: [
    "sort the edges by weight",
    "for each edge u-v:",
    "    if find(u) != find(v):",
    "        take the edge; union(u, v)",
    "    otherwise skip it: it would close a loop",
  ],
  defaultInput: [
    ["A", "B", 4],
    ["A", "C", 1],
    ["C", "B", 2],
    ["B", "D", 5],
    ["C", "D", 8],
    ["D", "E", 3],
    ["B", "E", 7],
  ],
  inputHint: "Weighted edges. Example: A-B:4 A-C:1 C-B:2",
  parseInput(raw) {
    const edges: WeightedEdge[] = [];
    for (const token of raw.trim().split(/\s+/).filter(Boolean)) {
      const match = /^([A-Za-z0-9]{1,3})-([A-Za-z0-9]{1,3}):(\d{1,3})$/.exec(token);
      if (!match) return { ok: false, error: `Could not read "${token}". Use A-B:4.` };
      if (match[1] === match[2]) {
        return { ok: false, error: `${token} joins a node to itself.` };
      }
      edges.push([match[1]!, match[2]!, Number(match[3])]);
    }
    if (edges.length === 0 || edges.length > 16) {
      return { ok: false, error: "Enter 1 to 16 edges." };
    }
    return { ok: true, value: edges };
  },
  formatInput: (edges) => edges.map(([a, b, w]) => `${a}-${b}:${w}`).join(" "),

  buildFrames(input) {
    const sorted = [...input].sort((x, y) => x[2] - y[2]);
    const verdicts: Verdict[] = sorted.map(() => "waiting");
    const parent = new Map<string, string>();
    for (const [a, b] of sorted) {
      parent.set(a, a);
      parent.set(b, b);
    }
    const find = (node: string): string => {
      let root = node;
      while (parent.get(root) !== root) root = parent.get(root)!;
      return root;
    };

    let total = 0;
    let groups = parent.size;
    const frames: Frame<State>[] = [];
    const snap = (line: number, operation: string) =>
      frames.push(
        frame(
          {
            edges: sorted.map((edge, i) => ({ edge, verdict: verdicts[i]! })),
            total,
            groups,
          },
          line,
          operation,
          { total, groups }
        )
      );

    snap(0, `Sort the ${sorted.length} edges from cheapest to dearest.`);
    sorted.forEach((edge, index) => {
      const [a, b, weight] = edge;
      verdicts[index] = "checking";
      snap(2, `Are ${a} and ${b} already in one group?`);
      const rootA = find(a);
      const rootB = find(b);
      if (rootA === rootB) {
        verdicts[index] = "skipped";
        snap(4, `They are, so ${edgeLabel(edge)} would close a loop. Skip it.`);
        return;
      }
      parent.set(rootA, rootB);
      total += weight;
      groups -= 1;
      verdicts[index] = "taken";
      snap(
        3,
        `They are not, so take ${edgeLabel(edge)} for ${weight} and join their groups.`
      );
    });
    return frames;
  },

  render({ state }) {
    const pairs = state.edges.map(({ edge: [a, b] }): [string, string] => [a, b]);
    const adjacency = buildAdjacency(pairs);
    const layout = layoutByDistance(adjacency, pairs[0]![0]);
    const height = Math.max(...Object.values(layout).map((p) => p.y)) + 30;
    const taken = state.edges
      .filter(({ verdict }) => verdict === "taken")
      .map(({ edge: [a, b] }) => edgeKey(a, b));

    return (
      <div className="space-y-4">
        <GraphView
          adjacency={adjacency}
          layout={layout}
          tones={{}}
          height={height}
          highlightedEdges={taken}
        />
        <CellRow>
          {state.edges.map(({ edge, verdict }, index) => (
            <Cell
              key={index}
              value={edge[2]}
              label={edgeLabel(edge)}
              showIndex={false}
              tone={VERDICT_TONE[verdict]}
            />
          ))}
        </CellRow>
      </div>
    );
  },
};
