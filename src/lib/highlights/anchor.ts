/**
 * Re-anchoring a highlight when the content behind it has moved.
 *
 * A highlight addresses a selection as `(blockIndex, startOffset, endOffset)`
 * plus the `quote` it was taken from. That address survives a re-render and
 * a theme change, but not an edit to the chapter: inserting a block above a
 * highlighted one shifts every index below it, and the highlight lands on
 * unrelated text — or, because the quote is checked before rendering, lands
 * nowhere and is reported stale.
 *
 * Reporting a moved highlight as stale is safe but wrong. The sentence the
 * learner marked is still on the page, one block further down, and telling
 * them their note "could not be shown" because *we* restructured the chapter
 * is the platform losing their work.
 *
 * So the quote is treated as the anchor's real identity and the index as a
 * hint. This module answers one question — "where does this highlight belong
 * now?" — and it is pure, so the rule can be tested without a DOM or a
 * database.
 *
 * ## Why not stable block IDs
 *
 * Giving every block a persistent id and storing it on the highlight is the
 * textbook answer, and it is better for content that is *edited in place*.
 * It is also a schema change, a backfill for every existing highlight, and a
 * new invariant for every content author to maintain — and it does not help
 * the case that actually breaks, which is a block that moved rather than
 * changed. The quote is already stored, already required, and already the
 * thing that proves the match. Using it costs no migration and puts no
 * existing highlight at risk.
 *
 * ## The safety rule
 *
 * A repair happens only when the quote occurs **exactly once** across the
 * whole document. Two identical sentences in two blocks are genuinely
 * ambiguous, and guessing between them is precisely the "silently attach a
 * highlight to unrelated text" failure this is meant to prevent. Ambiguous
 * and missing both resolve to `stale`, which the reader already handles.
 */

export type StoredAnchor = {
  blockIndex: number;
  startOffset: number;
  endOffset: number;
  quote: string;
};

export type ResolvedAnchor =
  | ({ status: "exact" | "repaired" } & Omit<StoredAnchor, "quote">)
  | { status: "stale" };

/** True when `quote` sits at exactly these offsets in this block's text. */
function matchesAt(
  blockText: string | undefined,
  anchor: Pick<StoredAnchor, "startOffset" | "endOffset" | "quote">
): boolean {
  if (blockText === undefined) return false;
  return blockText.slice(anchor.startOffset, anchor.endOffset) === anchor.quote;
}

/**
 * Finds where a highlight belongs in the current document.
 *
 * `blocks` is the plain-text projection of each block, in order — the same
 * projection the offsets were recorded against, so the caller must not
 * reorder or filter it.
 */
export function resolveAnchor(
  blocks: readonly string[],
  anchor: StoredAnchor
): ResolvedAnchor {
  // An empty quote can "occur" anywhere, so it can never be repaired and
  // must not be allowed to match by accident.
  if (anchor.quote.length === 0) return { status: "stale" };

  // 1. Still exactly where it was. The overwhelmingly common case, and the
  //    only one that costs nothing.
  if (matchesAt(blocks[anchor.blockIndex], anchor)) {
    return {
      status: "exact",
      blockIndex: anchor.blockIndex,
      startOffset: anchor.startOffset,
      endOffset: anchor.endOffset,
    };
  }

  // 2. Look for the quote everywhere, and collect *every* occurrence. The
  //    search cannot stop at the first hit: knowing whether the match is
  //    unique is the whole safety condition.
  const hits: { blockIndex: number; startOffset: number }[] = [];

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    const text = blocks[blockIndex]!;
    let from = 0;

    for (;;) {
      const at = text.indexOf(anchor.quote, from);
      if (at === -1) break;
      hits.push({ blockIndex, startOffset: at });
      if (hits.length > 1) return { status: "stale" }; // Ambiguous: stop early.
      from = at + 1; // +1, not +quote.length: overlapping repeats still count.
    }
  }

  if (hits.length !== 1) return { status: "stale" };

  const hit = hits[0]!;
  return {
    status: "repaired",
    blockIndex: hit.blockIndex,
    startOffset: hit.startOffset,
    endOffset: hit.startOffset + anchor.quote.length,
  };
}

/**
 * Resolves a batch, and reports which ones moved.
 *
 * Callers persist the repairs so the work is done once rather than on every
 * page load. Persisting is owner-scoped like every other highlight write.
 */
export function resolveAnchors<T extends StoredAnchor & { id: string }>(
  blocks: readonly string[],
  anchors: readonly T[]
): {
  resolved: (T & { anchor: Extract<ResolvedAnchor, { status: "exact" | "repaired" }> })[];
  stale: T[];
  repairs: { id: string; blockIndex: number; startOffset: number; endOffset: number }[];
} {
  const resolved: (T & {
    anchor: Extract<ResolvedAnchor, { status: "exact" | "repaired" }>;
  })[] = [];
  const stale: T[] = [];
  const repairs: {
    id: string;
    blockIndex: number;
    startOffset: number;
    endOffset: number;
  }[] = [];

  for (const item of anchors) {
    const result = resolveAnchor(blocks, item);
    if (result.status === "stale") {
      stale.push(item);
      continue;
    }

    resolved.push({ ...item, anchor: result });
    if (result.status === "repaired") {
      repairs.push({
        id: item.id,
        blockIndex: result.blockIndex,
        startOffset: result.startOffset,
        endOffset: result.endOffset,
      });
    }
  }

  return { resolved, stale, repairs };
}
