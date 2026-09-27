/**
 * Highlights: the shared vocabulary.
 *
 * A highlight is an anchor into the *rendered text* of one content block:
 * `blockIndex` picks the block, and `startOffset`/`endOffset` index into
 * that block element's `textContent`. `quote` is stored alongside so a
 * highlight can be recognised as stale when the block behind it changes —
 * an anchor that silently moves is worse than one that admits it is lost.
 *
 * Deliberately offsets into the DOM's `textContent` rather than into
 * `blockToPlainText`. The two differ (the plain-text projection joins list
 * items with newlines, for instance), and the offsets have to agree with
 * what the browser's Selection API reports or nothing lines up.
 *
 * Pure, with no imports, so both the server validator and the browser
 * layer use exactly the same limits.
 */

/** Content a learner may highlight. A subset of `EntityType`. */
export const HIGHLIGHTABLE = ["CHAPTER", "PROBLEM"] as const;
export type Highlightable = (typeof HIGHLIGHTABLE)[number];

/**
 * The palette.
 *
 * Four, and closed. An arbitrary colour string would be written into a
 * class name or a style attribute, and a fixed set means the renderer can
 * map to Tailwind classes that actually exist in the build.
 */
export const HIGHLIGHT_COLORS = ["ember", "sky", "mint", "violet"] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export const DEFAULT_HIGHLIGHT_COLOR: HighlightColor = "ember";

export const HIGHLIGHT_COLOR_LABELS: Record<HighlightColor, string> = {
  ember: "Amber",
  sky: "Blue",
  mint: "Green",
  violet: "Purple",
};

/**
 * Limits, enforced identically on both sides.
 *
 * `maxLength` exists because a selection is a user-controlled span and
 * `quote` is a TEXT column: without it, one drag across a long chapter
 * writes the whole chapter into a row, repeatedly.
 */
export const HIGHLIGHT_LIMITS = {
  /** No document in the product is near this many blocks. */
  maxBlockIndex: 500,
  /** Characters in one highlight. A paragraph or two, not a chapter. */
  maxLength: 2_000,
  /** Highlights one learner may hold on one piece of content. */
  maxPerEntity: 200,
} as const;

export type HighlightAnchor = {
  blockIndex: number;
  startOffset: number;
  endOffset: number;
  quote: string;
};

export type HighlightRangeProblem =
  | "block-out-of-range"
  | "offsets-inverted"
  | "offsets-negative"
  | "too-long"
  | "empty-quote"
  | "quote-length-mismatch";

/**
 * Checks an anchor is internally coherent.
 *
 * Note the last rule: `quote` must be exactly as long as the range claims.
 * Without it a client could store a 5-character range with a 2,000-
 * character quote, which is both a storage lie and the shape of an abuse
 * vector. The check is on length rather than content, because the server
 * cannot re-render the block to compare the text itself.
 */
export function validateAnchor(
  anchor: HighlightAnchor
): { ok: true } | { ok: false; problem: HighlightRangeProblem } {
  const { blockIndex, startOffset, endOffset, quote } = anchor;

  if (
    !Number.isInteger(blockIndex) ||
    blockIndex < 0 ||
    blockIndex > HIGHLIGHT_LIMITS.maxBlockIndex
  ) {
    return { ok: false, problem: "block-out-of-range" };
  }

  if (
    !Number.isInteger(startOffset) ||
    !Number.isInteger(endOffset) ||
    startOffset < 0 ||
    endOffset < 0
  ) {
    return { ok: false, problem: "offsets-negative" };
  }

  if (endOffset <= startOffset) return { ok: false, problem: "offsets-inverted" };

  if (endOffset - startOffset > HIGHLIGHT_LIMITS.maxLength) {
    return { ok: false, problem: "too-long" };
  }

  if (quote.trim().length === 0) return { ok: false, problem: "empty-quote" };

  if (quote.length !== endOffset - startOffset) {
    return { ok: false, problem: "quote-length-mismatch" };
  }

  return { ok: true };
}

/** Two anchors are the same highlight when they cover the same span. */
export function sameAnchor(a: HighlightAnchor, b: HighlightAnchor): boolean {
  return (
    a.blockIndex === b.blockIndex &&
    a.startOffset === b.startOffset &&
    a.endOffset === b.endOffset
  );
}

/**
 * Whether two anchors overlap within the same block.
 *
 * Used to refuse a highlight that merely re-covers text already
 * highlighted, which otherwise stacks `<mark>` elements and produces a
 * colour nobody chose.
 */
export function anchorsOverlap(a: HighlightAnchor, b: HighlightAnchor): boolean {
  if (a.blockIndex !== b.blockIndex) return false;
  return a.startOffset < b.endOffset && b.startOffset < a.endOffset;
}
