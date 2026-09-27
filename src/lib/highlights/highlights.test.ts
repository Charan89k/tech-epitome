import { describe, expect, it } from "vitest";

import {
  anchorFromSelection,
  anchorStillMatches,
  findBlock,
  HIGHLIGHT_ATTRIBUTE,
  paintHighlight,
  textNodesIn,
  unpaintHighlight,
} from "./dom";
import {
  anchorsOverlap,
  HIGHLIGHT_LIMITS,
  sameAnchor,
  validateAnchor,
} from "./types";

/**
 * Highlight anchoring.
 *
 * Two halves. The validator is the server's contract and the browser's
 * at once — both import it, so a client cannot be lenient where the
 * server is strict. The DOM half is the fiddly part: splitting a range
 * that crosses inline markup, unwrapping without leaving the tree in
 * pieces, and noticing when the content moved underneath an anchor.
 *
 * jsdom is the vitest environment, so the DOM half is genuinely
 * exercised rather than mocked.
 */

function anchor(over: Partial<Parameters<typeof validateAnchor>[0]> = {}) {
  return {
    blockIndex: 0,
    startOffset: 0,
    endOffset: 5,
    quote: "hello",
    ...over,
  };
}

describe("validateAnchor", () => {
  it("accepts a coherent anchor", () => {
    expect(validateAnchor(anchor())).toEqual({ ok: true });
  });

  it("rejects a negative or non-integer offset", () => {
    expect(validateAnchor(anchor({ startOffset: -1 })).ok).toBe(false);
    expect(validateAnchor(anchor({ startOffset: 1.5, endOffset: 6.5 })).ok).toBe(
      false
    );
  });

  it("rejects an inverted or empty range", () => {
    expect(validateAnchor(anchor({ startOffset: 9, endOffset: 4 }))).toEqual({
      ok: false,
      problem: "offsets-inverted",
    });
    expect(validateAnchor(anchor({ startOffset: 4, endOffset: 4 }))).toEqual({
      ok: false,
      problem: "offsets-inverted",
    });
  });

  it("rejects a block index outside any real document", () => {
    expect(validateAnchor(anchor({ blockIndex: -1 })).ok).toBe(false);
    expect(
      validateAnchor(anchor({ blockIndex: HIGHLIGHT_LIMITS.maxBlockIndex + 1 })).ok
    ).toBe(false);
  });

  it("rejects an oversized range", () => {
    const length = HIGHLIGHT_LIMITS.maxLength + 1;
    expect(
      validateAnchor(
        anchor({ startOffset: 0, endOffset: length, quote: "x".repeat(length) })
      )
    ).toEqual({ ok: false, problem: "too-long" });
  });

  it("rejects a quote whose length disagrees with the range", () => {
    // The abuse shape: a five-character range carrying a two-thousand
    // character payload. The server cannot re-render the block to compare
    // the text, but it can insist the arithmetic is consistent.
    expect(
      validateAnchor(anchor({ startOffset: 0, endOffset: 5, quote: "x".repeat(2000) }))
    ).toEqual({ ok: false, problem: "quote-length-mismatch" });
  });

  it("rejects a whitespace-only selection", () => {
    expect(validateAnchor(anchor({ quote: "     " }))).toEqual({
      ok: false,
      problem: "empty-quote",
    });
  });
});

describe("overlap", () => {
  it("treats an identical span as the same anchor", () => {
    expect(sameAnchor(anchor(), anchor())).toBe(true);
    expect(sameAnchor(anchor(), anchor({ startOffset: 1 }))).toBe(false);
  });

  it("detects a partial overlap within one block", () => {
    expect(
      anchorsOverlap(
        anchor({ startOffset: 0, endOffset: 10 }),
        anchor({ startOffset: 5, endOffset: 15 })
      )
    ).toBe(true);
  });

  it("does not treat adjacency as overlap", () => {
    // [0,5) and [5,10) share a boundary but no character.
    expect(
      anchorsOverlap(
        anchor({ startOffset: 0, endOffset: 5 }),
        anchor({ startOffset: 5, endOffset: 10 })
      )
    ).toBe(false);
  });

  it("never treats different blocks as overlapping", () => {
    expect(
      anchorsOverlap(
        anchor({ blockIndex: 0, startOffset: 0, endOffset: 10 }),
        anchor({ blockIndex: 1, startOffset: 0, endOffset: 10 })
      )
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------

function mount(html: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.replaceChildren(container);
  return container;
}

describe("painting", () => {
  it("wraps exactly the requested span", () => {
    const container = mount(
      `<div data-block-index="0"><p>The window only ever grows.</p></div>`
    );
    const block = findBlock(container, 0)!;

    paintHighlight(block, { startOffset: 4, endOffset: 10 }, {
      id: "h1",
      color: "ember",
      className: "marked",
    });

    const mark = block.querySelector("mark")!;
    expect(mark.textContent).toBe("window");
    expect(mark.getAttribute(HIGHLIGHT_ATTRIBUTE)).toBe("h1");
    // The block's text is unchanged; only its markup gained a wrapper.
    expect(block.textContent).toBe("The window only ever grows.");
  });

  it("splits across inline markup instead of restructuring the document", () => {
    // `surroundContents` throws on a range that partially selects an
    // element, so a span crossing <strong> has to become several marks.
    const container = mount(
      `<div data-block-index="0"><p>a <strong>bold</strong> claim</p></div>`
    );
    const block = findBlock(container, 0)!;

    const marks = paintHighlight(block, { startOffset: 0, endOffset: 11 }, {
      id: "h1",
      color: "ember",
      className: "marked",
    });

    expect(marks.length).toBeGreaterThan(1);
    expect(block.textContent).toBe("a bold claim");
    // The <strong> survived; the highlight did not flatten it.
    expect(block.querySelector("strong")).not.toBeNull();

    const marked = [...block.querySelectorAll("mark")]
      .map((m) => m.textContent)
      .join("");
    expect(marked).toBe("a bold claim".slice(0, 11));
  });

  it("restores the original markup when unpainted", () => {
    const html = `<div data-block-index="0"><p>a <strong>bold</strong> claim</p></div>`;
    const container = mount(html);
    const block = findBlock(container, 0)!;
    const before = block.innerHTML;

    paintHighlight(block, { startOffset: 0, endOffset: 11 }, {
      id: "h1",
      color: "ember",
      className: "marked",
    });
    expect(block.querySelectorAll("mark").length).toBeGreaterThan(0);

    unpaintHighlight(container, "h1");

    expect(block.querySelectorAll("mark")).toHaveLength(0);
    expect(block.innerHTML).toBe(before);
  });

  it("leaves other highlights alone when removing one", () => {
    const container = mount(
      `<div data-block-index="0"><p>one two three four</p></div>`
    );
    const block = findBlock(container, 0)!;

    paintHighlight(block, { startOffset: 0, endOffset: 3 }, {
      id: "a",
      color: "ember",
      className: "marked",
    });
    paintHighlight(block, { startOffset: 8, endOffset: 13 }, {
      id: "b",
      color: "sky",
      className: "marked",
    });

    unpaintHighlight(container, "a");

    expect(container.querySelectorAll(`mark[${HIGHLIGHT_ATTRIBUTE}="a"]`)).toHaveLength(
      0
    );
    expect(
      container.querySelector(`mark[${HIGHLIGHT_ATTRIBUTE}="b"]`)?.textContent
    ).toBe("three");
    expect(block.textContent).toBe("one two three four");
  });

  it("keeps offsets correct after a highlight is already painted", () => {
    // The second highlight's offsets are into the original text, not the
    // marked-up tree, so the walk must count text inside existing marks.
    const container = mount(
      `<div data-block-index="0"><p>one two three four</p></div>`
    );
    const block = findBlock(container, 0)!;

    paintHighlight(block, { startOffset: 0, endOffset: 3 }, {
      id: "a",
      color: "ember",
      className: "marked",
    });
    paintHighlight(block, { startOffset: 14, endOffset: 18 }, {
      id: "b",
      color: "sky",
      className: "marked",
    });

    expect(
      container.querySelector(`mark[${HIGHLIGHT_ATTRIBUTE}="b"]`)?.textContent
    ).toBe("four");
  });

  it("marks are focusable, so a highlight can be removed by keyboard", () => {
    const container = mount(`<div data-block-index="0"><p>some text</p></div>`);
    const block = findBlock(container, 0)!;

    paintHighlight(block, { startOffset: 0, endOffset: 4 }, {
      id: "h1",
      color: "ember",
      className: "marked",
    });

    const mark = block.querySelector("mark")!;
    expect(mark.getAttribute("tabindex")).toBe("0");
    expect(mark.getAttribute("role")).toBe("button");
  });
});

describe("staleness", () => {
  it("recognises an anchor that still points at its own words", () => {
    const container = mount(
      `<div data-block-index="0"><p>The window only ever grows.</p></div>`
    );
    const block = findBlock(container, 0)!;

    expect(
      anchorStillMatches(block, {
        blockIndex: 0,
        startOffset: 4,
        endOffset: 10,
        quote: "window",
      })
    ).toBe(true);
  });

  it("recognises an anchor the content has moved out from under", () => {
    // This is why `quote` is stored. Painting anyway would mark a
    // sentence the learner never chose.
    const container = mount(
      `<div data-block-index="0"><p>Actually, the window only ever grows.</p></div>`
    );
    const block = findBlock(container, 0)!;

    expect(
      anchorStillMatches(block, {
        blockIndex: 0,
        startOffset: 4,
        endOffset: 10,
        quote: "window",
      })
    ).toBe(false);
  });
});

describe("textNodesIn", () => {
  it("walks in document order, including inside existing marks", () => {
    const container = mount(
      `<div data-block-index="0"><p>a <mark>b</mark> c</p></div>`
    );
    const text = textNodesIn(findBlock(container, 0)!)
      .map((node) => node.data)
      .join("|");
    expect(text).toBe("a |b| c");
  });
});

describe("anchorFromSelection", () => {
  /** Builds a real Selection over the given text node offsets. */
  function select(node: Node, start: number, end: number): Selection {
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }

  it("produces the anchor for a simple selection", () => {
    const container = mount(
      `<div data-block-index="3"><p>The window only ever grows.</p></div>`
    );
    const text = findBlock(container, 3)!.querySelector("p")!.firstChild!;

    const anchor = anchorFromSelection(container, select(text, 4, 10));

    expect(anchor).not.toBeNull();
    expect(anchor!.blockIndex).toBe(3);
    expect(anchor!.startOffset).toBe(4);
    expect(anchor!.endOffset).toBe(10);
    expect(anchor!.quote).toBe("window");
  });

  it("refuses a collapsed selection", () => {
    const container = mount(`<div data-block-index="0"><p>text</p></div>`);
    const text = container.querySelector("p")!.firstChild!;
    expect(anchorFromSelection(container, select(text, 2, 2))).toBeNull();
  });

  it("refuses a selection spanning two blocks rather than clamping it", () => {
    // A highlight the learner did not draw is worse than no highlight,
    // and the model anchors to a single block by design.
    const container = mount(
      `<div data-block-index="0"><p>first block</p></div>` +
        `<div data-block-index="1"><p>second block</p></div>`
    );
    const first = findBlock(container, 0)!.querySelector("p")!.firstChild!;
    const second = findBlock(container, 1)!.querySelector("p")!.firstChild!;

    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(second, 6);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    expect(anchorFromSelection(container, selection)).toBeNull();
  });

  it("refuses a selection outside any block", () => {
    const container = mount(`<p>not in a block</p>`);
    const text = container.querySelector("p")!.firstChild!;
    expect(anchorFromSelection(container, select(text, 0, 3))).toBeNull();
  });

  it("refuses a whitespace-only selection", () => {
    const container = mount(`<div data-block-index="0"><p>a    b</p></div>`);
    const text = container.querySelector("p")!.firstChild!;
    expect(anchorFromSelection(container, select(text, 1, 5))).toBeNull();
  });

  it("refuses a selection longer than the limit", () => {
    const long = "x".repeat(HIGHLIGHT_LIMITS.maxLength + 50);
    const container = mount(`<div data-block-index="0"><p>${long}</p></div>`);
    const text = container.querySelector("p")!.firstChild!;
    expect(anchorFromSelection(container, select(text, 0, long.length))).toBeNull();
  });

  it("produces an anchor whose quote the validator accepts", () => {
    // The two halves have to agree, or the browser draws selections the
    // server then refuses.
    const container = mount(
      `<div data-block-index="0"><p>The window only ever grows.</p></div>`
    );
    const text = container.querySelector("p")!.firstChild!;
    const anchor = anchorFromSelection(container, select(text, 4, 10))!;

    expect(validateAnchor(anchor)).toEqual({ ok: true });
  });
});
