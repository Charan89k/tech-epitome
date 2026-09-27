/**
 * The interview state machines.
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
 *
 * There are four interviews, and they are genuinely different shapes — a
 * behavioural interview has no complexity analysis and a system design
 * interview has no unit tests. Rather than one machine with branches, each
 * type owns a `MACHINES` entry: its stage order, its legal transitions and
 * the dimensions its feedback is written against. Adding a fifth type means
 * adding an entry, not editing eight switch statements.
 */

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------

/**
 * Every stage any interview can be in. Mirrors the `InterviewStage` enum in
 * the Prisma schema, which is one column shared by all four types — which
 * subset is legal is decided here, per type, not by the database.
 */
export const INTERVIEW_STAGES = [
  "INTRO",
  "CLARIFYING",
  "APPROACH",
  "SOLVING",
  "TESTING",
  "COMPLEXITY",
  "QUESTION",
  "PROBING",
  "ESTIMATION",
  "HIGH_LEVEL_DESIGN",
  "DEEP_DIVE",
  "SCALING",
  "DOMAIN_MODEL",
  "CLASS_DESIGN",
  "SOLID_REVIEW",
  "EXTENSIBILITY",
  "TRADEOFFS",
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
  QUESTION: "The question",
  PROBING: "Digging into the story",
  ESTIMATION: "Scale and estimates",
  HIGH_LEVEL_DESIGN: "High-level design",
  DEEP_DIVE: "Deep dive",
  SCALING: "Scaling and reliability",
  DOMAIN_MODEL: "Domain model",
  CLASS_DESIGN: "Class design",
  SOLID_REVIEW: "Design principles",
  EXTENSIBILITY: "Extensibility",
  TRADEOFFS: "Trade-offs",
  FOLLOW_UP: "Follow-up",
  WRAP_UP: "Wrapping up",
  ENDED: "Finished",
};

/** What the candidate is expected to be doing, shown in the UI. */
export const STAGE_GUIDANCE: Record<InterviewStage, string> = {
  INTRO: "The interviewer will begin shortly.",
  CLARIFYING:
    "Ask about anything ambiguous: input ranges, edge cases, what is out of scope. Real interviews reward this.",
  APPROACH:
    "Describe how you would solve it, and why. Talk through the trade-off before you write anything.",
  SOLVING: "Write your solution. Narrate what you are doing as you go.",
  TESTING:
    "Walk through your own code with a concrete input, including an edge case.",
  COMPLEXITY:
    "State the time and space complexity, and justify it from the structure.",
  QUESTION:
    "Tell the story. Situation, what you were responsible for, what you actually did, and how it turned out — in that order, and say 'I' rather than 'we'.",
  PROBING:
    "Answer with specifics: your own decisions, the thing that was hard, and what the outcome actually was.",
  ESTIMATION:
    "Put rough numbers on it — users, requests per second, storage growth. Show the arithmetic; the figure matters less than the reasoning.",
  HIGH_LEVEL_DESIGN:
    "Sketch the components and how a request flows between them. Name what each one owns.",
  DEEP_DIVE:
    "Go a level deeper on the part the interviewer picked: data model, partitioning, the exact failure you are guarding against.",
  SCALING:
    "What breaks first as this grows, and what you would do about it. Be specific about the bottleneck.",
  DOMAIN_MODEL:
    "Name the things in this domain and what each one is responsible for knowing. Resist adding a class until something needs it.",
  CLASS_DESIGN:
    "Give the classes their methods and say how they relate — composition, inheritance, dependency. Say which way the arrows point.",
  SOLID_REVIEW:
    "Defend the boundaries you drew. Which class has one reason to change, and which does not?",
  EXTENSIBILITY:
    "The interviewer will add a requirement. Say what changes in your design, and what does not have to.",
  TRADEOFFS:
    "Say what you gave up. A design with no cost has not been examined.",
  FOLLOW_UP: "The interviewer will change a constraint. Adapt your answer.",
  WRAP_UP: "Anything you would add with more time?",
  ENDED: "This interview is finished. Your feedback is below.",
};

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

/**
 * What the interviewer is being asked to do on this turn.
 *
 * Distinct from the tutor's request types on purpose: an interviewer
 * evaluates, a tutor helps. The overlap in names would be a trap.
 */
export const INTERVIEW_REQUEST_TYPES = [
  // Shared.
  "PRESENT_PROBLEM",
  "ASK_CLARIFICATION",
  "FOLLOW_UP",
  "ASK_WRAP_UP",
  "END_INTERVIEW",

  // DSA.
  "ASK_APPROACH",
  "REVIEW_REASONING",
  "REVIEW_CODE",
  "ASK_COMPLEXITY",

  // Behavioral.
  "ASK_BEHAVIORAL",
  "PROBE_STORY",

  // System design.
  "ASK_ESTIMATION",
  "REVIEW_ARCHITECTURE",
  "DEEP_DIVE",
  "ASK_SCALING",

  // Low-level design.
  "REVIEW_DOMAIN_MODEL",
  "REVIEW_CLASS_DESIGN",
  "ASK_SOLID",
  "ASK_EXTENSIBILITY",

  // Both design interviews.
  "ASK_TRADEOFFS",
] as const;

export type InterviewRequestType = (typeof INTERVIEW_REQUEST_TYPES)[number];

// ---------------------------------------------------------------------------
// Evaluation dimensions
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
  // Shared.
  "problemUnderstanding",
  "communication",

  // DSA.
  "approach",
  "correctness",
  "complexityReasoning",
  "codeQuality",
  "testing",
  "followUps",

  // Behavioral.
  "structure",
  "ownership",
  "impact",
  "reflection",
  "specificity",

  // System design.
  "requirementsScoping",
  "estimation",
  "architecture",
  "dataModelling",
  "scalability",
  "reliability",

  // Low-level design.
  "domainModelling",
  "responsibilities",
  "solidReasoning",
  "extensibility",

  // Both design interviews.
  "tradeoffReasoning",
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
  structure: "Structure of the answer",
  ownership: "Ownership",
  impact: "Impact",
  reflection: "Reflection",
  specificity: "Specificity",
  requirementsScoping: "Requirements and scoping",
  estimation: "Estimation",
  architecture: "Architecture",
  dataModelling: "Data modelling",
  scalability: "Scalability",
  reliability: "Reliability",
  domainModelling: "Domain modelling",
  responsibilities: "Responsibility assignment",
  solidReasoning: "Design principles",
  extensibility: "Extensibility",
  tradeoffReasoning: "Trade-off reasoning",
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

// ---------------------------------------------------------------------------
// The machines
// ---------------------------------------------------------------------------

export const INTERVIEW_TYPES = [
  "DSA",
  "BEHAVIORAL",
  "SYSTEM_DESIGN",
  "LLD",
] as const;

export type InterviewKind = (typeof INTERVIEW_TYPES)[number];

/**
 * The stage each request type is legal in, and where it leaves the
 * interview.
 *
 * `null` for `to` means "stay here" — the interviewer can ask several
 * clarifying questions without advancing.
 */
type Transition = { from: InterviewStage[]; to: InterviewStage | null };

export type InterviewMachine = {
  /** Ordered progress, for the stepper. ENDED is not a step. */
  progress: InterviewStage[];
  transitions: Partial<Record<InterviewRequestType, Transition>>;
  /** What the interviewer does next, given only the stage. */
  next: Partial<Record<InterviewStage, InterviewRequestType>>;
  /** Stages at which a code editor is worth showing. */
  codeStages: InterviewStage[];
  dimensions: EvaluationDimension[];
  label: string;
  /** One line describing what this interview is, shown before starting it. */
  blurb: string;
};

/**
 * END_INTERVIEW is legal from every stage of every machine except a
 * session already over: a candidate may always stop, and a stuck
 * interview must not be a dead end.
 */
function endFrom(progress: InterviewStage[]): Transition {
  return { from: progress, to: "ENDED" };
}

const DSA_PROGRESS: InterviewStage[] = [
  "INTRO",
  "CLARIFYING",
  "APPROACH",
  "SOLVING",
  "TESTING",
  "COMPLEXITY",
  "FOLLOW_UP",
  "WRAP_UP",
];

const BEHAVIORAL_PROGRESS: InterviewStage[] = [
  "INTRO",
  "QUESTION",
  "PROBING",
  "FOLLOW_UP",
  "WRAP_UP",
];

const SYSTEM_DESIGN_PROGRESS: InterviewStage[] = [
  "INTRO",
  "CLARIFYING",
  "ESTIMATION",
  "HIGH_LEVEL_DESIGN",
  "DEEP_DIVE",
  "SCALING",
  "TRADEOFFS",
  "WRAP_UP",
];

const LLD_PROGRESS: InterviewStage[] = [
  "INTRO",
  "CLARIFYING",
  "DOMAIN_MODEL",
  "CLASS_DESIGN",
  "SOLID_REVIEW",
  "EXTENSIBILITY",
  "TRADEOFFS",
  "WRAP_UP",
];

export const MACHINES: Record<InterviewKind, InterviewMachine> = {
  DSA: {
    label: "Coding (DSA)",
    blurb:
      "A problem you have not seen, worked out loud: clarify, plan, code, test it yourself, then account for the cost.",
    progress: DSA_PROGRESS,
    codeStages: ["APPROACH", "SOLVING", "TESTING", "COMPLEXITY", "FOLLOW_UP"],
    transitions: {
      PRESENT_PROBLEM: { from: ["INTRO"], to: "CLARIFYING" },
      ASK_CLARIFICATION: { from: ["CLARIFYING"], to: null },
      ASK_APPROACH: { from: ["CLARIFYING"], to: "APPROACH" },
      REVIEW_REASONING: { from: ["APPROACH"], to: "SOLVING" },
      REVIEW_CODE: { from: ["SOLVING", "TESTING"], to: "TESTING" },
      ASK_COMPLEXITY: { from: ["TESTING", "SOLVING"], to: "COMPLEXITY" },
      FOLLOW_UP: { from: ["COMPLEXITY", "FOLLOW_UP"], to: "FOLLOW_UP" },
      ASK_WRAP_UP: { from: ["FOLLOW_UP"], to: "WRAP_UP" },
      END_INTERVIEW: endFrom(DSA_PROGRESS),
    },
    next: {
      INTRO: "PRESENT_PROBLEM",
      CLARIFYING: "ASK_APPROACH",
      APPROACH: "REVIEW_REASONING",
      SOLVING: "REVIEW_CODE",
      TESTING: "ASK_COMPLEXITY",
      COMPLEXITY: "FOLLOW_UP",
      FOLLOW_UP: "ASK_WRAP_UP",
      WRAP_UP: "END_INTERVIEW",
      ENDED: "END_INTERVIEW",
    },
    dimensions: [
      "problemUnderstanding",
      "communication",
      "approach",
      "correctness",
      "complexityReasoning",
      "codeQuality",
      "testing",
      "followUps",
    ],
  },

  BEHAVIORAL: {
    label: "Behavioural",
    blurb:
      "One question about something you actually did, then the follow-ups a real interviewer asks when an answer stays vague.",
    progress: BEHAVIORAL_PROGRESS,
    codeStages: [],
    transitions: {
      ASK_BEHAVIORAL: { from: ["INTRO"], to: "QUESTION" },
      PROBE_STORY: { from: ["QUESTION", "PROBING"], to: "PROBING" },
      FOLLOW_UP: { from: ["PROBING", "FOLLOW_UP"], to: "FOLLOW_UP" },
      ASK_WRAP_UP: { from: ["FOLLOW_UP"], to: "WRAP_UP" },
      END_INTERVIEW: endFrom(BEHAVIORAL_PROGRESS),
    },
    next: {
      INTRO: "ASK_BEHAVIORAL",
      QUESTION: "PROBE_STORY",
      PROBING: "PROBE_STORY",
      FOLLOW_UP: "ASK_WRAP_UP",
      WRAP_UP: "END_INTERVIEW",
      ENDED: "END_INTERVIEW",
    },
    dimensions: [
      "communication",
      "structure",
      "ownership",
      "impact",
      "reflection",
      "specificity",
    ],
  },

  SYSTEM_DESIGN: {
    label: "System design",
    blurb:
      "A brief with no right answer: scope it, size it, draw it, then defend the part the interviewer pushes on.",
    progress: SYSTEM_DESIGN_PROGRESS,
    codeStages: [],
    transitions: {
      PRESENT_PROBLEM: { from: ["INTRO"], to: "CLARIFYING" },
      ASK_CLARIFICATION: { from: ["CLARIFYING"], to: null },
      ASK_ESTIMATION: { from: ["CLARIFYING", "ESTIMATION"], to: "ESTIMATION" },
      REVIEW_ARCHITECTURE: {
        from: ["ESTIMATION", "HIGH_LEVEL_DESIGN"],
        to: "HIGH_LEVEL_DESIGN",
      },
      DEEP_DIVE: { from: ["HIGH_LEVEL_DESIGN", "DEEP_DIVE"], to: "DEEP_DIVE" },
      ASK_SCALING: { from: ["DEEP_DIVE", "SCALING"], to: "SCALING" },
      ASK_TRADEOFFS: { from: ["SCALING", "TRADEOFFS"], to: "TRADEOFFS" },
      ASK_WRAP_UP: { from: ["TRADEOFFS"], to: "WRAP_UP" },
      END_INTERVIEW: endFrom(SYSTEM_DESIGN_PROGRESS),
    },
    next: {
      INTRO: "PRESENT_PROBLEM",
      CLARIFYING: "ASK_ESTIMATION",
      ESTIMATION: "REVIEW_ARCHITECTURE",
      HIGH_LEVEL_DESIGN: "DEEP_DIVE",
      DEEP_DIVE: "ASK_SCALING",
      SCALING: "ASK_TRADEOFFS",
      TRADEOFFS: "ASK_WRAP_UP",
      WRAP_UP: "END_INTERVIEW",
      ENDED: "END_INTERVIEW",
    },
    dimensions: [
      "problemUnderstanding",
      "communication",
      "requirementsScoping",
      "estimation",
      "architecture",
      "dataModelling",
      "scalability",
      "reliability",
      "tradeoffReasoning",
    ],
  },

  LLD: {
    label: "Low-level design",
    blurb:
      "One small system, modelled properly: what the classes are, what each one is the only thing that knows, and what it costs.",
    progress: LLD_PROGRESS,
    codeStages: ["CLASS_DESIGN", "SOLID_REVIEW", "EXTENSIBILITY", "TRADEOFFS"],
    transitions: {
      PRESENT_PROBLEM: { from: ["INTRO"], to: "CLARIFYING" },
      ASK_CLARIFICATION: { from: ["CLARIFYING"], to: null },
      REVIEW_DOMAIN_MODEL: {
        from: ["CLARIFYING", "DOMAIN_MODEL"],
        to: "DOMAIN_MODEL",
      },
      REVIEW_CLASS_DESIGN: {
        from: ["DOMAIN_MODEL", "CLASS_DESIGN"],
        to: "CLASS_DESIGN",
      },
      ASK_SOLID: { from: ["CLASS_DESIGN", "SOLID_REVIEW"], to: "SOLID_REVIEW" },
      ASK_EXTENSIBILITY: {
        from: ["SOLID_REVIEW", "EXTENSIBILITY"],
        to: "EXTENSIBILITY",
      },
      ASK_TRADEOFFS: { from: ["EXTENSIBILITY", "TRADEOFFS"], to: "TRADEOFFS" },
      ASK_WRAP_UP: { from: ["TRADEOFFS"], to: "WRAP_UP" },
      END_INTERVIEW: endFrom(LLD_PROGRESS),
    },
    next: {
      INTRO: "PRESENT_PROBLEM",
      CLARIFYING: "REVIEW_DOMAIN_MODEL",
      DOMAIN_MODEL: "REVIEW_CLASS_DESIGN",
      CLASS_DESIGN: "ASK_SOLID",
      SOLID_REVIEW: "ASK_EXTENSIBILITY",
      EXTENSIBILITY: "ASK_TRADEOFFS",
      TRADEOFFS: "ASK_WRAP_UP",
      WRAP_UP: "END_INTERVIEW",
      ENDED: "END_INTERVIEW",
    },
    dimensions: [
      "problemUnderstanding",
      "communication",
      "domainModelling",
      "responsibilities",
      "solidReasoning",
      "extensibility",
      "tradeoffReasoning",
    ],
  },
};

export function machineFor(type: InterviewKind): InterviewMachine {
  return MACHINES[type];
}

// ---------------------------------------------------------------------------
// The pure API the server and client share
// ---------------------------------------------------------------------------

/** Whether this request may be made from this stage, in this interview. */
export function isLegalTransition(
  type: InterviewKind,
  stage: InterviewStage,
  request: InterviewRequestType
): boolean {
  return MACHINES[type].transitions[request]?.from.includes(stage) ?? false;
}

/** The stage the interview is in after this request. */
export function nextStage(
  type: InterviewKind,
  stage: InterviewStage,
  request: InterviewRequestType
): InterviewStage {
  const transition = MACHINES[type].transitions[request];
  if (!transition?.from.includes(stage)) return stage;
  return transition.to ?? stage;
}

/**
 * What the interviewer does next, given only the type and the stage.
 *
 * The client calls this too, to label its button — but the server
 * recomputes it from the stored stage and ignores whatever the client
 * claimed. That is the whole point of keeping it pure and shared: one
 * definition, and the client's copy is advisory.
 */
export function defaultRequestFor(
  type: InterviewKind,
  stage: InterviewStage
): InterviewRequestType {
  return MACHINES[type].next[stage] ?? "END_INTERVIEW";
}

/** Stages at which the code editor is worth showing. */
export function codeIsRelevant(
  type: InterviewKind,
  stage: InterviewStage
): boolean {
  return MACHINES[type].codeStages.includes(stage);
}

export function progressStages(type: InterviewKind): InterviewStage[] {
  return MACHINES[type].progress;
}

export function stageIndex(type: InterviewKind, stage: InterviewStage): number {
  const stages = MACHINES[type].progress;
  const index = stages.indexOf(stage);
  return index === -1 ? stages.length : index;
}

/** The dimensions this type's feedback is written against. */
export function dimensionsFor(type: InterviewKind): EvaluationDimension[] {
  return MACHINES[type].dimensions;
}
