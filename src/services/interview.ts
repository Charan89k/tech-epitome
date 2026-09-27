import "server-only";

import type {
  Difficulty,
  InterviewStatus,
  InterviewType,
  Language,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { parseContent } from "@/lib/validation/content";
import { toPlainText } from "@/types/content";
import type { InterviewStage } from "@/lib/interview/types";

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

/**
 * Starts a session against a randomly chosen published problem of the
 * requested difficulty.
 *
 * The problem is picked server-side: letting the client name it would
 * let a candidate shop for one they have already solved, which makes
 * the practice worthless.
 */
export async function createInterview(params: {
  userId: string;
  type: InterviewType;
  difficulty: Difficulty;
  language: Language;
}): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  if (params.type !== "DSA") {
    // Only the DSA interviewer is implemented. Refusing explicitly is
    // better than creating a session that cannot be conducted.
    return {
      ok: false,
      reason: "Only DSA mock interviews are available at the moment.",
    };
  }

  const candidates = await prisma.problem.findMany({
    where: { status: "PUBLISHED", difficulty: params.difficulty },
    select: { id: true },
  });
  if (candidates.length === 0) {
    return { ok: false, reason: "No problems are available at that difficulty." };
  }

  const problem = candidates[Math.floor(Math.random() * candidates.length)]!;

  const session = await prisma.interviewSession.create({
    data: {
      userId: params.userId,
      type: params.type,
      difficulty: params.difficulty,
      language: params.language,
      problemId: problem.id,
      stage: "INTRO",
      status: "IN_PROGRESS",
    },
    select: { id: true },
  });

  return { ok: true, id: session.id };
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
      // Statement only. `solutions` and hidden `testCases` are not
      // selected and never reach this shape.
      problem: { select: { title: true, statement: true, slug: true } },
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
    problemTitle: session.problem?.title ?? "Problem",
    problemStatement: session.problem
      ? toPlainText(parseContent(session.problem.statement, `interview:${session.id}`))
      : "",
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
    problemTitle: row.problem?.title ?? null,
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
      problem: { select: { title: true, statement: true } },
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
    problemTitle: session.problem?.title ?? "Problem",
    problemStatement: session.problem
      ? toPlainText(parseContent(session.problem.statement, `interview:${sessionId}`))
      : "",
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
      problem: {
        select: {
          solutions: {
            orderBy: { order: "desc" },
            take: 1,
            select: { intuition: true, timeComplexity: true, spaceComplexity: true },
          },
        },
      },
    },
  });

  const solution = session?.problem?.solutions[0];
  const reference = solution
    ? `Intuition: ${solution.intuition}\nExpected complexity: ${solution.timeComplexity} time, ${solution.spaceComplexity} space.`
    : "No reference solution is available for this problem.";

  return { ...base, reference };
}

export async function appendTranscript(params: {
  sessionId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  isCodeTurn?: boolean;
}): Promise<string> {
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
