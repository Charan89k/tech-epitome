import { ARRAY_PROBLEMS } from "./arrays";
import { BINARY_SEARCH_PROBLEMS } from "./binary-search";
import { HASHING_PROBLEMS } from "./hashing";
import { TWO_POINTER_PROBLEMS } from "./two-pointers";
import { LINKED_LIST_PROBLEMS } from "./linked-lists";
import { RECURSION_PROBLEMS } from "./recursion";
import { SLIDING_WINDOW_PROBLEMS } from "./sliding-window";
import { STACK_QUEUE_PROBLEMS } from "./stacks-queues";
import { STRING_PROBLEMS } from "./strings";
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
];
