import {
  GraphView,
  buildAdjacency,
  formatGraph,
  layoutByDistance,
  parseGraph,
  type GraphInput,
  type GraphNodeTone,
} from "./graph-shared";
import { frame, type Frame, type Visualization } from "../types";

type State = {
  tones: Record<string, GraphNodeTone>;
  stack: string[];
  order: string[];
  input: GraphInput;
};

/**
 * Depth-first search on the same graph as the BFS visualization.
 *
 * Running both over an identical graph is the point: the contrast between
 * a frontier sweeping level by level and a single path plunging to the
 * bottom is far clearer side by side than described in prose.
 */
export const depthFirstViz: Visualization<State, GraphInput> = {
  key: "depth-first-search",
  title: "Depth First Search",
  description:
    "Follow one path as far as it goes, then retreat and try the next. Compare it with breadth-first search on the same graph: DFS finds a path, not the shortest one.",
  complexity: { time: "O(V + E)", space: "O(V)" },
  pseudocode: [
    "def explore(node):",
    "    visited.add(node)",
    "    for nxt in neighbours(node):",
    "        if nxt not in visited:",
    "            explore(nxt)      # go deep before going wide",
    "    # returning here is the backtrack",
  ],
  defaultInput: {
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["C", "D"],
      ["C", "E"],
      ["D", "F"],
      ["E", "F"],
    ],
    start: "A",
  },
  inputHint: "Edges as A-B pairs, then the start node. Example: A-B A-C B-D / A",
  parseInput: parseGraph,
  formatInput: formatGraph,

  buildFrames(input) {
    const adjacency = buildAdjacency(input.edges);
    const frames: Frame<State>[] = [];

    const tones: Record<string, GraphNodeTone> = {};
    for (const node of adjacency.keys()) tones[node] = "idle";

    const visited = new Set<string>();
    const stack: string[] = [];
    const order: string[] = [];

    const snapshot = (line: number, operation: string) =>
      frames.push(
        frame(
          { tones: { ...tones }, stack: [...stack], order: [...order], input },
          line,
          operation,
          {
            depth: stack.length,
            path: stack.join(" → ") || "—",
            visited: visited.size,
            order: order.join(" ") || "—",
          }
        )
      );

    // Written iteratively with an explicit stack so each recursive step can
    // emit its own frame; the shape still mirrors the pseudocode.
    function explore(node: string) {
      visited.add(node);
      stack.push(node);
      order.push(node);
      tones[node] = "current";
      snapshot(1, `Visit ${node}. Current path: ${stack.join(" → ")}.`);

      for (const neighbour of adjacency.get(node) ?? []) {
        if (visited.has(neighbour)) {
          snapshot(3, `${neighbour} is already visited — skip it.`);
          continue;
        }
        tones[node] = "frontier";
        explore(neighbour);
        tones[node] = "current";
        snapshot(5, `Back at ${node} after exploring ${neighbour}.`);
      }

      tones[node] = "visited";
      stack.pop();
      snapshot(5, `${node} has no unvisited neighbours left. Backtrack.`);
    }

    snapshot(0, `Start a depth-first walk at ${input.start}.`);
    explore(input.start);

    // Anything in a disconnected component still needs visiting.
    for (const node of adjacency.keys()) {
      if (!visited.has(node)) {
        snapshot(0, `${node} was unreachable from ${input.start}; start a new walk.`);
        explore(node);
      }
    }

    snapshot(5, `Traversal complete. Visit order: ${order.join(" → ")}.`);
    return frames;
  },

  render(frameData) {
    const { tones, input } = frameData.state;
    const adjacency = buildAdjacency(input.edges);
    const layout = layoutByDistance(adjacency, input.start);
    const height =
      Math.max(...Object.values(layout).map((position) => position.y)) + 30;

    return <GraphView adjacency={adjacency} layout={layout} tones={tones} height={height} />;
  },
};
