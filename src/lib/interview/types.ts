/**
 * The interview state machine.
 *
 * An interview is not a chat. It has an order, and the order is the
 * product: you clarify before you design, you design before you code,
 * you analyse complexity after there is something to analyse. A learner
 * who can skip to "give me feedback" has not had an interview.
 *
 * So the stage lives on the server, on the session row, and the client
 * never sends it. The client says "here is what I said"; the server
 * decides what stage that leaves the interview in and what the
 * interviewer is allowed to do next. Everything in this file is pure so
 * that ordering is testable without a database or a model.
 */

export const INTERVIEW_STAGES = [
  "INTRO",
  "CLARIFYING",
  "APPROACH",
  "SOLVING",
  "TESTING",
  "COMPLEXITY",
  "FOLLOW_UP",
  "WRAP_UP",
  "ENDED",
] as const;

export type InterviewStage = (typeof INTERVIEW_STAGES)[number];

export const STAGE_LABELS: Record<InterviewStage, string> = {
  INTRO: "Introduction",
  CLARIFYING: "Clarifying the problem",
  APPROACH: "Discussing the approach",
  SOLVING: "Working the solution",
  TESTING: "Testing",
  COMPLEXITY: "Complexity",
  FOLLOW_UP: "Follow-up",
  WRAP_UP: "Wrapping up",
  ENDED: "Finished",
};

/** What the learner is expected to be doing, shown in the UI. */
export const STAGE_GUIDANCE: Record<InterviewStage, string> = {
  INTRO: "The interviewer will present a problem shortly.",
  CLARIFYING:
    "Ask about anything ambiguous: input ranges, edge cases, what is out of scope. Real interviews reward this.",
  APPROACH:
    "Describe how you would solve it, and why. Talk through the trade-off before you write anything.",
  SOLVING: "Write your solution. Narrate what you are doing as you go.",
  TESTING: "Walk through your own code with a concrete input, including an edge case.",
  COMPLEXITY: "State the time and space complexity, and justify it from the structure.",
  FOLLOW_UP: "The interviewer will change a constraint. Adapt your approach.",
  WRAP_UP: "Anything you would add with more time?",
  ENDED: "This interview is finished. Your feedback is below.",
};

/**
 * What the interviewer is being asked to do on this turn.
 *
 * Distinct from the tutor's request types on purpose: an interviewer
 * evaluates, a tutor helps. The overlap in names would be a trap.
 */
export const INTERVIEW_REQUEST_TYPES = [
  "PRESENT_PROBLEM",
  "ASK_CLARIFICATION",
  "REVIEW_REASONING",
  "REVIEW_CODE",
  "ASK_COMPLEXITY",
  "FOLLOW_UP",
  "END_INTERVIEW",
] as const;

export type InterviewRequestType = (typeof INTERVIEW_REQUEST_TYPES)[number];

/**
 * The stage each request type is legal in, and where it leaves the
 * interview.
 *
 * `null` for `to` means "stay here" — the interviewer can ask several
 * clarifying questions without advancing.
 */
type Transition = { from: InterviewStage[]; to: InterviewStage | null };

export const TRANSITIONS: Record<InterviewRequestType, Transition> = {
  PRESENT_PROBLEM: { from: ["INTRO"], to: "CLARIFYING" },
  ASK_CLARIFICATION: { from: ["CLARIFYING"], to: null },
  REVIEW_REASONING: { from: ["CLARIFYING", "APPROACH"], to: "SOLVING" },
  REVIEW_CODE: { from: ["SOLVING", "TESTING"], to: "TESTING" },
  ASK_COMPLEXITY: { from: ["TESTING", "SOLVING"], to: "COMPLEXITY" },
  FOLLOW_UP: { from: ["COMPLEXITY", "FOLLOW_UP"], to: "FOLLOW_UP" },
  END_INTERVIEW: {
    // Endable from anywhere except a session already over — a candidate
    // may always stop, and a stuck interview should not be a dead end.
    from: [
      "INTRO",
      "CLARIFYING",
      "APPROACH",
      "SOLVING",
      "TESTING",
      "COMPLEXITY",
      "FOLLOW_UP",
      "WRAP_UP",
    ],
    to: "ENDED",
  },
};

/** Whether this request may be made from this stage. */
export function isLegalTransition(
  stage: InterviewStage,
  request: InterviewRequestType
): boolean {
  return TRANSITIONS[request].from.includes(stage);
}

/** The stage the interview is in after this request. */
export function nextStage(
  stage: InterviewStage,
  request: InterviewRequestType
): InterviewStage {
  if (!isLegalTransition(stage, request)) return stage;
  return TRANSITIONS[request].to ?? stage;
}

/**
 * What the interviewer does next, given only the stage.
 *
 * The client calls this too, to label its button — but the server
 * recomputes it from the stored stage and ignores whatever the client
 * claimed. That is the whole point of keeping it pure and shared: one
 * definition, and the client's copy is advisory.
 */
export function defaultRequestFor(stage: InterviewStage): InterviewRequestType {
  switch (stage) {
    case "INTRO":
      return "PRESENT_PROBLEM";
    case "CLARIFYING":
      return "REVIEW_REASONING";
    case "APPROACH":
      return "REVIEW_REASONING";
    case "SOLVING":
      return "REVIEW_CODE";
    case "TESTING":
      return "ASK_COMPLEXITY";
    case "COMPLEXITY":
      return "FOLLOW_UP";
    case "FOLLOW_UP":
    case "WRAP_UP":
    case "ENDED":
      return "END_INTERVIEW";
  }
}

/** Stages at which the code editor is worth showing. */
export function codeIsRelevant(stage: InterviewStage): boolean {
  return ["APPROACH", "SOLVING", "TESTING", "COMPLEXITY", "FOLLOW_UP"].includes(
    stage
  );
}

/** Ordered progress, for the stepper. ENDED is not a step. */
export const PROGRESS_STAGES: InterviewStage[] = [
  "INTRO",
  "CLARIFYING",
  "APPROACH",
  "SOLVING",
  "TESTING",
  "COMPLEXITY",
  "FOLLOW_UP",
  "WRAP_UP",
];

export function stageIndex(stage: InterviewStage): number {
  const index = PROGRESS_STAGES.indexOf(stage);
  return index === -1 ? PROGRESS_STAGES.length : index;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/**
 * The dimensions an interview is assessed on.
 *
 * Deliberately not a single number. A composite score invites comparing
 * two candidates on one axis, which is exactly the thing a real
 * interview debrief refuses to do — and it would imply a precision this
 * evaluation does not have, since it comes from a language model reading
 * a transcript.
 */
export const EVALUATION_DIMENSIONS = [
  "problemUnderstanding",
  "communication",
  "approach",
  "correctness",
  "complexityReasoning",
  "codeQuality",
  "testing",
  "followUps",
] as const;

export type EvaluationDimension = (typeof EVALUATION_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<EvaluationDimension, string> = {
  problemUnderstanding: "Problem understanding",
  communication: "Communication",
  approach: "Approach",
  correctness: "Correctness",
  complexityReasoning: "Complexity reasoning",
  codeQuality: "Code quality",
  testing: "Testing",
  followUps: "Handling follow-ups",
};

/**
 * Four bands rather than a number out of ten.
 *
 * "7/10" reads as a measurement. These read as a judgement, which is
 * what it is — and every band requires evidence from the transcript, so
 * the reader can disagree with it.
 */
export const RATING_BANDS = [
  "not_demonstrated",
  "developing",
  "solid",
  "strong",
] as const;

export type RatingBand = (typeof RATING_BANDS)[number];

export const BAND_LABELS: Record<RatingBand, string> = {
  not_demonstrated: "Not demonstrated",
  developing: "Developing",
  solid: "Solid",
  strong: "Strong",
};

export type DimensionAssessment = {
  dimension: EvaluationDimension;
  band: RatingBand;
  /** A quotation or specific reference from the transcript. Required. */
  evidence: string;
};

export type InterviewFeedback = {
  dimensions: DimensionAssessment[];
  strengths: string[];
  improvements: string[];
  summary: string;
};
