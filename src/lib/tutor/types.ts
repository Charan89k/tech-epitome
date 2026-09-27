/**
 * The tutor's vocabulary.
 *
 * Deliberately a discriminated union rather than a prompt-template engine.
 * The set of things a learner can ask a tutor on this platform is small and
 * known; making each one a named request type means the server decides what
 * context to gather and what instruction to give, instead of trusting a
 * free-form string to carry both. A quick-action button sends
 * `{ type: "HINT" }`, not a sentence that happens to contain the word hint.
 *
 * Nothing here imports Prisma or the AI layer, so the policy and context
 * builders that consume these types stay testable without a database.
 */

export const TUTOR_REQUEST_TYPES = [
  "EXPLAIN_CONCEPT",
  "EXPLAIN_PROBLEM",
  "HINT",
  "DEBUG_CODE",
  "ANALYZE_COMPLEXITY",
  "COMPARE_APPROACHES",
  "QUIZ_ME",
  "REVIEW_SOLUTION",
  "GENERAL_QUESTION",
  // Phase 7. Architecture review is a different job from code review: the
  // artefact is a graph, the failure modes are structural, and the right
  // answer is usually "it depends, and here is on what".
  "REVIEW_ARCHITECTURE",
  "EXPLAIN_TRADEOFF",
  "CHECK_SCALABILITY",
  "CHECK_FAILURE_MODES",
  "ASK_FOLLOWUP",
  // Phase 8. Reviewing a class design is a third distinct job: the
  // artefact is a type graph, the failure modes are about responsibility
  // and coupling, and the useful output is a question about a decision
  // rather than a corrected diagram.
  "REVIEW_DESIGN",
  "REVIEW_SOLID",
  "REVIEW_PATTERN",
  "FIND_DESIGN_SMELL",
  "SUGGEST_REFACTOR",
  "EXPLAIN_CLASS_RELATIONSHIP",
] as const;

export type TutorRequestType = (typeof TUTOR_REQUEST_TYPES)[number];

/** Which surface the learner asked from. Decides what context is available. */
export type TutorContextType =
  | "CHAPTER"
  | "PROBLEM"
  | "SYSTEM_DESIGN"
  | "LLD"
  | "GLOBAL";

/**
 * Where the conversation is anchored.
 *
 * `slug` rather than an id: the client already has the slug from the route,
 * and a slug cannot be used to probe for the existence of rows the learner
 * cannot otherwise see the way a raw cuid can.
 */
export type TutorAnchor =
  | { kind: "CHAPTER"; courseSlug: string; sectionSlug: string; chapterSlug: string }
  | { kind: "PROBLEM"; problemSlug: string }
  | { kind: "SYSTEM_DESIGN"; problemSlug: string }
  | { kind: "LLD"; problemSlug: string }
  | { kind: "GLOBAL" };

/**
 * The learner's live editor state, sent only from the problem workspace.
 *
 * Optional throughout: the tutor must work when the editor is untouched,
 * and "no code yet" is itself useful context.
 */
export type TutorCodeState = {
  language: string;
  code: string;
  /** Outcome of the last Run or Submit in this session, if any. */
  lastRun?: {
    mode: "run" | "submit";
    status: string;
    passed: number;
    total: number;
    /** Compiler or runtime stderr. Truncated before it reaches the model. */
    errorMessage?: string | null;
  };
};

/** What the client posts to the streaming endpoint. */
export type TutorRequest = {
  /** Omitted on the first turn; the server creates the thread and returns its id. */
  conversationId?: string;
  requestType: TutorRequestType;
  anchor: TutorAnchor;
  /** Free text. Required for GENERAL_QUESTION, optional alongside a quick action. */
  message?: string;
  code?: TutorCodeState;
};

/**
 * Server-sent events, one JSON object per `data:` line.
 *
 * `meta` arrives first so the client can adopt the conversation id before
 * any text lands — otherwise a fast first token races the thread creation
 * and the next turn opens a second conversation.
 */
export type TutorStreamEvent =
  | { type: "meta"; conversationId: string; messageId: string; hintLevel: number }
  | { type: "text"; text: string }
  | { type: "done"; hintLevel: number }
  | { type: "error"; message: string; retryable: boolean };

/** A persisted turn, as the UI renders it. */
export type TutorMessageView = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  requestType: TutorRequestType | null;
  hintLevel: number;
  createdAt: string;
};

/**
 * What the context header shows.
 *
 * Resolved on the server from the route, never typed by the learner — the
 * header is a promise about what the model actually received, so letting the
 * user edit it would make it a lie.
 */
export type TutorContextLabel = {
  contextType: TutorContextType;
  /** "Sliding Window" — the pattern or section. */
  primary: string | null;
  /** "Longest Substring Without Repeating Characters" — chapter or problem. */
  secondary: string | null;
  /** Short chips: difficulty, language. */
  chips: string[];
};

/** Quick actions, per surface. Rendered as buttons, sent as request types. */
export type TutorQuickAction = {
  id: string;
  label: string;
  icon: string;
  requestType: TutorRequestType;
  /** Shown as the learner's own turn in the transcript. */
  utterance: string;
  /** Needs editor content to make sense. */
  requiresCode?: boolean;
};

export const PROBLEM_QUICK_ACTIONS: TutorQuickAction[] = [
  {
    id: "hint",
    label: "Give me a hint",
    icon: "lightbulb",
    requestType: "HINT",
    utterance: "Give me a hint.",
  },
  {
    id: "explain-problem",
    label: "Explain the problem",
    icon: "search",
    requestType: "EXPLAIN_PROBLEM",
    utterance: "Explain what this problem is actually asking.",
  },
  {
    id: "think",
    label: "Help me think about it",
    icon: "brain",
    requestType: "COMPARE_APPROACHES",
    utterance: "Help me think about how to approach this.",
  },
  {
    id: "why-wrong",
    label: "Why is my solution wrong?",
    icon: "x",
    requestType: "DEBUG_CODE",
    utterance: "Why is my solution wrong?",
    requiresCode: true,
  },
  {
    id: "complexity",
    label: "Explain the time complexity",
    icon: "clock",
    requestType: "ANALYZE_COMPLEXITY",
    utterance: "Explain the time complexity here.",
  },
  {
    id: "another",
    label: "Show me another approach",
    icon: "repeat",
    requestType: "COMPARE_APPROACHES",
    utterance: "Is there another approach to this?",
  },
];

export const CHAPTER_QUICK_ACTIONS: TutorQuickAction[] = [
  {
    id: "simply",
    label: "Explain this simply",
    icon: "search",
    requestType: "EXPLAIN_CONCEPT",
    utterance: "Explain this chapter simply.",
  },
  {
    id: "example",
    label: "Give me an example",
    icon: "brain",
    requestType: "EXPLAIN_CONCEPT",
    utterance: "Give me a concrete example of this.",
  },
  {
    id: "quiz",
    label: "Quiz me",
    icon: "list",
    requestType: "QUIZ_ME",
    utterance: "Quiz me on this chapter.",
  },
  {
    id: "remember",
    label: "What should I remember?",
    icon: "bookmark",
    requestType: "EXPLAIN_CONCEPT",
    utterance: "What should I remember from this chapter?",
  },
  {
    id: "connect",
    label: "Connect this to a problem",
    icon: "repeat",
    requestType: "COMPARE_APPROACHES",
    utterance: "How does this connect to a problem I would be asked?",
  },
];

/** Shown in the problem workspace once the learner has written something. */
export const CODE_QUICK_ACTIONS: TutorQuickAction[] = [
  {
    id: "explain-code",
    label: "Explain my code",
    icon: "search",
    requestType: "REVIEW_SOLUTION",
    utterance: "Explain what my code currently does.",
    requiresCode: true,
  },
  {
    id: "find-bug",
    label: "Find the bug",
    icon: "x",
    requestType: "DEBUG_CODE",
    utterance: "Help me find the bug in my code.",
    requiresCode: true,
  },
  {
    id: "improve",
    label: "Improve my approach",
    icon: "repeat",
    requestType: "COMPARE_APPROACHES",
    utterance: "How could I improve my approach?",
    requiresCode: true,
  },
  {
    id: "analyze",
    label: "Analyze complexity",
    icon: "clock",
    requestType: "ANALYZE_COMPLEXITY",
    utterance: "What is the complexity of my code?",
    requiresCode: true,
  },
];

/**
 * Design-review actions.
 *
 * Every one of these asks the reviewer to interrogate the learner's own
 * architecture. None of them asks for "the answer" — the reference is
 * already revealed by submitting, and a tutor that hands it over earlier
 * would undercut the exercise.
 */
export const DESIGN_QUICK_ACTIONS: TutorQuickAction[] = [
  {
    id: "review-arch",
    label: "Review my architecture",
    icon: "search",
    requestType: "REVIEW_ARCHITECTURE",
    utterance: "Review the architecture I have drawn.",
  },
  {
    id: "scalability",
    label: "Where does this break at scale?",
    icon: "clock",
    requestType: "CHECK_SCALABILITY",
    utterance: "Where does my design break as traffic grows?",
  },
  {
    id: "failure",
    label: "What happens when it fails?",
    icon: "x",
    requestType: "CHECK_FAILURE_MODES",
    utterance: "What happens to my design when a component fails?",
  },
  {
    id: "tradeoff",
    label: "Explain a trade-off",
    icon: "brain",
    requestType: "EXPLAIN_TRADEOFF",
    utterance: "Explain the trade-off behind one of my choices.",
  },
  {
    id: "followup",
    label: "Ask me a follow-up",
    icon: "repeat",
    requestType: "ASK_FOLLOWUP",
    utterance: "Ask me a follow-up question about this design.",
  },
];

/**
 * Design-review actions for an LLD exercise.
 *
 * Each interrogates the learner's own class design. None asks for the
 * reference — it is unlocked by submitting, and a reviewer that handed
 * it over earlier would undercut the exercise.
 */
export const LLD_QUICK_ACTIONS: TutorQuickAction[] = [
  {
    id: "review-design",
    label: "Review my design",
    icon: "search",
    requestType: "REVIEW_DESIGN",
    utterance: "Review the class design I have drawn.",
  },
  {
    id: "review-solid",
    label: "Check against SOLID",
    icon: "list",
    requestType: "REVIEW_SOLID",
    utterance: "Which SOLID principle is my design most at odds with?",
  },
  {
    id: "smell",
    label: "Find a design smell",
    icon: "x",
    requestType: "FIND_DESIGN_SMELL",
    utterance: "What is the weakest part of this design?",
  },
  {
    id: "pattern",
    label: "Is a pattern warranted?",
    icon: "brain",
    requestType: "REVIEW_PATTERN",
    utterance: "Is there a design pattern that would genuinely help here?",
  },
  {
    id: "refactor",
    label: "Suggest a refactor",
    icon: "repeat",
    requestType: "SUGGEST_REFACTOR",
    utterance: "What one change would most improve this design?",
  },
  {
    id: "relationship",
    label: "Explain a relationship",
    icon: "clock",
    requestType: "EXPLAIN_CLASS_RELATIONSHIP",
    utterance: "Is the relationship between my classes the right kind?",
  },
];

export const GLOBAL_QUICK_ACTIONS: TutorQuickAction[] = [
  {
    id: "where-start",
    label: "Where should I start?",
    icon: "list",
    requestType: "GENERAL_QUESTION",
    utterance: "Given what I have studied so far, where should I go next?",
  },
  {
    id: "weak",
    label: "What am I weakest at?",
    icon: "brain",
    requestType: "GENERAL_QUESTION",
    utterance: "Which patterns am I weakest at, and what should I do about it?",
  },
  {
    id: "quiz-me",
    label: "Quiz me",
    icon: "list",
    requestType: "QUIZ_ME",
    utterance: "Quiz me on something I have already studied.",
  },
];
