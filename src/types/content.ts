/**
 * Rich content blocks.
 *
 * Chapter bodies, problem statements and solution write-ups are all stored as
 * an ordered array of these, rather than as a markdown string.
 *
 * Why not markdown: the content has to embed live components - a stepped
 * visualization, an inline quiz, a complexity table that the search indexer
 * can read. A block array keeps that structured and validatable, lets the
 * renderer decide what is server-rendered vs. hydrated, and gives highlights
 * a stable address (block index + offset) to anchor to.
 */

import { describeDiagram } from "@/lib/diagram/layout";
import { parseDiagram } from "@/lib/diagram/schema";

export type InlineMark = "code" | "strong" | "em" | "link";

/** A run of text with at most one mark. Keeps the model flat and cheap. */
export type InlineNode =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string }
  | { type: "link"; value: string; href: string };

export type CalloutTone = "note" | "tip" | "warning" | "insight";

export type ComplexityRow = {
  operation: string;
  time: string;
  space: string;
  note?: string;
};

export type ContentBlock =
  /** Section heading. Levels 2 and 3 only; the page owns h1. */
  | { type: "heading"; level: 2 | 3; text: string; id?: string }
  | { type: "paragraph"; content: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | {
      type: "code";
      language: string;
      code: string;
      /** Optional caption shown above the block. */
      caption?: string;
      /** 1-based line numbers to highlight. */
      highlightLines?: number[];
    }
  | { type: "callout"; tone: CalloutTone; title?: string; content: InlineNode[] }
  | {
      type: "table";
      caption?: string;
      headers: string[];
      rows: string[][];
    }
  | { type: "complexity"; caption?: string; rows: ComplexityRow[] }
  /** A named idea worth isolating from the prose around it. */
  | { type: "concept"; title: string; body: InlineNode[] }
  /**
   * A worked example: concrete input, the steps taken, the result.
   * Separate from `code` because the point is the trace, not the listing -
   * each step is a sentence about state, and the reader follows the values
   * rather than reading a program.
   */
  | {
      type: "example";
      title?: string;
      input: string;
      steps: { state: string; note: string }[];
      output: string;
    }
  /**
   * An architecture diagram, stored as nodes and edges rather than an
   * image. Phase 7 added this so a system-design lesson can show a request
   * path that is themeable, screen-reader readable, and comparable against
   * what a learner draws in the workspace. The payload is validated by
   * `src/lib/diagram/schema.ts`, which owns its shape.
   */
  | {
      type: "architecture";
      caption?: string;
      diagram: unknown;
    }
  /** Embeds one of the registered visualizations by key. */
  | {
      type: "visualization";
      visualizationKey: string;
      title?: string;
      /** Initial input, shape depends on the visualization. */
      input?: unknown;
    }
  /** Embeds a quiz by slug. Rendered inline, scored server-side. */
  | { type: "quiz"; quizSlug: string }
  /** Links out to problems by slug, rendered as cards. */
  | { type: "problems"; slugs: string[]; title?: string }
  /** Pattern-recognition drill: "which pattern is this?" */
  | {
      type: "recognition";
      prompt: string;
      clues: string[];
      answerPatternSlug: string;
      explanation: string;
    }
  | { type: "divider" };

export type ContentDocument = ContentBlock[];

/** Convenience for authoring plain text in seeds and the admin editor. */
export function text(value: string): InlineNode {
  return { type: "text", value };
}

export function code(value: string): InlineNode {
  return { type: "code", value };
}

export function strong(value: string): InlineNode {
  return { type: "strong", value };
}

export function link(value: string, href: string): InlineNode {
  return { type: "link", value, href };
}

/**
 * Flattens a document to plain text.
 *
 * Used by the search indexer and by the highlight anchor, which addresses a
 * selection as (blockIndex, startOffset, endOffset) within this projection.
 * Both depend on it being deterministic, so it must stay pure and must not
 * reorder anything.
 */
export function toPlainText(document: ContentDocument): string {
  return document.map(blockToPlainText).filter(Boolean).join("\n\n");
}

export function blockToPlainText(block: ContentBlock): string {
  switch (block.type) {
    case "heading":
      return block.text;
    case "paragraph":
      return inlineToPlainText(block.content);
    case "list":
      return block.items.map((item) => inlineToPlainText(item)).join("\n");
    case "code":
      return block.code;
    case "callout":
      return [block.title, inlineToPlainText(block.content)]
        .filter(Boolean)
        .join(": ");
    case "architecture":
      // The caption plus the component vocabulary, so "which lesson shows a
      // CDN in front of object storage" is a findable question. The
      // geometry is not indexed; it carries no meaning.
      return [block.caption, describeDiagram(parseDiagram(block.diagram))]
        .filter(Boolean)
        .join("\n");
    case "table":
      return [block.headers.join(" "), ...block.rows.map((r) => r.join(" "))].join(
        "\n"
      );
    case "complexity":
      return block.rows
        .map((r) => `${r.operation} ${r.time} ${r.space}`)
        .join("\n");
    case "concept":
      return `${block.title}: ${inlineToPlainText(block.body)}`;
    case "example":
      return [
        block.title,
        block.input,
        ...block.steps.map((s) => `${s.state} ${s.note}`),
        block.output,
      ]
        .filter(Boolean)
        .join("\n");
    case "recognition":
      return [block.prompt, ...block.clues, block.explanation].join("\n");
    case "visualization":
      return block.title ?? "";
    case "problems":
      return block.title ?? "";
    case "quiz":
    case "divider":
      return "";
  }
}

export function inlineToPlainText(nodes: InlineNode[]): string {
  return nodes.map((node) => node.value).join("");
}
