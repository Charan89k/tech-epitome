import type { AccessTier, Difficulty } from "@/generated/prisma/enums";
import type { Signature } from "@/lib/code-execution/signature";
import type { ContentBlock } from "@/types/content";

/**
 * Authoring format for a coding problem.
 *
 * All problem statements, hints and solutions in this directory are original
 * work written for CodeForge. Where a problem is inspired by a classic
 * algorithmic idea - and most fundamentals are, they are shared mathematics -
 * the framing, wording, constraints, examples and explanations are written
 * from scratch rather than adapted from any existing platform.
 *
 * `learningObjective` is required by the type on purpose. A problem that
 * cannot state in one sentence what it teaches is a variation, not a lesson,
 * and does not belong in the catalogue.
 */

export type SolutionSeed = {
  title: string;
  /** Worst first: the reader should walk the path they would in an interview. */
  order: number;
  intuition: string;
  /** Ordered prose steps. Rendered as a numbered list. */
  approach: string[];
  /** Keyed by Language enum value. Python and Java are authored for every problem. */
  code: Record<string, string>;
  timeComplexity: string;
  spaceComplexity: string;
  edgeCases: string[];
  commonMistakes: string[];
};

export type TestSeed = {
  input: string;
  expected: string;
  isSample?: boolean;
  explanation?: string;
};

export type ProblemSeed = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  access?: AccessTier;
  /** One sentence: what this problem exists to teach. */
  learningObjective: string;
  /** Topic slugs, created on demand by the seeder. */
  topics: string[];
  /** Pattern slugs. The first is the primary pattern the problem teaches. */
  patterns: string[];
  /** Description and worked examples, as content blocks. */
  statement: ContentBlock[];
  constraints: string[];
  signature: Signature;
  /** At least two samples, and enough hidden cases to catch the usual mistakes. */
  tests: TestSeed[];
  /** Three or four, escalating. The last may name the technique; none give code. */
  hints: string[];
  solutions: SolutionSeed[];
  expectedTime: string;
  expectedSpace: string;
};

/** Convenience builders so problem files stay readable. */
export function para(text: string): ContentBlock {
  return { type: "paragraph", content: [{ type: "text", value: text }] };
}

export function rich(
  ...nodes: ({ code: string } | { strong: string } | string)[]
): ContentBlock {
  return {
    type: "paragraph",
    content: nodes.map((node) =>
      typeof node === "string"
        ? ({ type: "text", value: node } as const)
        : "code" in node
          ? ({ type: "code", value: node.code } as const)
          : ({ type: "strong", value: node.strong } as const)
    ),
  };
}

export function bullets(...items: string[]): ContentBlock {
  return {
    type: "list",
    ordered: false,
    items: items.map((item) => [{ type: "text", value: item }]),
  };
}

export function example(
  input: string,
  output: string,
  steps: { state: string; note: string }[],
  title?: string
): ContentBlock {
  return { type: "example", title, input, output, steps };
}
