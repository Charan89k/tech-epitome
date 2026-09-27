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
  queue: string[];
  order: string[];
  level: number;
  input: GraphInput;
};

/**
 * Breadth-first search, laid out by distance from the start.
 *
 * Because the layout puts each level on its own row, the frontier is
 * visibly a horizontal band sweeping downward — which is exactly the
 * property that makes BFS find shortest paths.
 */
export const breadthFirstViz: Visualization<State, GraphInput> = {
  key: "breadth-first-search",
  title: "Breadth First Search",
  description:
    "Explore level by level using a queue. Because nodes are reached in order of distance, the first time BFS touches a node it has arrived by a shortest path.",
  complexity: { time: "O(V + E)", space: "O(V)" },
  pseudocode: [
    "queue = [start]; visited = {start}",
    "while queue:",
    "    for _ in range(len(queue)):   # one whole level",
    "        node = queue.popleft()",
    "        for nxt in neighbours(node):",
    "            if nxt not in visited:",
    "                visited.add(nxt)  # mark on ENQUEUE",
    "                queue.append(nxt)",
    "    level += 1",
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

    const visited = new Set<string>([input.start]);
    const order: string[] = [];
    let level = 0;

    // `level` holds the nodes being dequeued this round; `pending` collects
    // the next round. They are kept separate rather than reassigning one
    // array mid-iteration, which is how this originally dropped nodes.
    let current: string[] = [input.start];
    let cursor = 0;

    tones[input.start] = "frontier";

    const snapshot = (line: number, operation: string, pending: string[]) => {
      // The queue as the reader should see it: what is left of this level,
      // followed by everything discovered for the next one.
      const queue = [...current.slice(cursor), ...pending];
      frames.push(
        frame(
          { tones: { ...tones }, queue, order: [...order], level, input },
          line,
          operation,
          {
            level,
            queue: queue.join(" ") || "—",
            visited: visited.size,
            order: order.join(" ") || "—",
          }
        )
      );
    };

    snapshot(0, `Start at ${input.start}. It is marked visited as it is enqueued.`, []);

    while (current.length > 0) {
      const pending: string[] = [];

      for (cursor = 0; cursor < current.length; cursor += 1) {
        const node = current[cursor]!;
        tones[node] = "current";
        snapshot(3, `Dequeue ${node} (level ${level}).`, pending);

        for (const neighbour of adjacency.get(node) ?? []) {
          if (visited.has(neighbour)) continue;
          visited.add(neighbour);
          pending.push(neighbour);
          tones[neighbour] = "frontier";
          snapshot(
            6,
            `${neighbour} is new. Mark it visited now, on enqueue — not on dequeue, or it could enter the queue twice.`,
            pending
          );
        }

        tones[node] = "visited";
        order.push(node);
        snapshot(3, `${node} is fully explored.`, pending);
      }

      cursor = 0;
      current = pending;
      level += 1;

      if (current.length > 0) {
        snapshot(8, `Level ${level - 1} done. Frontier is now ${current.join(", ")}.`, []);
      }
    }

    snapshot(8, `Traversal complete. Visit order: ${order.join(" → ")}.`, []);
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
