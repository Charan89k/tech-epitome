import type { ComponentProps } from "react";

import type { MiniDiagram } from "@/components/marketing/mini-diagrams";

export type DiagramKind = ComponentProps<typeof MiniDiagram>["kind"];

const RULES: [RegExp, DiagramKind][] = [
  [/window|interval|prefix/i, "window"],
  [/linked|list|fast.?slow|cycl/i, "list"],
  [/stack|queue|monotonic|heap|top.?k/i, "stack"],
  [/tree|trie|graph|breadth|depth|bfs|dfs|recurs|backtrack|union|divide/i, "tree"],
  [/grid|matrix|dynamic|hash|table|bit|greedy|string/i, "grid"],
  [/pointer|binary|search|array|sort|complex/i, "pointers"],
];

const FALLBACK: DiagramKind[] = ["pointers", "list", "window", "tree", "grid", "stack"];

/**
 * Picks a thumbnail for a topic from its name or slug. The thumbnails are
 * decorative (aria-hidden), so a loose keyword match is enough; anything
 * unmatched cycles through the set by position so neighbours differ.
 */
export function diagramFor(text: string, index = 0): DiagramKind {
  for (const [pattern, kind] of RULES) {
    if (pattern.test(text)) return kind;
  }
  return FALLBACK[index % FALLBACK.length]!;
}
