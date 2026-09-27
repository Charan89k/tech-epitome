import "server-only";

import type {
  Difficulty,
  InterviewStatus,
  InterviewType,
  Language,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { describeClassDiagram } from "@/lib/class-diagram/layout";
import { parseClassDiagram } from "@/lib/class-diagram/schema";
import { describeDiagram } from "@/lib/diagram/layout";
import { parseDiagram } from "@/lib/diagram/schema";
import { parseContent } from "@/lib/validation/content";
import { toPlainText } from "@/types/content";
import type { InterviewKind, InterviewStage } from "@/lib/interview/types";

/**
 * Interview sessions: creation, state, transcript, evaluation.
 *
 * Two rules enforced here rather than in a route, so a future caller
 * cannot forget them:
 *
 *   1. **The stage is server-owned.** The client never sends it. Every
 *      read filters on `userId` in the same query that finds the row,
 *      so naming somebody else's session id matches nothing.
 *   2. **The reference solution is loaded only for feedback**, after
 *      the interview has ended. `loadInterviewContext` does not select
 *      it; `loadFeedbackContext` does, and only that.
 */

export type InterviewSummary = {
  id: string;
  type: InterviewType;
  difficulty: Difficulty;
  status: InterviewStatus;
  stage: InterviewStage;
  problemTitle: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number;
  hasFeedback: boolean;
};

/** Picks one at random, or nothing when the pool is empty. */
function pick<T>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  return rows[Math.floor(Math.random() * rows.length)] ?? null;
}

/**
 * Chooses the brief for a new session, server-side.
 *
 * Deliberately never takes an id from the client. Letting a candidate
 * name the problem lets them shop for one they have already solved,
 * which makes the practice worthless — and for the design types it
 * would let them pick the exercise whose reference they have already
 * unlocked.
 *
 * Difficulty is a filter for the three types that have one. Behavioural
 * questions are not graded by difficulty: "tell me about a conflict" is
 * not harder at senior level, the follow-ups are.
 */
async function chooseBrief(
  type: InterviewKind,
  difficulty: Difficulty
): Promise<
  | { ok: true; link: Partial<Record<"problemId" | "systemDesignProblemId" | "lldProblemId" | "behavioralQuestionId", string>> }
  | { ok: false; reason: string }
> {
  switch (type) {
    case "DSA": {
      const chosen = pick(
        await prisma.problem.findMany({
          where: { status: "PUBLISHED", difficulty },
          select: { id: true },
        })
      );
      return chosen
        ? { ok: true, link: { problemId: chosen.id } }
        : { ok: false, reason: "No problems are published at that difficulty yet." };
    }

    case "SYSTEM_DESIGN": {
      const chosen = pick(
        await prisma.systemDesignProblem.findMany({
          where: { status: "PUBLISHED", difficulty },
          select: { id: true },
        })
      );
      return chosen
        ? { ok: true, link: { systemDesignProblemId: chosen.id } }
        : {
            ok: false,
            reason: "No system design briefs are published at that difficulty yet.",
          };
    }

    case "LLD": {
      const chosen = pick(
        await prisma.lLDProblem.findMany({
          where: { status: "PUBLISHED", difficulty },
          select: { id: true },
        })
      );
      return chosen
        ? { ok: true, link: { lldProblemId: chosen.id } }
        : {
            ok: false,
            reason: "No low-level design briefs are published at that difficulty yet.",
          };
    }

    case "BEHAVIORAL": {
      const chosen = pick(
        await prisma.behavioralQuestion.findMany({
          where: { status: "PUBLISHED" },
          select: { id: true },
        })
      );
      return chosen
        ? { ok: true, link: { behavioralQuestionId: chosen.id } }
        : {
            ok: false,
            reason: "No behavioural questions are published yet.",
          };
    }
  }
}

/**
 * Starts a session against a randomly chosen published brief.
 *
 * All four interview types are supported. The type decides which table
 * the brief comes from and which state machine conducts the session;
 * see `src/lib/interview/types.ts`.
 */
export async function createInterview(params: {
  userId: string;
  type: InterviewType;
  difficulty: Difficulty;
  language: Language;
}): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const brief = await chooseBrief(params.type as InterviewKind, params.difficulty);
  if (!brief.ok) return brief;

  const session = await prisma.interviewSession.create({
    data: {
      userId: params.userId,
      type: params.type,
      difficulty: params.difficulty,
      language: params.language,
      stage: "INTRO",
      status: "IN_PROGRESS",
      ...brief.link,
    },
    select: { id: true },
  });

  return { ok: true, id: session.id };
}

// ---------------------------------------------------------------------------
// Briefs
//
// Four interview types read from four tables, and the split between what
// the candidate may see and what only the feedback pass may see is
// different in each. Rather than repeat that split in three functions,
// both halves are selected once here and rendered by two pure functions —
// so "is the reference selected?" is answerable by reading one `select`.
// ---------------------------------------------------------------------------

/**
 * Everything the candidate and the interviewer are allowed to see.
 *
 * Note what is absent for each type: the DSA `solutions` and hidden test
 * cases, the system design `architecture`, `tradeoffs`, `bottlenecks`,
 * `scalingNotes`, `dataModel` and `apiDesign`, the LLD `classDiagram`,
 * `code`, `tradeoffs` and `designPatterns`, and the behavioural
 * `lookingFor` rubric. A model that holds the answer cannot help steering
 * towards it, and steering is exactly what an interview must not do.
 */
const BRIEF_SELECT = {
  problem: { select: { title: true, statement: true, slug: true } },
  systemDesignProblem: {
    select: {
      title: true,
      tagline: true,
      functionalRequirements: true,
      nonFunctionalRequirements: true,
    },
  },
  lldProblem: {
    select: {
      title: true,
      tagline: true,
      requirements: true,
      constraints: true,
      entities: true,
    },
  },
  behavioralQuestion: {
    select: {
      prompt: true,
      // The interviewer's own script, not the answer: these are the
      // questions a human interviewer would have in front of them. The
      // rubric (`lookingFor`) is what must not be here, and is not.
      followUps: true,
      category: { select: { name: true } },
    },
  },
} as const;

type BriefRow = {
  type: InterviewType;
  problem: { title: string; statement: unknown; slug: string } | null;
  systemDesignProblem: {
    title: string;
    tagline: string;
    functionalRequirements: string[];
    nonFunctionalRequirements: string[];
  } | null;
  lldProblem: {
    title: string;
    tagline: string;
    requirements: string[];
    constraints: string[];
    entities: unknown;
  } | null;
  behavioralQuestion: {
    prompt: string;
    followUps: string[];
    category: { name: string };
  } | null;
};

function bullets(heading: string, items: string[]): string | null {
  if (items.length === 0) return null;
  return `${heading}:\n${items.map((item) => `- ${item}`).join("\n")}`;
}

/** The title shown in a list and at the top of the room. */
function briefTitle(row: BriefRow, sessionId: string): string {
  switch (row.type) {
    case "DSA":
      return row.problem?.title ?? "Problem";
    case "SYSTEM_DESIGN":
      return row.systemDesignProblem?.title ?? "Design brief";
    case "LLD":
      return row.lldProblem?.title ?? "Design brief";
    case "BEHAVIORAL":
      return row.behavioralQuestion
        ? `${row.behavioralQuestion.category.name} question`
        : "Behavioural question";
    default:
      return `Interview ${sessionId.slice(0, 6)}`;
  }
}

/**
 * The brief as plain text.
 *
 * Doubles as what the candidate reads in the room and as what goes into
 * the model's context, which is deliberate: if the two could differ, the
 * interviewer could be asking about something the candidate cannot see.
 */
function briefStatement(row: BriefRow, sessionId: string): string {
  switch (row.type) {
    case "DSA":
      return row.problem
        ? toPlainText(parseContent(row.problem.statement, `interview:${sessionId}`))
        : "";

    case "SYSTEM_DESIGN": {
      const brief = row.systemDesignProblem;
      if (!brief) return "";
      return [
        brief.tagline,
        bullets("The system must", brief.functionalRequirements),
        bullets("It also has to", brief.nonFunctionalRequirements),
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    case "LLD": {
      const brief = row.lldProblem;
      if (!brief) return "";
      const entities = Array.isArray(brief.entities)
        ? (brief.entities as { name?: unknown; responsibility?: unknown }[])
            .map((entity) =>
              typeof entity?.name === "string"
                ? `- ${entity.name}${
                    typeof entity.responsibility === "string"
                      ? `: ${entity.responsibility}`
                      : ""
                  }`
                : null
            )
            .filter((line): line is string => line !== null)
        : [];
      return [
        brief.tagline,
        bullets("Requirements", brief.requirements),
        bullets("You may assume", brief.constraints),
        entities.length > 0
          ? `Things the brief expects to exist (candidates, not a design):\n${entities.join("\n")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    case "BEHAVIORAL": {
      const question = row.behavioralQuestion;
      if (!question) return "";
      return [
        question.prompt,
        bullets(
          "Follow-ups available to the interviewer (do not read these out as a list)",
          question.followUps
        ),
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    default:
      return "";
  }
}

export type InterviewDetail = {
  id: string;
  type: InterviewType;
  difficulty: Difficulty;
  status: InterviewStatus;
  stage: InterviewStage;
  language: Language;
  code: string;
  problemTitle: string;
  /** The brief as the candidate sees it. Never the solution. */
  problemStatement: string;
  startedAt: Date;
  endedAt: Date | null;
  transcript: { id: string; role: "USER" | "ASSISTANT"; content: string; at: Date }[];
  feedback: {
    dimensions: { dimension: string; band: string; evidence: string }[];
    strengths: string[];
    improvements: string[];
    summary: string;
  } | null;
};

/**
 * One session, scoped to its owner.
 *
 * Returns null when the caller does not own it — indistinguishable from
 * a session that never existed, so probing an id leaks nothing.
 */
export async function getInterview(
  id: string,
  userId: string
): Promise<InterviewDetail | null> {
  const session = await prisma.interviewSession.findFirst({
    where: { id, userId },
    select: {
      id: true,
      type: true,
      difficulty: true,
      status: true,
      stage: true,
      language: true,
      code: true,
      startedAt: true,
      endedAt: true,
      // Candidate-visible brief only. See BRIEF_SELECT: no solutions, no
      // hidden tests, no reference architecture, no reference class
      // diagram, no behavioural rubric.
      ...BRIEF_SELECT,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
      evaluation: {
        select: {
          dimensions: true,
          strengths: true,
          improvements: true,
          summary: true,
        },
      },
    },
  });

  if (!session) return null;

  return {
    id: session.id,
    type: session.type,
    difficulty: session.difficulty,
    status: session.status,
    stage: session.stage,
    language: session.language,
    code: session.code ?? "",
    problemTitle: briefTitle(session, session.id),
    problemStatement: briefStatement(session, session.id),
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    transcript: session.messages
      .filter((m) => m.role !== "SYSTEM")
      .map((m) => ({
        id: m.id,
        role: m.role as "USER" | "ASSISTANT",
        content: m.content,
        at: m.createdAt,
      })),
    feedback: session.evaluation
      ? {
          dimensions: (session.evaluation.dimensions ?? []) as {
            dimension: string;
            band: string;
            evidence: string;
          }[],
          strengths: session.evaluation.strengths,
          improvements: session.evaluation.improvements,
          summary: session.evaluation.summary,
        }
      : null,
  };
}

export async function listInterviews(
  userId: string,
  limit = 25
): Promise<InterviewSummary[]> {
  const rows = await prisma.interviewSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      difficulty: true,
      status: true,
      stage: true,
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
      problem: { select: { title: true } },
      systemDesignProblem: { select: { title: true } },
      lldProblem: { select: { title: true } },
      behavioralQuestion: { select: { category: { select: { name: true } } } },
      // A count rather than the rows: the list needs to know whether
      // feedback exists, not what it says.
      evaluation: { select: { id: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    difficulty: row.difficulty,
    status: row.status,
    stage: row.stage,
    problemTitle:
      row.problem?.title ??
      row.systemDesignProblem?.title ??
      row.lldProblem?.title ??
      (row.behavioralQuestion
        ? `${row.behavioralQuestion.category.name} question`
        : null),
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    durationSeconds: row.durationSeconds,
    hasFeedback: Boolean(row.evaluation),
  }));
}

/**
 * Context for conducting the interview.
 *
 * Note what is NOT selected: `solutions`, and any test case. The
 * interviewer must know the problem it set and must not know how to
 * solve it — a model holding the answer cannot help steering towards
 * it, and steering is exactly what an interview must not do.
 */
export async function loadInterviewContext(
  sessionId: string,
  userId: string
): Promise<{
  type: InterviewType;
  difficulty: Difficulty;
  stage: InterviewStage;
  language: Language;
  code: string;
  problemTitle: string;
  problemStatement: string;
  transcript: { role: "USER" | "ASSISTANT"; content: string }[];
} | null> {
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      type: true,
      difficulty: true,
      stage: true,
      language: true,
      code: true,
      ...BRIEF_SELECT,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      },
    },
  });

  if (!session) return null;

  return {
    type: session.type,
    difficulty: session.difficulty,
    stage: session.stage,
    language: session.language,
    code: session.code ?? "",
    problemTitle: briefTitle(session, sessionId),
    problemStatement: briefStatement(session, sessionId),
    transcript: session.messages
      .filter((m) => m.role !== "SYSTEM")
      .map((m) => ({ role: m.role as "USER" | "ASSISTANT", content: m.content })),
  };
}

/**
 * Context for writing the feedback.
 *
 * This is the only path that loads the reference solution, and it
 * refuses unless the interview has actually ended. The interview being
 * over is what makes the reference safe to look at.
 */
export async function loadFeedbackContext(
  sessionId: string,
  userId: string
): Promise<
  | (NonNullable<Awaited<ReturnType<typeof loadInterviewContext>>> & {
      reference: string;
    })
  | null
> {
  const base = await loadInterviewContext(sessionId, userId);
  if (!base) return null;
  if (base.stage !== "ENDED") return null;

  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, userId },
    select: {
      type: true,
      problem: {
        select: {
          solutions: {
            orderBy: { order: "desc" },
            take: 1,
            select: { intuition: true, timeComplexity: true, spaceComplexity: true },
          },
        },
      },
      systemDesignProblem: {
        select: {
          architecture: true,
          bottlenecks: true,
          tradeoffs: true,
          scalingNotes: true,
        },
      },
      lldProblem: {
        select: { classDiagram: true, tradeoffs: true, designPatterns: true },
      },
      behavioralQuestion: { select: { lookingFor: true } },
    },
  });

  return { ...base, reference: renderReference(session, sessionId) };
}

/** A `{ decision, chose, over, because }` row, as stored in the JSON column. */
function tradeoffLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const t = row as Record<string, unknown>;
      if (typeof t?.decision !== "string") return null;
      const chose =
        typeof t.chose === "string" && typeof t.over === "string"
          ? ` — chose ${t.chose} over ${t.over}`
          : "";
      const because = typeof t.because === "string" ? `: ${t.because}` : "";
      return `- ${t.decision}${chose}${because}`;
    })
    .filter((line): line is string => line !== null);
}

/**
 * The reference material, rendered for the feedback pass only.
 *
 * This is the one place in the interview subsystem that reads a
 * reference architecture, a reference class diagram, a DSA solution or a
 * behavioural rubric. It is called from `loadFeedbackContext`, which has
 * already refused unless the interview reached ENDED — the interview
 * being over is what makes the reference safe to look at.
 */
function renderReference(
  session: {
    type: InterviewType;
    problem: {
      solutions: {
        intuition: string;
        timeComplexity: string;
        spaceComplexity: string;
      }[];
    } | null;
    systemDesignProblem: {
      architecture: unknown;
      bottlenecks: string[];
      tradeoffs: unknown;
      scalingNotes: unknown;
    } | null;
    lldProblem: {
      classDiagram: unknown;
      tradeoffs: unknown;
      designPatterns: string[];
    } | null;
    behavioralQuestion: { lookingFor: string[] } | null;
  } | null,
  sessionId: string
): string {
  if (!session) return "No reference material is available.";

  switch (session.type) {
    case "DSA": {
      const solution = session.problem?.solutions[0];
      return solution
        ? `Intuition: ${solution.intuition}\nExpected complexity: ${solution.timeComplexity} time, ${solution.spaceComplexity} space.`
        : "No reference solution is available for this problem.";
    }

    case "SYSTEM_DESIGN": {
      const brief = session.systemDesignProblem;
      if (!brief) return "No reference architecture is available.";
      const parts = [
        `One reference architecture (not the only defensible one):\n${describeDiagram(
          parseDiagram(brief.architecture, `interview-ref:${sessionId}`)
        )}`,
      ];
      const tradeoffs = tradeoffLines(brief.tradeoffs);
      if (tradeoffs.length > 0) {
        parts.push(`Trade-offs behind it:\n${tradeoffs.join("\n")}`);
      }
      if (brief.bottlenecks.length > 0) {
        parts.push(
          `Known bottlenecks:\n${brief.bottlenecks.map((b) => `- ${b}`).join("\n")}`
        );
      }
      return parts.join("\n\n");
    }

    case "LLD": {
      const brief = session.lldProblem;
      if (!brief) return "No reference design is available.";
      const parts = [
        `One reference class design (not the only defensible one):\n${describeClassDiagram(
          parseClassDiagram(brief.classDiagram, `interview-ref:${sessionId}`)
        )}`,
      ];
      const tradeoffs = tradeoffLines(brief.tradeoffs);
      if (tradeoffs.length > 0) {
        parts.push(`Trade-offs behind it:\n${tradeoffs.join("\n")}`);
      }
      if (brief.designPatterns.length > 0) {
        parts.push(`Patterns it uses: ${brief.designPatterns.join(", ")}`);
      }
      return parts.join("\n\n");
    }

    case "BEHAVIORAL": {
      const looking = session.behavioralQuestion?.lookingFor ?? [];
      return looking.length > 0
        ? `What a strong answer to this question demonstrates:\n${looking
            .map((item) => `- ${item}`)
            .join("\n")}`
        : "No rubric is recorded for this question.";
    }

    default:
      return "No reference material is available.";
  }
}

/**
 * Appends a transcript turn.
 *
 * Verifies ownership itself rather than trusting the caller. Every
 * current caller has already checked, but a write keyed only on a
 * session id is an IDOR waiting for its second caller.
 */
export async function appendTranscript(params: {
  sessionId: string;
  userId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  isCodeTurn?: boolean;
}): Promise<string | null> {
  const owns = await prisma.interviewSession.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    select: { id: true },
  });
  if (!owns) return null;

  const message = await prisma.interviewMessage.create({
    data: {
      sessionId: params.sessionId,
      role: params.role,
      content: params.content,
      isCodeTurn: params.isCodeTurn ?? false,
    },
    select: { id: true },
  });
  return message.id;
}

/** Advances the stage. Server-owned; the caller passes a computed value. */
export async function setStage(params: {
  sessionId: string;
  userId: string;
  stage: InterviewStage;
}): Promise<void> {
  await prisma.interviewSession.updateMany({
    where: { id: params.sessionId, userId: params.userId },
    data: {
      stage: params.stage,
      ...(params.stage === "ENDED"
        ? { status: "COMPLETED" as const, endedAt: new Date() }
        : {}),
    },
  });
}

/** Saves the candidate's code. Scoped, so it cannot touch another session. */
export async function saveInterviewCode(params: {
  sessionId: string;
  userId: string;
  code: string;
  language: Language;
}): Promise<boolean> {
  const result = await prisma.interviewSession.updateMany({
    where: { id: params.sessionId, userId: params.userId, status: "IN_PROGRESS" },
    data: { code: params.code, language: params.language },
  });
  return result.count > 0;
}

/**
 * Stores the written feedback.
 *
 * Upsert on the unique `sessionId`, so a retried generation replaces
 * rather than duplicating.
 */
export async function saveFeedback(params: {
  sessionId: string;
  userId: string;
  dimensions: { dimension: string; band: string; evidence: string }[];
  strengths: string[];
  improvements: string[];
  summary: string;
}): Promise<boolean> {
  // Ownership is checked before writing, because InterviewEvaluation is
  // keyed on sessionId and carries no userId of its own.
  const owns = await prisma.interviewSession.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    select: { id: true },
  });
  if (!owns) return false;

  const payload = {
    dimensions: params.dimensions as object,
    strengths: params.strengths,
    improvements: params.improvements,
    summary: params.summary,
    struggledWith: [] as string[],
  };

  await prisma.interviewEvaluation.upsert({
    where: { sessionId: params.sessionId },
    create: { sessionId: params.sessionId, ...payload },
    update: payload,
  });

  return true;
}

/** Aggregates for the interview dashboard. Counts only, no rows. */
export async function getInterviewStats(userId: string): Promise<{
  total: number;
  completed: number;
  withFeedback: number;
  inProgress: number;
}> {
  const [total, completed, withFeedback, inProgress] = await Promise.all([
    prisma.interviewSession.count({ where: { userId } }),
    prisma.interviewSession.count({ where: { userId, status: "COMPLETED" } }),
    prisma.interviewEvaluation.count({ where: { session: { userId } } }),
    prisma.interviewSession.count({ where: { userId, status: "IN_PROGRESS" } }),
  ]);
  return { total, completed, withFeedback, inProgress };
}
