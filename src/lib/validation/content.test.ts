import { describe, expect, it, vi } from "vitest";

import { assertContent, parseContent } from "./content";
import { text, toPlainText } from "@/types/content";

const validDocument = [
  { type: "heading", level: 2, text: "Two pointers" },
  { type: "paragraph", content: [text("Walk from both ends.")] },
  {
    type: "complexity",
    rows: [{ operation: "Scan", time: "O(n)", space: "O(1)" }],
  },
];

describe("parseContent", () => {
  it("accepts a well-formed document", () => {
    expect(parseContent(validDocument)).toHaveLength(3);
  });

  it("degrades to an empty document rather than throwing on bad data", () => {
    // One malformed row must break its own chapter, not the whole page.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseContent([{ type: "nonsense" }], "chapter-x")).toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("degrades on a non-array value", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseContent({ type: "heading" })).toEqual([]);
    expect(parseContent(null)).toEqual([]);
    spy.mockRestore();
  });

  it("rejects a heading level the renderer does not handle", () => {
    // The page owns h1, and h4+ has no styling, so only 2 and 3 are valid.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseContent([{ type: "heading", level: 1, text: "Nope" }])).toEqual([]);
    spy.mockRestore();
  });
});

describe("assertContent", () => {
  it("throws on a write of malformed content", () => {
    // A bad write must never be persisted, unlike a bad read.
    expect(() => assertContent([{ type: "nonsense" }])).toThrow();
  });

  it("returns the document when valid", () => {
    expect(assertContent(validDocument)).toHaveLength(3);
  });
});

describe("toPlainText", () => {
  it("flattens every block type it is given", () => {
    const flattened = toPlainText(assertContent(validDocument));
    expect(flattened).toContain("Two pointers");
    expect(flattened).toContain("Walk from both ends.");
    expect(flattened).toContain("O(n)");
  });

  it("is deterministic, which highlight anchors depend on", () => {
    const doc = assertContent(validDocument);
    expect(toPlainText(doc)).toBe(toPlainText(doc));
  });
});
