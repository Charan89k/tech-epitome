import "server-only";

import { prisma } from "@/lib/db";
import { parseContent } from "@/lib/validation/content";
import { describeDiagram, diagramObservations } from "@/lib/diagram/layout";
import { parseDiagram } from "@/lib/diagram/schema";
import {
  blocksToText,
  type ChapterContext,
  type GlobalContext,
  type ProblemContext,
  type SystemDesignContext,
  type TutorContextBundle,
} from "@/lib/tutor/context";
import type {
  TutorAnchor,
  TutorMessageView,
  TutorRequestType,
} from "@/lib/tutor/types";

/**
 * Everything the tutor needs from the database.
 *
 * Kept apart from `lib/tutor/*`, which is pure. The split is deliberate:
 * the rules about what the tutor may say are testable without Postgres, and
 * the rules about what it may *see* — which are authorization rules — are
 * all in this one file, where they can be audited together.
 *
 * Every function here that touches a conversation takes a `userId` and
 * filters on it in the same query that finds the row. There is no
 * "load then check" anywhere in this file, because that shape is how an
 * authorization bug eventually gets written.
 */

// ---------------------------------------------------------------------------
// Context loading
// ---------------------------------------------------------------------------

async function loadChapterContext(
  anchor: Extract<TutorAnchor, { kind: "CHAPTER" }>
): Promise<ChapterContext | null> {
  const chapter = await prisma.chapter.findFirst({
    where: {
      slug: anchor.chapterSlug,
      status: "PUBLISHED",
      section: {
        slug: anchor.sectionSlug,
        course: { slug: anchor.courseSlug },
      },
    },
    select: {
      title: true,
      summary: true,
      difficulty: true,
      content: true,
      objectives: true,
      keyTakeaways: true,
      section: { select: { title: true, course: { select: { title: true } } } },
      // `ChapterPattern` carries no primary flag — unlike a problem, a
      // chapter teaches its patterns rather than being an instance of one.
      patterns: {
        select: { pattern: { select: { name: true, tagline: true } } },
        take: 3,
      },
    },
  });

  if (!chapter) return null;

  return {
    kind: "CHAPTER",
    courseTitle: chapter.section.course.title,
    sectionTitle: chapter.section.title,
    chapterTitle: chapter.title,
    summary: chapter.summary,
    difficulty: chapter.difficulty,
    objectives: chapter.objectives,
    keyTakeaways: chapter.keyTakeaways,
    bodyText: blocksToText(parseContent(chapter.content, `chapter:${anchor.chapterSlug}`)),
    patterns: chapter.patterns.map((p) => p.pattern),
  };
}

async function loadProblemContext(
  anchor: Extract<TutorAnchor, { kind: "PROBLEM" }>,
  userId: string
): Promise<ProblemContext | null> {
  const problem = await prisma.problem.findFirst({
    where: { slug: anchor.problemSlug, status: "PUBLISHED" },
    select: {
      id: true,
      number: true,
      title: true,
      statement: true,
      learningObjective: true,
      constraints: true,
      difficulty: true,
      expectedTime: true,
      expectedSpace: true,
      patterns: {
        select: { pattern: { select: { name: true, tagline: true } } },
        orderBy: { isPrimary: "desc" },
        take: 3,
      },
      // Bodies are needed so the tutor can avoid repeating a hint the
      // learner has already opened. Only the prefix they have unlocked is
      // used; see the slice below.
      hints: { orderBy: { order: "asc" }, select: { body: true } },
    },
  });

  if (!problem) return null;

  // One round trip for both, and both scoped to this user.
  const [progress, submission] = await Promise.all([
    prisma.userProblemProgress.findUnique({
      where: { userId_problemId: { userId, problemId: problem.id } },
      select: { attempts: true, status: true, hintsRevealed: true },
    }),
    prisma.submission.findFirst({
      where: { userId, problemId: problem.id, isRun: false },
      orderBy: { createdAt: "desc" },
      select: {
        language: true,
        status: true,
        passedCount: true,
        totalCount: true,
        errorMessage: true,
      },
    }),
  ]);

  const revealed = progress?.hintsRevealed ?? 0;

  return {
    kind: "PROBLEM",
    title: problem.title,
    number: problem.number,
    difficulty: problem.difficulty,
    learningObjective: problem.learningObjective,
    statementText: blocksToText(
      parseContent(problem.statement, `problem:${anchor.problemSlug}`)
    ),
    constraints: problem.constraints,
    patterns: problem.patterns.map((p) => p.pattern),
    expectedTime: problem.expectedTime,
    expectedSpace: problem.expectedSpace,
    // Strictly the prefix the learner has unlocked. An unopened hint is
    // withheld content — feeding the whole ladder to the tutor would let it
    // hand back hint 4 on the first ask and quietly defeat the escalation
    // the product enforces everywhere else.
    revealedHints: problem.hints.slice(0, revealed).map((h) => h.body),
    totalAuthoredHints: problem.hints.length,
    attempts: progress?.attempts ?? 0,
    status: progress?.status ?? "NOT_STARTED",
    latestSubmission: submission
      ? {
          language: submission.language,
          status: submission.status,
          passed: submission.passedCount ?? 0,
          total: submission.totalCount ?? 0,
          errorMessage: submission.errorMessage,
        }
      : null,
  };
}

/**
 * A design exercise plus the learner's own architecture.
 *
 * The reference architecture is deliberately not loaded. A reviewer that
 * holds the answer will leak it however carefully it is instructed not to,
 * and the whole point of the exercise is that the learner defends their
 * own design rather than converges on a stored one.
 */
async function loadSystemDesignContext(
  anchor: Extract<TutorAnchor, { kind: "SYSTEM_DESIGN" }>,
  userId: string
): Promise<SystemDesignContext | null> {
  const problem = await prisma.systemDesignProblem.findFirst({
    where: { slug: anchor.problemSlug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      tagline: true,
      difficulty: true,
      functionalRequirements: true,
      nonFunctionalRequirements: true,
      scaleEstimate: true,
    },
  });
  if (!problem) return null;

  const submission = await prisma.systemDesignSubmission.findUnique({
    where: { userId_problemId: { userId, problemId: problem.id } },
    select: { diagram: true, notes: true, submittedAt: true },
  });

  const diagram = parseDiagram(submission?.diagram, `sd-tutor:${anchor.problemSlug}`);

  return {
    kind: "SYSTEM_DESIGN",
    title: problem.title,
    tagline: problem.tagline,
    difficulty: problem.difficulty,
    functionalRequirements: problem.functionalRequirements,
    nonFunctionalRequirements: problem.nonFunctionalRequirements,
    scaleEstimate: (problem.scaleEstimate ?? {}) as Record<string, string>,
    // Prose, not coordinates: the same description a screen reader gets.
    learnerDiagram: describeDiagram(diagram),
    observations: diagramObservations(diagram),
    learnerNotes: submission?.notes ?? "",
    submitted: Boolean(submission?.submittedAt),
  };
}

async function loadGlobalContext(userId: string): Promise<GlobalContext> {
  const [completedChapters, solvedProblems, weak, recent] = await Promise.all([
    prisma.userChapterProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.userProblemProgress.count({ where: { userId, status: "SOLVED" } }),
    prisma.userPatternMastery.findMany({
      where: { userId, attempts: { gt: 0 } },
      orderBy: { score: "asc" },
      take: 3,
      select: { score: true, pattern: { select: { name: true } } },
    }),
    prisma.userChapterProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { chapter: { select: { title: true } } },
    }),
  ]);

  return {
    kind: "GLOBAL",
    completedChapters,
    solvedProblems,
    weakPatterns: weak.map((row) => ({ name: row.pattern.name, score: row.score })),
    recentChapters: recent.map((row) => row.chapter.title),
  };
}

/**
 * Resolves an anchor into the facts the model will be given.
 *
 * Returns null when the anchor names nothing published, which the caller
 * turns into a 404-shaped error. Deliberately indistinguishable from
 * "exists but unpublished": the tutor is not an oracle for what is in the
 * content pipeline.
 */
export async function loadContextBundle(
  anchor: TutorAnchor,
  userId: string
): Promise<TutorContextBundle | null> {
  switch (anchor.kind) {
    case "CHAPTER":
      return loadChapterContext(anchor);
    case "PROBLEM":
      return loadProblemContext(anchor, userId);
    case "SYSTEM_DESIGN":
      return loadSystemDesignContext(anchor, userId);
    case "GLOBAL":
      return loadGlobalContext(userId);
  }
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

const ENTITY_TYPE_FOR: Record<
  TutorAnchor["kind"],
  "CHAPTER" | "PROBLEM" | "SYSTEM_DESIGN_PROBLEM" | null
> = {
  CHAPTER: "CHAPTER",
  PROBLEM: "PROBLEM",
  SYSTEM_DESIGN: "SYSTEM_DESIGN_PROBLEM",
  GLOBAL: null,
};

function titleFor(bundle: TutorContextBundle): string {
  if (bundle.kind === "CHAPTER") return bundle.chapterTitle;
  if (bundle.kind === "PROBLEM" || bundle.kind === "SYSTEM_DESIGN") {
    return bundle.title;
  }
  return "General questions";
}

/** The slug an anchor is pinned to, or null for the global tutor. */
function contextIdFor(anchor: TutorAnchor): string | null {
  switch (anchor.kind) {
    case "CHAPTER":
      return anchor.chapterSlug;
    case "PROBLEM":
    case "SYSTEM_DESIGN":
      return anchor.problemSlug;
    case "GLOBAL":
      return null;
  }
}

/**
 * Finds the caller's conversation, or starts one anchored to what they are
 * looking at.
 *
 * The lookup filters on `userId` in the same `where` as the id. Passing
 * somebody else's conversation id is therefore not an authorization failure
 * to be caught later — it simply matches no row, and the caller is told the
 * conversation does not exist.
 */
export async function resolveConversation(params: {
  userId: string;
  conversationId?: string;
  anchor: TutorAnchor;
  bundle: TutorContextBundle;
}): Promise<{ id: string; hintLevel: number } | null> {
  if (params.conversationId) {
    const existing = await prisma.aIConversation.findFirst({
      where: { id: params.conversationId, userId: params.userId },
      select: {
        id: true,
        messages: {
          orderBy: { hintLevel: "desc" },
          take: 1,
          select: { hintLevel: true },
        },
      },
    });
    if (!existing) return null;
    return { id: existing.id, hintLevel: existing.messages[0]?.hintLevel ?? 0 };
  }

  const entityType = ENTITY_TYPE_FOR[params.anchor.kind];
  const created = await prisma.aIConversation.create({
    data: {
      userId: params.userId,
      title: titleFor(params.bundle).slice(0, 120),
      mode: "TUTOR",
      contextType: entityType,
      contextId: contextIdFor(params.anchor),
    },
    select: { id: true },
  });

  return { id: created.id, hintLevel: 0 };
}

/** Prior turns for a conversation the caller owns. Oldest first. */
export async function loadHistory(
  conversationId: string,
  userId: string,
  take = 20
): Promise<{ role: "USER" | "ASSISTANT"; content: string }[]> {
  const rows = await prisma.aIMessage.findMany({
    where: {
      conversationId,
      conversation: { userId },
      role: { in: ["USER", "ASSISTANT"] },
    },
    orderBy: { createdAt: "asc" },
    take,
    select: { role: true, content: true },
  });

  return rows.map((row) => ({
    role: row.role as "USER" | "ASSISTANT",
    content: row.content,
  }));
}

export async function appendMessage(params: {
  conversationId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  requestType: TutorRequestType | null;
  hintLevel: number;
}): Promise<string> {
  const message = await prisma.aIMessage.create({
    data: {
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      requestType: params.requestType,
      hintLevel: params.hintLevel,
    },
    select: { id: true },
  });

  // Keeps the thread list ordered by real activity.
  await prisma.aIConversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });

  return message.id;
}

/**
 * A conversation and its turns, for rehydrating the panel.
 *
 * Returns null rather than throwing when the caller does not own it, so a
 * probe for another learner's thread is answered exactly like a probe for a
 * thread that was never created.
 */
export async function getConversation(
  conversationId: string,
  userId: string
): Promise<{ id: string; title: string; messages: TutorMessageView[] } | null> {
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, userId },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          requestType: true,
          hintLevel: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    title: conversation.title,
    messages: conversation.messages
      .filter((m) => m.role !== "SYSTEM")
      .map((m) => ({
        id: m.id,
        role: m.role as "USER" | "ASSISTANT",
        content: m.content,
        requestType: (m.requestType as TutorRequestType | null) ?? null,
        hintLevel: m.hintLevel,
        createdAt: m.createdAt.toISOString(),
      })),
  };
}

/**
 * The most recent thread for a given anchor, so reopening the tutor on a
 * problem resumes where the learner left off instead of forgetting them.
 */
export async function findLatestConversationFor(params: {
  userId: string;
  anchor: TutorAnchor;
}): Promise<string | null> {
  const entityType = ENTITY_TYPE_FOR[params.anchor.kind];
  const contextId = contextIdFor(params.anchor);

  const row = await prisma.aIConversation.findFirst({
    where: {
      userId: params.userId,
      mode: "TUTOR",
      contextType: entityType,
      contextId,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  return row?.id ?? null;
}
