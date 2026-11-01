import { balancedBracketsViz } from "./algorithms/balanced-brackets";
import { binarySearchViz } from "./algorithms/binary-search";
import { bstInsertViz } from "./algorithms/bst-insert";
import { dijkstraViz } from "./algorithms/dijkstra";
import { hashTableViz } from "./algorithms/hash-table";
import { insertionSortViz } from "./algorithms/insertion-sort";
import { kruskalViz } from "./algorithms/kruskal";
import { lcsViz } from "./algorithms/longest-common-subsequence";
import { minHeapViz } from "./algorithms/min-heap";
import { nQueensViz } from "./algorithms/n-queens";
import { breadthFirstViz } from "./algorithms/breadth-first";
import { depthFirstViz } from "./algorithms/depth-first";
import { linkedListReversalViz } from "./algorithms/linked-list-reversal";
import { queueViz } from "./algorithms/queue";
import { slidingWindowViz } from "./algorithms/sliding-window";
import { twoPointersViz } from "./algorithms/two-pointers";
import { writePointerViz } from "./algorithms/write-pointer";
import { erase, type ErasedVisualization } from "./types";

/**
 * Every visualization, keyed by the string a content block uses.
 *
 * Content references these by key rather than importing them, so a chapter
 * embedding a visualization does not drag the whole engine into its bundle,
 * and an unknown key degrades to a visible message rather than a crash.
 */
export const VISUALIZATIONS: Record<string, ErasedVisualization> = {
  [twoPointersViz.key]: erase(twoPointersViz),
  [writePointerViz.key]: erase(writePointerViz),
  [slidingWindowViz.key]: erase(slidingWindowViz),
  [binarySearchViz.key]: erase(binarySearchViz),
  [linkedListReversalViz.key]: erase(linkedListReversalViz),
  [breadthFirstViz.key]: erase(breadthFirstViz),
  [depthFirstViz.key]: erase(depthFirstViz),
  [insertionSortViz.key]: erase(insertionSortViz),
  [balancedBracketsViz.key]: erase(balancedBracketsViz),
  [bstInsertViz.key]: erase(bstInsertViz),
  [minHeapViz.key]: erase(minHeapViz),
  [dijkstraViz.key]: erase(dijkstraViz),
  [nQueensViz.key]: erase(nQueensViz),
  [lcsViz.key]: erase(lcsViz),
  [queueViz.key]: erase(queueViz),
  [hashTableViz.key]: erase(hashTableViz),
  [kruskalViz.key]: erase(kruskalViz),
};

export const VISUALIZATION_KEYS = Object.keys(VISUALIZATIONS);

export function getVisualization(key: string) {
  return VISUALIZATIONS[key] ?? null;
}
