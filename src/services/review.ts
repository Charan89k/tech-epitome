import "server-only";

import type { EntityType, ReviewGrade, ReviewStage } from "@/generated/prisma/enums";
import { utcDayStart } from "@/lib/dates";
import { prisma } from "@/lib/db";
import {
  EASE_DEFAULT,
  firstDueAt,
  schedule,
  type SchedulerResult,
} from "@/lib/review/scheduler";
import {
  chapterPrompt,
  missingPrompt,
  patternPrompt,
  problemPrompt,
  type ReviewPrompt,
} from "@/lib/review/prompts";

/**
 * The review queue, and everything that writes to it.
 *
 * Every function here takes a `userId` and scopes every query by it. Review
 * state is the most personal data in the product — it is a record of what
 * someone keeps forgetting — so there is no code path that reads or writes a
 * review item without naming whose it is.
 */

export type ReviewCard = {
  id: string;
  entityType: EntityType;
  entityId: string;
  stage: ReviewStage;
  dueAt: Date;
  lapses: number;
  /** Whole UTC days late. Zero when due today or reviewed early. */
  overdueDays: number;
  prompt: ReviewPrompt;
};

/**
 * How many cards one session serves.
 *
 * Bounded so the page never loads an unbounded queue: someone returning
 * after a month away could have hundreds due, and the answer to that is a
 * session they can finish, not a list that takes a second to render.
 */
export const SESSION_SIZE = 20;

/**
 * Cards due now, in priority order.
 *
 * Ordering, and the reasoning behind it:
 *
 *   1. dueAt ascending — the most overdue first. Because `dueAt` is always
 *      midnight UTC, everything overdue sorts strictly before everything due
 *      today, so this one clause implements both of the first two priority
 *      tiers.
 *   2. lapses descending — within a day, the items that keep being forgotten
 *      come first, while attention is freshest.
 *   3. ease ascending — then the ones that have been consistently hard.
 *   4. id ascending — a total order, so the queue is reproducible and can be
 *      asserted in a test. Nothing here is random.
 *
 * The existing `[userId, dueAt]` index serves the filter and the leading
 * sort key; the remaining tiebreakers sort within a bounded page.
 */
export async function getReviewQueue(
  userId: string,
  now: Date = new Date(),
  limit: number = SESSION_SIZE
): Promise<ReviewCard[]> {
  const items = await prisma.reviewItem.findMany({
    where: { userId, dueAt: { lte: now } },
    orderBy: [
      { dueAt: "asc" },
      { lapses: "desc" },
      { ease: "asc" },
      { id: "asc" },
    ],
    take: limit,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      stage: true,
      dueAt: true,
      lapses: true,
    },
  });

  if (items.length === 0) return [];

  const prompts = await resolvePrompts(userId, items);
  const todayStart = utcDayStart(now);

  return items.map((item) => ({
    id: item.id,
    entityType: item.entityType,
    entityId: item.entityId,
    stage: item.stage,
    dueAt: item.dueAt,
    lapses: item.lapses,
    overdueDays: Math.max(
      0,
      Math.round((todayStart.getTime() - utcDayStart(item.dueAt).getTime()) / 86_400_000)
    ),
    prompt:
      prompts.get(`${item.entityType}:${item.entityId}`) ??
      missingPrompt(item.entityType),
  }));
}

/**
 * Loads the content behind a page of review items.
 *
 * One query per entity type present, never one per item. A queue of twenty
 * mixed cards costs at most four round trips regardless of its composition.
 */
async function resolvePrompts(
  userId: string,
  items: { entityType: EntityType; entityId: string }[]
): Promise<Map<string, ReviewPrompt>> {
  const byType = new Map<EntityType, string[]>();
  for (const item of items) {
    const list = byType.get(item.entityType) ?? [];
    list.push(item.entityId);
    byType.set(item.entityType, list);
  }

  const prompts = new Map<string, ReviewPrompt>();
  const key = (type: EntityType, id: string) => `${type}:${id}`;

  const patternIds = byType.get("PATTERN");
  const chapterIds = byType.get("CHAPTER");
  const problemIds = byType.get("PROBLEM");

  const [patterns, chapters, problems] = await Promise.all([
    patternIds?.length
      ? prisma.pattern.findMany({
          where: { id: { in: patternIds }, status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            name: true,
            tagline: true,
            coreIdea: true,
            recognitionClues: true,
            antiPatterns: true,
            commonMistakes: true,
          },
        })
      : Promise.resolve([]),

    chapterIds?.length
      ? prisma.chapter.findMany({
          where: { id: { in: chapterIds }, status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            keyTakeaways: true,
            objectives: true,
            section: {
              select: { slug: true, course: { select: { slug: true } } },
            },
          },
        })
      : Promise.resolve([]),

    problemIds?.length
      ? prisma.problem.findMany({
          where: { id: { in: problemIds }, status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            number: true,
            title: true,
            learningObjective: true,
            expectedTime: true,
            expectedSpace: true,
            patterns: {
              orderBy: { isPrimary: "desc" },
              take: 3,
              select: { pattern: { select: { name: true } } },
            },
            // Scoped to this user: the context line quotes their own history.
            progress: {
              where: { userId },
              take: 1,
              select: { hintsRevealed: true, attempts: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  for (const pattern of patterns) {
    prompts.set(key("PATTERN", pattern.id), patternPrompt(pattern));
  }

  for (const chapter of chapters) {
    prompts.set(
      key("CHAPTER", chapter.id),
      chapterPrompt({
        slug: chapter.slug,
        title: chapter.title,
        summary: chapter.summary,
        keyTakeaways: chapter.keyTakeaways,
        objectives: chapter.objectives,
        sectionSlug: chapter.section.slug,
        courseSlug: chapter.section.course.slug,
      })
    );
  }

  for (const problem of problems) {
    const progress = problem.progress[0];
    prompts.set(
      key("PROBLEM", problem.id),
      problemPrompt({
        slug: problem.slug,
        number: problem.number,
        title: problem.title,
        learningObjective: problem.learningObjective,
        expectedTime: problem.expectedTime,
        expectedSpace: problem.expectedSpace,
        patternNames: problem.patterns.map((link) => link.pattern.name),
        hintsRevealed: progress?.hintsRevealed ?? 0,
        attempts: progress?.attempts ?? 0,
      })
    );
  }

  return prompts;
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

/**
 * Creates a review item, or leaves an existing one alone.
 *
 * Upsert on the natural key, which the database already enforces as unique.
 * Crucially the update branch is a no-op on scheduling fields: re-completing
 * a chapter, or re-solving a problem, must not reset a schedule the learner
 * has already built up. Creating is idempotent; nothing here ever moves an
 * item backwards.
 */
export async function ensureReviewItem(
  userId: string,
  entityType: EntityType,
  entityId: string,
  options: { ease?: number; now?: Date } = {}
): Promise<void> {
  const now = options.now ?? new Date();

  await prisma.reviewItem.upsert({
    where: {
      userId_entityType_entityId: { userId, entityType, entityId },
    },
    create: {
      userId,
      entityType,
      entityId,
      stage: "NEW",
      dueAt: firstDueAt(now),
      intervalDays: 1,
      repetitions: 0,
      ease: options.ease ?? EASE_DEFAULT,
      lapses: 0,
      totalReviews: 0,
    },
    // Deliberately empty: the item already exists and its schedule belongs
    // to the learner's review history, not to the act of revisiting content.
    update: {},
  });
}

/**
 * Initial ease for a problem, from how much help it took.
 *
 * `hintsRevealed` was added in Phase 1 with a comment saying it would feed
 * the scheduler; this is that. Someone who solved a problem unaided starts
 * on the default; someone who needed the solution starts lower, so the item
 * comes back sooner and grows more slowly.
 */
export function initialEaseForProblem(
  hintsRevealed: number,
  solutionViewed: boolean
): number {
  if (solutionViewed) return EASE_DEFAULT - 40;
  if (hintsRevealed >= 3) return EASE_DEFAULT - 30;
  if (hintsRevealed >= 1) return EASE_DEFAULT - 20;
  return EASE_DEFAULT;
}

/**
 * Pulls an existing item forward because the learner just got it wrong again.
 *
 * Only ever touches an item that already exists: you cannot review something
 * you never learned, so a failed attempt on a problem with no review history
 * creates nothing. Nor does it push an item further out — it only moves a
 * future review to today.
 */
export async function bumpReviewPriority(
  userId: string,
  entityType: EntityType,
  entityId: string,
  now: Date = new Date()
): Promise<void> {
  await prisma.reviewItem.updateMany({
    where: {
      userId,
      entityType,
      entityId,
      dueAt: { gt: now },
    },
    data: { dueAt: utcDayStart(now), stage: "LEARNING", intervalDays: 1 },
  });
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

export type GradeOutcome = {
  intervalDays: number;
  dueAt: Date;
  stage: ReviewStage;
  requeueInSession: boolean;
};

/**
 * Applies a grade and persists the new schedule.
 *
 * The `userId` is part of the update's `where`, not just a check beforehand:
 * a request naming someone else's item matches zero rows and returns null
 * rather than reading it first and then deciding. There is no window between
 * the check and the write.
 */
export async function gradeReviewItem(
  userId: string,
  reviewItemId: string,
  grade: ReviewGrade,
  now: Date = new Date()
): Promise<GradeOutcome | null> {
  const item = await prisma.reviewItem.findFirst({
    where: { id: reviewItemId, userId },
    select: {
      id: true,
      stage: true,
      dueAt: true,
      intervalDays: true,
      repetitions: true,
      ease: true,
      lapses: true,
    },
  });

  if (!item) return null;

  const next: SchedulerResult = schedule({
    stage: item.stage,
    intervalDays: item.intervalDays,
    repetitions: item.repetitions,
    ease: item.ease,
    lapses: item.lapses,
    dueAt: item.dueAt,
    reviewedAt: now,
    grade,
  });

  // Scoped by userId again. Two rapid submissions for the same card both
  // write a valid schedule; the second simply overwrites the first, which
  // is the correct outcome for a last-write-wins field set.
  const updated = await prisma.reviewItem.updateMany({
    where: { id: reviewItemId, userId },
    data: {
      stage: next.stage,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      ease: next.ease,
      lapses: next.lapses,
      dueAt: next.dueAt,
      lastGrade: grade,
      lastReviewedAt: now,
      totalReviews: { increment: 1 },
    },
  });

  if (updated.count === 0) return null;

  return {
    intervalDays: next.intervalDays,
    dueAt: next.dueAt,
    stage: next.stage,
    requeueInSession: next.requeueInSession,
  };
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export type ReviewSummary = {
  dueCount: number;
  /** Graded today, from the append-only activity log. */
  reviewedToday: number;
  /** Total items being tracked. */
  trackedCount: number;
  /** Counts per stage, for the history strip. */
  byStage: Record<ReviewStage, number>;
  /** The next few items that are not yet due. */
  upcoming: { dueAt: Date; count: number }[];
};

/**
 * Everything the review page and the dashboard need, counted rather than
 * loaded. Nothing here fetches a row it does not display.
 */
export async function getReviewSummary(
  userId: string,
  now: Date = new Date()
): Promise<ReviewSummary> {
  const todayStart = utcDayStart(now);

  const [dueCount, reviewedToday, stageGroups, upcomingRows] = await Promise.all([
    prisma.reviewItem.count({ where: { userId, dueAt: { lte: now } } }),

    // Reuses the existing activity log rather than adding a counter column.
    prisma.activityEvent.count({
      where: { userId, name: "review_graded", createdAt: { gte: todayStart } },
    }),

    prisma.reviewItem.groupBy({
      by: ["stage"],
      where: { userId },
      _count: true,
    }),

    prisma.reviewItem.groupBy({
      by: ["dueAt"],
      where: { userId, dueAt: { gt: now } },
      _count: true,
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
  ]);

  const byStage: Record<ReviewStage, number> = {
    NEW: 0,
    LEARNING: 0,
    REVIEW: 0,
    MATURE: 0,
  };
  let trackedCount = 0;
  for (const group of stageGroups) {
    byStage[group.stage] = group._count;
    trackedCount += group._count;
  }

  return {
    dueCount,
    reviewedToday,
    trackedCount,
    byStage,
    upcoming: upcomingRows.map((row) => ({ dueAt: row.dueAt, count: row._count })),
  };
}

/** The most recently graded items, for the history strip. */
export async function getRecentlyReviewed(userId: string, limit = 5) {
  return prisma.reviewItem.findMany({
    where: { userId, lastReviewedAt: { not: null } },
    orderBy: { lastReviewedAt: "desc" },
    take: limit,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      stage: true,
      lastGrade: true,
      lastReviewedAt: true,
      intervalDays: true,
    },
  });
}
