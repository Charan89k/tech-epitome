/**
 * Turning what the learner is looking at into what the model is told.
 *
 * Pure by design: this module receives already-fetched plain data and
 * returns a message array. The database work lives in `services/tutor.ts`.
 * Splitting it this way is what makes "does a problem turn actually include
 * the failing test?" and "is history really bounded?" assertable in a unit
 * test rather than only observable in production.
 *
 * The budgets below are the whole point of the file. A chapter body plus a
 * problem statement plus a code buffer plus twenty turns of history is tens
 * of thousands of tokens on every keystroke-sized question, which is slow,
 * expensive, and — because the relevant sentence is buried — usually worse
 * than sending a tenth of it.
 */

import type { ContentBlock, InlineNode } from "@/types/content";
import { clip, fence } from "./policy";
import type {
  TutorCodeState,
  TutorContextLabel,
  TutorRequestType,
} from "./types";

/** Character budgets. Roughly four characters to a token. */
export const BUDGETS = {
  chapterBody: 6_000,
  problemStatement: 2_500,
  code: 4_000,
  errorMessage: 1_200,
  /** Per historical message. */
  historyMessage: 1_500,
  /** How many prior turns travel with a request. */
  historyTurns: 8,
  /** Ceiling across all history, applied after the per-turn cap. */
  historyTotal: 8_000,
} as const;

export type AIChatMessage = { role: "system" | "user" | "assistant"; content: string };

// ---------------------------------------------------------------------------
// Content flattening
// ---------------------------------------------------------------------------

function inlineToText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "code":
          return `\`${node.value}\``;
        case "link":
          return node.value;
        default:
          return node.value;
      }
    })
    .join("");
}

/**
 * Flattens the structured content document to plain text for the model.
 *
 * Interactive blocks (quizzes, visualizations, embedded problem lists) are
 * summarised rather than expanded: their value is in the UI, and their
 * payload would crowd out the prose that actually explains the concept.
 */
export function blocksToText(blocks: ContentBlock[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        lines.push(`${"#".repeat(block.level)} ${block.text}`);
        break;
      case "paragraph":
        lines.push(inlineToText(block.content));
        break;
      case "list":
        block.items.forEach((item, index) => {
          lines.push(`${block.ordered ? `${index + 1}.` : "-"} ${inlineToText(item)}`);
        });
        break;
      case "code":
        lines.push(`\`\`\`${block.language}\n${block.code}\n\`\`\``);
        break;
      case "callout":
        lines.push(
          `> ${block.title ? `${block.title}: ` : ""}${inlineToText(block.content)}`
        );
        break;
      case "table":
        lines.push(block.headers.join(" | "));
        block.rows.forEach((row) => lines.push(row.join(" | ")));
        break;
      case "complexity":
        block.rows.forEach((row) =>
          lines.push(`${row.operation}: ${row.time} time, ${row.space} space`)
        );
        break;
      case "concept":
        lines.push(`${block.title}: ${inlineToText(block.body)}`);
        break;
      case "example":
        // The trace is the teaching content here, so the steps come along.
        lines.push(
          [
            `Worked example${block.title ? ` — ${block.title}` : ""}`,
            `Input: ${block.input}`,
            ...block.steps.map((step) => `- ${step.state}: ${step.note}`),
            `Output: ${block.output}`,
          ].join("\n")
        );
        break;
      case "recognition":
        lines.push(`Recognition cue: ${block.prompt}`);
        break;
      case "quiz":
      case "problems":
      case "visualization":
      case "divider":
        // Interactive or navigational; nothing for the model to read.
        break;
    }
  }

  return lines.filter(Boolean).join("\n\n");
}

// ---------------------------------------------------------------------------
// Context bundles
// ---------------------------------------------------------------------------

export type ChapterContext = {
  kind: "CHAPTER";
  courseTitle: string;
  sectionTitle: string;
  chapterTitle: string;
  summary: string | null;
  difficulty: string;
  objectives: string[];
  keyTakeaways: string[];
  bodyText: string;
  patterns: { name: string; tagline: string }[];
};

export type ProblemContext = {
  kind: "PROBLEM";
  title: string;
  number: number;
  difficulty: string;
  learningObjective: string | null;
  statementText: string;
  constraints: string[];
  patterns: { name: string; tagline: string }[];
  expectedTime: string | null;
  expectedSpace: string | null;
  /** Bodies of the authored hints the learner has already opened, in order. */
  revealedHints: string[];
  totalAuthoredHints: number;
  attempts: number;
  status: string;
  /**
   * The learner's most recent scored submission.
   *
   * Counts and the error string only. Hidden test inputs are never loaded
   * into this shape, so they cannot leak through the tutor even by mistake.
   */
  latestSubmission: {
    language: string;
    status: string;
    passed: number;
    total: number;
    errorMessage: string | null;
  } | null;
};

/**
 * A system-design exercise plus the learner's own architecture.
 *
 * The reference architecture is deliberately absent. The reviewer's job is
 * to interrogate what the learner drew, not to compare it against a stored
 * answer and report the diff — and a model that has the reference in
 * context will leak it however it is instructed not to.
 */
export type SystemDesignContext = {
  kind: "SYSTEM_DESIGN";
  title: string;
  tagline: string;
  difficulty: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  scaleEstimate: Record<string, string>;
  /** The learner's design, as prose. Coordinates would be meaningless here. */
  learnerDiagram: string;
  /** Structural facts about their design, computed not guessed. */
  observations: string[];
  learnerNotes: string;
  submitted: boolean;
};

export type GlobalContext = {
  kind: "GLOBAL";
  completedChapters: number;
  solvedProblems: number;
  /** Lowest-scoring practised patterns, worst first. */
  weakPatterns: { name: string; score: number }[];
  /** Most recently studied, for "where was I". */
  recentChapters: string[];
};

export type TutorContextBundle =
  | ChapterContext
  | ProblemContext
  | SystemDesignContext
  | GlobalContext;

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

/**
 * The context header text.
 *
 * Derived from the same bundle the model receives, so the header cannot
 * drift from reality — if it says "Sliding Window", the prompt said so too.
 */
export function labelFor(
  bundle: TutorContextBundle,
  code?: TutorCodeState
): TutorContextLabel {
  if (bundle.kind === "CHAPTER") {
    return {
      contextType: "CHAPTER",
      primary: bundle.patterns[0]?.name ?? bundle.sectionTitle,
      secondary: bundle.chapterTitle,
      chips: [titleCase(bundle.difficulty)],
    };
  }

  if (bundle.kind === "PROBLEM") {
    const chips = [titleCase(bundle.difficulty)];
    if (code?.language) chips.unshift(titleCase(code.language));
    return {
      contextType: "PROBLEM",
      primary: bundle.patterns[0]?.name ?? null,
      secondary: bundle.title,
      chips,
    };
  }

  if (bundle.kind === "SYSTEM_DESIGN") {
    return {
      contextType: "SYSTEM_DESIGN",
      primary: "System Design",
      secondary: bundle.title,
      chips: [titleCase(bundle.difficulty)],
    };
  }

  return {
    contextType: "GLOBAL",
    primary: null,
    secondary: null,
    chips: [],
  };
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/**
 * Renders a bundle into the fenced context block that precedes the question.
 *
 * Every field that originates outside the platform's own configuration —
 * course prose, problem statements, the learner's code — goes through
 * `fence`, which neutralises delimiters so content cannot break out of data
 * position and into instruction position.
 */
export function renderContext(
  bundle: TutorContextBundle,
  code?: TutorCodeState
): string {
  const sections: string[] = [];

  if (bundle.kind === "CHAPTER") {
    const facts = [
      `Course: ${bundle.courseTitle}`,
      `Section: ${bundle.sectionTitle}`,
      `Chapter: ${bundle.chapterTitle}`,
      `Difficulty: ${bundle.difficulty}`,
      bundle.summary ? `Summary: ${bundle.summary}` : null,
      bundle.objectives.length
        ? `Learning objectives: ${bundle.objectives.join("; ")}`
        : null,
      bundle.keyTakeaways.length
        ? `Key takeaways: ${bundle.keyTakeaways.join("; ")}`
        : null,
      bundle.patterns.length
        ? `Related patterns: ${bundle.patterns.map((p) => `${p.name} (${p.tagline})`).join("; ")}`
        : null,
    ].filter(Boolean);

    sections.push(fence("chapter_facts", facts.join("\n")));
    if (bundle.bodyText) {
      sections.push(fence("chapter_body", clip(bundle.bodyText, BUDGETS.chapterBody)));
    }
  }

  if (bundle.kind === "PROBLEM") {
    const facts = [
      `Problem #${bundle.number}: ${bundle.title}`,
      `Difficulty: ${bundle.difficulty}`,
      bundle.learningObjective
        ? `What it teaches: ${bundle.learningObjective}`
        : null,
      bundle.patterns.length
        ? `Patterns: ${bundle.patterns.map((p) => `${p.name} (${p.tagline})`).join("; ")}`
        : null,
      bundle.expectedTime || bundle.expectedSpace
        ? `Target complexity: ${bundle.expectedTime ?? "?"} time, ${bundle.expectedSpace ?? "?"} space`
        : null,
      bundle.constraints.length
        ? `Constraints: ${bundle.constraints.join("; ")}`
        : null,
      `Learner attempts so far: ${bundle.attempts} (status: ${bundle.status})`,
      `Authored hints opened: ${bundle.revealedHints.length} of ${bundle.totalAuthoredHints}`,
    ].filter(Boolean);

    sections.push(fence("problem_facts", facts.join("\n")));
    sections.push(
      fence("problem_statement", clip(bundle.statementText, BUDGETS.problemStatement))
    );

    if (bundle.latestSubmission) {
      const s = bundle.latestSubmission;
      const lines = [
        `Language: ${s.language}`,
        `Result: ${s.status}`,
        `Tests passed: ${s.passed}/${s.total}`,
        s.errorMessage
          ? `Error output: ${clip(s.errorMessage, BUDGETS.errorMessage)}`
          : null,
      ].filter(Boolean);
      // Hidden test inputs are never present in this shape — only counts and
      // the learner's own stderr — so there is nothing protected to leak.
      sections.push(fence("latest_submission", lines.join("\n")));
    }
  }

  if (bundle.kind === "SYSTEM_DESIGN") {
    const facts = [
      `Exercise: ${bundle.title}`,
      `Brief: ${bundle.tagline}`,
      `Difficulty: ${bundle.difficulty}`,
      `Functional requirements: ${bundle.functionalRequirements.join("; ")}`,
      `Non-functional requirements: ${bundle.nonFunctionalRequirements.join("; ")}`,
      `Scale assumptions: ${Object.entries(bundle.scaleEstimate)
        .map(([k, v]) => `${k} = ${v}`)
        .join("; ")}`,
      `Learner has submitted: ${bundle.submitted ? "yes" : "no"}`,
    ].filter(Boolean);

    sections.push(fence("exercise_brief", facts.join("\n")));
    sections.push(
      fence("learner_architecture", clip(bundle.learnerDiagram, BUDGETS.chapterBody))
    );

    if (bundle.observations.length > 0) {
      // Computed structural facts, handed over so the reviewer does not
      // have to re-derive them — and cannot get them wrong.
      sections.push(
        fence("structural_observations", bundle.observations.join("\n"))
      );
    }

    if (bundle.learnerNotes.trim()) {
      sections.push(
        fence("learner_rationale", clip(bundle.learnerNotes, BUDGETS.code))
      );
    } else {
      sections.push(
        fence("learner_rationale", "(The learner has not written any rationale yet.)")
      );
    }
  }

  if (bundle.kind === "GLOBAL") {
    const facts = [
      `Chapters completed: ${bundle.completedChapters}`,
      `Problems solved: ${bundle.solvedProblems}`,
      bundle.weakPatterns.length
        ? `Weakest practised patterns: ${bundle.weakPatterns
            .map((p) => `${p.name} (${p.score}/100)`)
            .join("; ")}`
        : "No pattern practice recorded yet.",
      bundle.recentChapters.length
        ? `Recently studied: ${bundle.recentChapters.join("; ")}`
        : null,
    ].filter(Boolean);

    sections.push(fence("learner_progress", facts.join("\n")));
  }

  if (code?.code?.trim()) {
    sections.push(
      fence(
        "learner_code",
        `Language: ${code.language}\n\n${clip(code.code, BUDGETS.code)}`
      )
    );

    if (code.lastRun) {
      const run = code.lastRun;
      const lines = [
        `Action: ${run.mode}`,
        `Status: ${run.status}`,
        `Tests passed: ${run.passed}/${run.total}`,
        run.errorMessage
          ? `Error output: ${clip(run.errorMessage, BUDGETS.errorMessage)}`
          : null,
      ].filter(Boolean);
      sections.push(fence("last_execution", lines.join("\n")));
    }
  } else if (code) {
    sections.push(
      fence("learner_code", `Language: ${code.language}\n\n(The editor is empty.)`)
    );
  }

  return sections.join("\n\n");
}

/**
 * Trims conversation history to a bounded window.
 *
 * Takes the most recent turns, caps each one, then enforces a total budget
 * from the newest backwards — so a single enormous pasted stack trace early
 * in a thread cannot starve the turns that actually matter now.
 */
export function boundHistory(
  history: { role: "USER" | "ASSISTANT"; content: string }[]
): AIChatMessage[] {
  const recent = history.slice(-BUDGETS.historyTurns);

  const kept: AIChatMessage[] = [];
  let used = 0;

  for (let i = recent.length - 1; i >= 0; i -= 1) {
    const turn = recent[i]!;
    const content = clip(turn.content, BUDGETS.historyMessage);
    if (used + content.length > BUDGETS.historyTotal && kept.length > 0) break;
    used += content.length;
    kept.unshift({
      role: turn.role === "USER" ? "user" : "assistant",
      content,
    });
  }

  return kept;
}

export type AssembleInput = {
  systemPrompt: string;
  bundle: TutorContextBundle;
  code?: TutorCodeState;
  history: { role: "USER" | "ASSISTANT"; content: string }[];
  /** What the learner said this turn. */
  utterance: string;
  requestType: TutorRequestType;
};

/**
 * The final message array handed to the provider.
 *
 * Context travels as its own user turn immediately before the question
 * rather than being appended to the system prompt. Two reasons: the system
 * prompt stays identical across turns, which is what makes it cacheable and
 * what keeps the tutor's character stable; and the fenced data sits
 * adjacent to the question it is meant to answer, where it is least likely
 * to be mistaken for standing instruction.
 */
export function assembleMessages(input: AssembleInput): AIChatMessage[] {
  const messages: AIChatMessage[] = [
    { role: "system", content: input.systemPrompt },
  ];

  messages.push(...boundHistory(input.history));

  const context = renderContext(input.bundle, input.code);
  messages.push({
    role: "user",
    content: `${context}\n\nLearner's question (${input.requestType}):\n${input.utterance}`,
  });

  return messages;
}
