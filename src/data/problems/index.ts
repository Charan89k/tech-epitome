import { ARRAY_PROBLEMS } from "./arrays";
import { BINARY_SEARCH_PROBLEMS } from "./binary-search";
import { HASHING_PROBLEMS } from "./hashing";
import { TWO_POINTER_PROBLEMS } from "./two-pointers";
import { LINKED_LIST_PROBLEMS } from "./linked-lists";
import { RECURSION_PROBLEMS } from "./recursion";
import { SLIDING_WINDOW_PROBLEMS } from "./sliding-window";
import { STACK_QUEUE_PROBLEMS } from "./stacks-queues";
import { STRING_PROBLEMS } from "./strings";
import { DYNAMIC_PROGRAMMING_PROBLEMS } from "./dynamic-programming";
import { GREEDY_INTERVAL_PROBLEMS } from "./greedy-intervals";
import { GRID_GRAPH_PROBLEMS } from "./grids-graphs";
import { HEAP_BIT_MATH_PROBLEMS } from "./heaps-bits-math";
import { SEARCH_BACKTRACKING_PROBLEMS } from "./search-backtracking";
import type { ProblemSeed } from "./types";

export * from "./types";

/**
 * The full catalogue, in the order problem numbers are assigned.
 *
 * Grouped by topic so a file stays a reasonable size and so it is obvious
 * where a new problem belongs. The seeder assigns `number` from this order,
 * which is why appending is safe but reordering is not.
 */
export const PROBLEMS: ProblemSeed[] = [
  ...ARRAY_PROBLEMS,
  ...STRING_PROBLEMS,
  ...HASHING_PROBLEMS,
  ...TWO_POINTER_PROBLEMS,
  ...SLIDING_WINDOW_PROBLEMS,
  ...BINARY_SEARCH_PROBLEMS,
  ...LINKED_LIST_PROBLEMS,
  ...STACK_QUEUE_PROBLEMS,
  ...RECURSION_PROBLEMS,
  // Appended, never interleaved: problem numbers follow this order.
  ...DYNAMIC_PROGRAMMING_PROBLEMS,
  ...GREEDY_INTERVAL_PROBLEMS,
  ...GRID_GRAPH_PROBLEMS,
  ...HEAP_BIT_MATH_PROBLEMS,
  ...SEARCH_BACKTRACKING_PROBLEMS,
];
