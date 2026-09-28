import { describe, expect, it } from "vitest";

import { resolveAnchor, resolveAnchors, type StoredAnchor } from "./anchor";

/**
 * The anchor repair rule.
 *
 * Two properties matter more than the rest, and both are failure modes
 * rather than features:
 *
 *   1. A highlight whose block merely *moved* must be found again. That is
 *      what happens every time a chapter gains a visual block, and losing
 *      the learner's highlight to our own restructuring is the bug this
 *      exists to prevent.
 *
 *   2. A highlight must never be re-bound to text that is not provably the
 *      same selection. An ambiguous match is stale, not a guess.
 */

const BLOCKS = [
  "The write pointer lags behind the read pointer.",
  "Every position written to has already been read.",
  "You can never clobber a value you still need.",
];

/** Builds an anchor pointing at a real substring of a real block. */
function anchorFor(blockIndex: number, quote: string): StoredAnchor {
  const start = BLOCKS[blockIndex]!.indexOf(quote);
  if (start === -1) throw new Error(`test setup: "${quote}" not in block ${blockIndex}`);
  return { blockIndex, startOffset: start, endOffset: start + quote.length, quote };
}

describe("an unchanged document", () => {
  it("resolves exactly, without searching", () => {
    const anchor = anchorFor(1, "already been read");
    expect(resolveAnchor(BLOCKS, anchor)).toEqual({
      status: "exact",
      blockIndex: 1,
      startOffset: anchor.startOffset,
      endOffset: anchor.endOffset,
    });
  });

  it("resolves a selection at the very start of a block", () => {
    const anchor = anchorFor(0, "The write pointer");
    expect(resolveAnchor(BLOCKS, anchor).status).toBe("exact");
  });

  it("resolves a selection running to the end of a block", () => {
    const anchor = anchorFor(2, "you still need.");
    expect(resolveAnchor(BLOCKS, anchor).status).toBe("exact");
  });
});

describe("a block that moved", () => {
  it("finds the quote again when blocks are inserted above it", () => {
    // Exactly what restructuring a chapter does: two visual blocks go in at
    // the top and every index below shifts by two.
    const shifted = ["A concept card.", "A before/after card.", ...BLOCKS];
    const anchor = anchorFor(1, "already been read");

    const result = resolveAnchor(shifted, anchor);
    expect(result.status).toBe("repaired");
    if (result.status === "stale") return;

    expect(result.blockIndex).toBe(3);
    expect(shifted[result.blockIndex]!.slice(result.startOffset, result.endOffset)).toBe(
      anchor.quote
    );
  });

  it("finds the quote when blocks are removed above it", () => {
    const shifted = BLOCKS.slice(1);
    const anchor = anchorFor(2, "clobber a value");

    const result = resolveAnchor(shifted, anchor);
    expect(result.status).toBe("repaired");
    if (result.status === "stale") return;
    expect(result.blockIndex).toBe(1);
  });

  it("repairs the offsets too, not only the block", () => {
    // The quote keeps its position inside the block, but the block's text
    // changed around it, so the offsets must be recomputed rather than reused.
    const edited = ["Note: " + BLOCKS[0]!, BLOCKS[1]!, BLOCKS[2]!];
    const anchor = anchorFor(0, "write pointer lags");

    const result = resolveAnchor(edited, anchor);
    expect(result.status).toBe("repaired");
    if (result.status === "stale") return;

    expect(result.startOffset).toBe(anchor.startOffset + "Note: ".length);
    expect(edited[0]!.slice(result.startOffset, result.endOffset)).toBe(anchor.quote);
  });
});

describe("what must never be repaired", () => {
  it("refuses an ambiguous quote that appears in two blocks", () => {
    // The core safety rule. Guessing between two identical sentences is
    // exactly how a highlight ends up on text the learner never marked.
    const duplicated = ["Order is preserved.", "Order is preserved."];
    const anchor: StoredAnchor = {
      blockIndex: 0,
      startOffset: 0,
      endOffset: "Order is preserved.".length,
      quote: "Order is preserved.",
    };

    // Deliberately drive it from an index that no longer matches, so the
    // search path runs rather than the exact path.
    expect(resolveAnchor(duplicated.slice(1), { ...anchor, blockIndex: 5 })).toEqual({
      status: "repaired",
      blockIndex: 0,
      startOffset: 0,
      endOffset: "Order is preserved.".length,
    });
    expect(resolveAnchor(duplicated, { ...anchor, blockIndex: 5 }).status).toBe("stale");
  });

  it("refuses an ambiguous quote that appears twice in one block", () => {
    const repeated = ["swap then swap again"];
    const result = resolveAnchor(repeated, {
      blockIndex: 9,
      startOffset: 0,
      endOffset: 4,
      quote: "swap",
    });
    expect(result.status).toBe("stale");
  });

  it("counts overlapping occurrences as ambiguous", () => {
    // "aa" occurs at 0 and at 1 in "aaa". Stepping by the quote length
    // instead of by one would miss the second and repair wrongly.
    const result = resolveAnchor(["aaa"], {
      blockIndex: 7,
      startOffset: 0,
      endOffset: 2,
      quote: "aa",
    });
    expect(result.status).toBe("stale");
  });

  it("refuses a quote that is no longer anywhere", () => {
    const result = resolveAnchor(BLOCKS, {
      blockIndex: 0,
      startOffset: 0,
      endOffset: 10,
      quote: "a sentence that was deleted",
    });
    expect(result).toEqual({ status: "stale" });
  });

  it("refuses an empty quote rather than matching everywhere", () => {
    expect(
      resolveAnchor(BLOCKS, {
        blockIndex: 0,
        startOffset: 0,
        endOffset: 0,
        quote: "",
      })
    ).toEqual({ status: "stale" });
  });

  it("refuses when the document is empty", () => {
    expect(resolveAnchor([], anchorFor(0, "write pointer")).status).toBe("stale");
  });

  it("does not resolve an out-of-range index by accident", () => {
    const result = resolveAnchor(BLOCKS, {
      blockIndex: 99,
      startOffset: 0,
      endOffset: 17,
      quote: "The write pointer",
    });
    // Found once, so repaired back to block 0 - never left pointing at 99.
    expect(result.status).toBe("repaired");
    if (result.status !== "stale") expect(result.blockIndex).toBe(0);
  });
});

describe("resolveAnchors", () => {
  const shifted = ["Inserted card.", ...BLOCKS];

  it("separates exact, repaired and stale, and reports only real repairs", () => {
    const items = [
      { id: "moved", ...anchorFor(1, "already been read") },
      { id: "gone", blockIndex: 0, startOffset: 0, endOffset: 5, quote: "absent text" },
      { id: "exact", blockIndex: 0, startOffset: 0, endOffset: 14, quote: "Inserted card." },
    ];

    const { resolved, stale, repairs } = resolveAnchors(shifted, items);

    expect(resolved.map((r) => r.id).sort()).toEqual(["exact", "moved"]);
    expect(stale.map((s) => s.id)).toEqual(["gone"]);

    // Only the moved one needs writing back; re-persisting an exact match
    // would be a pointless write on every page load.
    expect(repairs.map((r) => r.id)).toEqual(["moved"]);
    expect(repairs[0]!.blockIndex).toBe(2);
  });

  it("returns nothing to persist when nothing moved", () => {
    const items = [{ id: "a", ...anchorFor(0, "write pointer") }];
    expect(resolveAnchors(BLOCKS, items).repairs).toEqual([]);
  });

  it("every resolved anchor actually points at its own quote", () => {
    // The invariant that makes the whole thing safe, asserted directly.
    const items = [
      { id: "1", ...anchorFor(0, "write pointer") },
      { id: "2", ...anchorFor(1, "already been read") },
      { id: "3", ...anchorFor(2, "clobber a value") },
    ];

    for (const row of resolveAnchors(shifted, items).resolved) {
      const text = shifted[row.anchor.blockIndex]!;
      expect(text.slice(row.anchor.startOffset, row.anchor.endOffset)).toBe(row.quote);
    }
  });
});
