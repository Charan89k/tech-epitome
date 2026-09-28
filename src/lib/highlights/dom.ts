import {
  HIGHLIGHT_LIMITS,
  type HighlightAnchor,
  type HighlightColor,
} from "./types";

/**
 * Turning a browser selection into an anchor, and an anchor back into
 * marked-up text.
 *
 * Kept out of the component so it can be tested. These are the fiddly
 * parts — walking text nodes, splitting a range that crosses inline
 * elements, unwrapping without leaving the DOM in pieces — and they are
 * exactly the parts that silently misbehave.
 *
 * Everything here operates on **one block element** whose `textContent`
 * defines the offset space. The caller finds that element by its
 * `data-block-index`.
 */

/** Marks carry this so a click can find which highlight it belongs to. */
export const HIGHLIGHT_ATTRIBUTE = "data-highlight-id";
const BLOCK_ATTRIBUTE = "data-block-index";

export function blockSelector(index: number): string {
  return `[${BLOCK_ATTRIBUTE}="${index}"]`;
}

export function findBlock(root: ParentNode, index: number): HTMLElement | null {
  return root.querySelector<HTMLElement>(blockSelector(index));
}

/**
 * The plain text of every rendered block, indexed by its block index.
 *
 * The array is dense and ordered, because anchor offsets were recorded
 * against exactly this projection: a gap or a reorder here would make a
 * repaired offset point at the wrong words. Missing indexes become empty
 * strings rather than being skipped, which keeps position === index.
 */
export function blockTexts(root: ParentNode): string[] {
  const blocks = root.querySelectorAll<HTMLElement>(`[${BLOCK_ATTRIBUTE}]`);
  const texts: string[] = [];

  for (const block of blocks) {
    const index = Number(block.getAttribute(BLOCK_ATTRIBUTE));
    if (!Number.isInteger(index) || index < 0) continue;
    while (texts.length <= index) texts.push("");
    texts[index] = block.textContent ?? "";
  }

  return texts;
}

/**
 * Every text node under `root`, in document order.
 *
 * Skips nothing: a `<mark>` from an existing highlight contains text that
 * still counts towards the offsets, or adding a second highlight after
 * the first would land in the wrong place.
 */
export function textNodesIn(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

/** Where a (node, offset) pair falls in `root`'s flattened text. */
function flatOffsetOf(root: Node, node: Node, offset: number): number | null {
  let total = 0;
  for (const text of textNodesIn(root)) {
    if (text === node) return total + offset;
    total += text.data.length;
  }
  // The selection boundary may be an element rather than a text node —
  // a triple-click selects the block itself. Treat a boundary on the
  // root as the very start or the very end.
  if (node === root) return offset === 0 ? 0 : total;
  return null;
}

/**
 * The anchor for the current selection, or null when there is not a
 * usable one.
 *
 * Refuses a selection that crosses blocks rather than clamping it. A
 * highlight the learner did not draw is worse than no highlight, and the
 * model anchors to a single block by design.
 */
export function anchorFromSelection(
  container: ParentNode,
  selection: Selection | null
): (HighlightAnchor & { block: HTMLElement }) | null {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const startBlock = enclosingBlock(range.startContainer);
  const endBlock = enclosingBlock(range.endContainer);

  if (!startBlock || startBlock !== endBlock) return null;

  const index = Number.parseInt(
    startBlock.getAttribute(BLOCK_ATTRIBUTE) ?? "",
    10
  );
  if (!Number.isInteger(index)) return null;

  const startOffset = flatOffsetOf(
    startBlock,
    range.startContainer,
    range.startOffset
  );
  const endOffset = flatOffsetOf(startBlock, range.endContainer, range.endOffset);
  if (startOffset === null || endOffset === null) return null;

  const from = Math.min(startOffset, endOffset);
  const to = Math.max(startOffset, endOffset);
  if (to <= from) return null;
  if (to - from > HIGHLIGHT_LIMITS.maxLength) return null;

  const quote = (startBlock.textContent ?? "").slice(from, to);
  if (quote.trim().length === 0) return null;

  return {
    blockIndex: index,
    startOffset: from,
    endOffset: to,
    quote,
    block: startBlock,
  };
}

/** The nearest ancestor carrying a block index, if any. */
export function enclosingBlock(node: Node | null): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (
      current.nodeType === Node.ELEMENT_NODE &&
      (current as HTMLElement).hasAttribute(BLOCK_ATTRIBUTE)
    ) {
      return current as HTMLElement;
    }
    current = current.parentNode;
  }
  return null;
}

/**
 * Wraps `[start, end)` of a block's text in `<mark>` elements.
 *
 * Several marks, not one: a range crossing an inline `<strong>` cannot be
 * surrounded by a single element without restructuring the document, and
 * restructuring a lesson to draw a highlight over it is the wrong trade.
 * One mark per text node it touches looks identical and leaves the
 * surrounding markup intact.
 *
 * Returns the marks created, so the caller can bind events to them.
 */
export function paintHighlight(
  block: HTMLElement,
  anchor: Pick<HighlightAnchor, "startOffset" | "endOffset">,
  options: { id: string; color: HighlightColor; className: string }
): HTMLElement[] {
  const marks: HTMLElement[] = [];
  let consumed = 0;

  // Snapshot first: wrapping mutates the tree as we go.
  for (const text of textNodesIn(block)) {
    const length = text.data.length;
    const nodeStart = consumed;
    const nodeEnd = consumed + length;
    consumed = nodeEnd;

    if (nodeEnd <= anchor.startOffset) continue;
    if (nodeStart >= anchor.endOffset) break;
    // Already inside a mark for this same highlight — can happen when
    // painting is retried after a re-render.
    if (text.parentElement?.getAttribute(HIGHLIGHT_ATTRIBUTE) === options.id) {
      continue;
    }

    const from = Math.max(0, anchor.startOffset - nodeStart);
    const to = Math.min(length, anchor.endOffset - nodeStart);
    if (to <= from) continue;

    const range = document.createRange();
    range.setStart(text, from);
    range.setEnd(text, to);

    const mark = document.createElement("mark");
    mark.setAttribute(HIGHLIGHT_ATTRIBUTE, options.id);
    mark.setAttribute("data-highlight-color", options.color);
    mark.className = options.className;
    // Reachable and operable by keyboard, since removing a highlight is
    // done by activating it.
    mark.setAttribute("tabindex", "0");
    mark.setAttribute("role", "button");

    try {
      range.surroundContents(mark);
      marks.push(mark);
    } catch {
      // A range that cannot be surrounded is skipped rather than
      // throwing: one unpaintable fragment must not stop the rest.
    }
  }

  return marks;
}

/** Removes every mark for one highlight, restoring the original text. */
export function unpaintHighlight(root: ParentNode, id: string): number {
  const marks = root.querySelectorAll<HTMLElement>(
    `mark[${HIGHLIGHT_ATTRIBUTE}="${CSS.escape(id)}"]`
  );

  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    // Re-join the text nodes the unwrap left adjacent, so the offsets of
    // any remaining highlight still line up with a clean walk.
    parent.normalize();
  }

  return marks.length;
}

/**
 * Whether the stored quote still matches the text at those offsets.
 *
 * A block that was edited leaves its highlights pointing at the wrong
 * words. This is how they are detected, so a stale one can be shown as
 * stale instead of quietly marking an unrelated sentence.
 */
export function anchorStillMatches(
  block: HTMLElement,
  anchor: HighlightAnchor
): boolean {
  const text = block.textContent ?? "";
  return text.slice(anchor.startOffset, anchor.endOffset) === anchor.quote;
}
