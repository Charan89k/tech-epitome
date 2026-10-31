import {
  dimensionsFor,
  type EvaluationDimension,
  type InterviewFeedback,
  type InterviewKind,
} from "./types";

/**
 * Checks on model-written feedback before it is saved, beyond its JSON
 * shape (validated in the action):
 *
 *   1. The rubric is the interview type's rubric, exactly: every one of
 *      its dimensions once, and nothing from another type. Two sessions
 *      of the same type are therefore always assessed on the same axes.
 *   2. Every quotation is real. Text the feedback puts in quotation marks
 *      must appear in what the candidate said or wrote. A model that
 *      "quotes" something the candidate never said is fabricating, and
 *      that is worse than no feedback.
 *
 * Pure, so the rules are tested without a model.
 */

/** Quotes shorter than this are too generic to verify ("yes", "a map"). */
const MIN_QUOTE_CHARS = 12;

const QUOTE_PATTERNS = [/"([^"]+)"/g, /“([^”]+)”/g];

export function extractQuotes(text: string): string[] {
  const quotes: string[] = [];
  for (const pattern of QUOTE_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const quote = match[1]!.trim();
      if (quote.length >= MIN_QUOTE_CHARS) quotes.push(quote);
    }
  }
  return quotes;
}

/** Case, punctuation and whitespace do not make a quote false. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

export type FeedbackCheck = { ok: true } | { ok: false; problems: string[] };

export function checkFeedback(
  feedback: InterviewFeedback,
  type: InterviewKind,
  /** Everything the candidate said (their transcript turns) and wrote (code). */
  candidateText: string
): FeedbackCheck {
  const problems: string[] = [];
  const expected = dimensionsFor(type);
  const given = feedback.dimensions.map((d) => d.dimension);

  const missing = expected.filter((d) => !given.includes(d));
  const extra = given.filter((d) => !expected.includes(d as EvaluationDimension));
  const repeated = given.filter((d, i) => given.indexOf(d) !== i);
  if (missing.length) problems.push(`Missing dimensions: ${missing.join(", ")}.`);
  if (extra.length)
    problems.push(`Dimensions not in this rubric: ${extra.join(", ")}.`);
  if (repeated.length) problems.push(`Repeated dimensions: ${repeated.join(", ")}.`);

  const source = normalise(candidateText);
  const texts = [
    ...feedback.dimensions.map((d) => d.evidence),
    ...feedback.strengths,
    ...feedback.improvements,
    feedback.summary,
  ];
  for (const text of texts) {
    for (const quote of extractQuotes(text)) {
      if (!source.includes(normalise(quote))) {
        problems.push(`This quotation is not in the candidate's words: "${quote}".`);
      }
    }
  }

  return problems.length ? { ok: false, problems } : { ok: true };
}

/**
 * Questions to self-assess with when written feedback cannot be produced
 * (the AI provider is down, or its answer failed the checks above). They
 * describe the rubric; they judge nothing.
 */
export const SELF_CHECK: Record<EvaluationDimension, string> = {
  problemUnderstanding:
    "Did you restate the problem and ask about inputs, limits and edge cases before starting?",
  communication:
    "Could the interviewer follow your reasoning without asking you to repeat it?",
  approach: "Did you explain a plan, and why, before writing code?",
  correctness:
    "Did your solution handle the cases you were asked about, including the edges?",
  complexityReasoning:
    "Did you state the time and space cost and justify it from the structure of your code?",
  codeQuality:
    "Would someone else read your code easily: names, structure, no dead ends?",
  testing:
    "Did you walk through your own code on a concrete input, including an edge case?",
  followUps: "When a constraint changed, did you adapt the design rather than restart?",
  structure:
    "Did your story have a situation, what you did, and a result, in that order?",
  ownership: "Did you say what you personally decided and did, not only what 'we' did?",
  impact: "Did you name a concrete outcome: a number, a change, a consequence?",
  reflection: "Did you say what you learned or would do differently?",
  specificity:
    "Did you give real details (systems, figures, dates) rather than generalities?",
  requirementsScoping:
    "Did you agree on functional and non-functional requirements before designing?",
  estimation: "Did you estimate load or storage with visible arithmetic?",
  architecture: "Does every component you drew have a stated reason to exist?",
  dataModelling:
    "Did you choose a data model and storage that fit the access patterns?",
  scalability: "Did you say what breaks first as load grows, and how you would fix it?",
  reliability: "Did you cover failures: what happens when a component goes down?",
  domainModelling: "Do your classes match the real things in the problem?",
  responsibilities: "Does each class have one clear job?",
  solidReasoning:
    "Could you justify a boundary or abstraction by what it protects you from?",
  extensibility: "Could a new requirement be added without rewriting existing classes?",
  tradeoffReasoning: "Did you name what your design gives up, not only what it gains?",
};
