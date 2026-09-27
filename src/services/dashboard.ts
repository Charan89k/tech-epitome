import "server-only";

import { prisma } from "@/lib/db";
import { PATTERN_MASTERY_THRESHOLD } from "@/services/progress";

/**
 * Everything the dashboard renders, in as few round trips as possible.
 *
 * The dashboard answers five questions, and each block below maps to exactly
 * one of them:
 *   1. What am I learning?      -> continueLearning
 *   2. What did I complete?     -> summary (see services/progress)
 *   3. What should I do next?   -> recommendedProblems
 *   4. What am I weak at?       -> weakPatterns
 *   5. What should I revisit?   -> dueReviews, bookmarks
 *
 * Every field is derived from recorded activity. When there is no activity
 * the arrays come back empty and the UI renders a real empty state - it does
 * not invent a recommendation to fill the space.
 */

export type ContinueLearning = {
  chapterId: string;
  chapterTitle: string;
  chapterSlug: string;
  sectionTitle: string;
  sectionSlug: string;
  courseTitle: string;
  courseSlug: string;
  percent: number;
  href: string;
};

export type RecommendedProblem = {
  id: string;
  number: number;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  patterns: string[];
  /** Why this problem is being suggested. Shown to the user verbatim. */
  reason: string;
};

export type WeakPattern = {
  id: string;
  slug: string;
  name: string;
  score: number;
  attempts: number;
  solved: number;
};

export type RecentSubmission = {
  id: string;
  problemSlug: string;
  problemTitle: string;
  status: string;
  language: string;
  createdAt: Date;
};

export type QuizPerformance = {
  attempts: number;
  averagePercent: number;
  passed: number;
};

export type DashboardData = {
  continueLearning: ContinueLearning | null;
  recommendedProblems: RecommendedProblem[];
  weakPatterns: WeakPattern[];
  recentSubmissions: RecentSubmission[];
  dueReviewCount: number;
  quizPerformance: QuizPerformance | null;
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [inProgress, weakPatterns, recentSubmissions, dueReviewCount, quizPerformance] =
    await Promise.all([
      findContinueLearning(userId),
      findWeakPatterns(userId),
      findRecentSubmissions(userId),
      prisma.reviewItem.count({
        where: { userId, dueAt: { lte: new Date() } },
      }),
      findQuizPerformance(userId),
    ]);

  const recommendedProblems = await recommendProblems(userId, weakPatterns);

  return {
    continueLearning: inProgress,
    recommendedProblems,
    weakPatterns,
    recentSubmissions,
    dueReviewCount,
    quizPerformance,
  };
}

/**
 * Quiz performance across completed attempts.
 *
 * Returns null rather than zeroes when nothing has been attempted, so the
 * UI can say "no attempts yet" instead of reporting a confident 0%, which
 * reads as a failure rather than an absence.
 */
async function findQuizPerformance(
  userId: string
): Promise<QuizPerformance | null> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, completedAt: { not: null } },
    select: { score: true, maxScore: true, passed: true },
  });

  if (attempts.length === 0) return null;

  const scored = attempts.filter((attempt) => attempt.maxScore > 0);
  const averagePercent =
    scored.length === 0
      ? 0
      : Math.round(
          scored.reduce(
            (total, attempt) => total + (attempt.score / attempt.maxScore) * 100,
            0
          ) / scored.length
        );

  return {
    attempts: attempts.length,
    averagePercent,
    passed: attempts.filter((attempt) => attempt.passed).length,
  };
}

/**
 * The chapter to resume: the most recently touched incomplete chapter. If
 * there is none, the first published chapter of the first course - which is
 * the correct answer for a brand-new account.
 */
async function findContinueLearning(
  userId: string
): Promise<ContinueLearning | null> {
  const inProgress = await prisma.userChapterProgress.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    orderBy: { updatedAt: "desc" },
    select: {
      percent: true,
      chapter: {
        select: {
          id: true,
          slug: true,
          title: true,
          section: {
            select: {
              slug: true,
              title: true,
              course: { select: { slug: true, title: true, track: true } },
            },
          },
        },
      },
    },
  });

  if (inProgress) {
    const c = inProgress.chapter;
    return {
      chapterId: c.id,
      chapterTitle: c.title,
      chapterSlug: c.slug,
      sectionTitle: c.section.title,
      sectionSlug: c.section.slug,
      courseTitle: c.section.course.title,
      courseSlug: c.section.course.slug,
      percent: inProgress.percent,
      href: `/learn/dsa/${c.section.course.slug}/${c.section.slug}/${c.slug}`,
    };
  }

  // No chapter in progress: point at the first thing they have not completed.
  const completed = await prisma.userChapterProgress.findMany({
    where: { userId, status: "COMPLETED" },
    select: { chapterId: true },
  });
  const completedIds = completed.map((row) => row.chapterId);

  const next = await prisma.chapter.findFirst({
    where: {
      status: "PUBLISHED",
      id: completedIds.length ? { notIn: completedIds } : undefined,
      section: {
        status: "PUBLISHED",
        course: { status: "PUBLISHED", track: "DSA" },
      },
    },
    orderBy: [
      { section: { course: { order: "asc" } } },
      { section: { order: "asc" } },
      { order: "asc" },
    ],
    select: {
      id: true,
      slug: true,
      title: true,
      section: {
        select: {
          slug: true,
          title: true,
          course: { select: { slug: true, title: true } },
        },
      },
    },
  });

  if (!next) return null;

  return {
    chapterId: next.id,
    chapterTitle: next.title,
    chapterSlug: next.slug,
    sectionTitle: next.section.title,
    sectionSlug: next.section.slug,
    courseTitle: next.section.course.title,
    courseSlug: next.section.course.slug,
    percent: 0,
    href: `/learn/dsa/${next.section.course.slug}/${next.section.slug}/${next.slug}`,
  };
}

/** Practised patterns scoring below the mastery bar, weakest first. */
async function findWeakPatterns(userId: string): Promise<WeakPattern[]> {
  const rows = await prisma.userPatternMastery.findMany({
    where: {
      userId,
      // Only patterns actually attempted. An untouched pattern is not a
      // weakness, it is simply unstarted, and conflating the two produces
      // nonsense advice on day one.
      attempts: { gt: 0 },
      score: { lt: PATTERN_MASTERY_THRESHOLD },
    },
    orderBy: [{ score: "asc" }, { lastPracticedAt: "asc" }],
    take: 3,
    select: {
      score: true,
      attempts: true,
      solved: true,
      pattern: { select: { id: true, slug: true, name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.pattern.id,
    slug: row.pattern.slug,
    name: row.pattern.name,
    score: row.score,
    attempts: row.attempts,
    solved: row.solved,
  }));
}

async function findRecentSubmissions(
  userId: string
): Promise<RecentSubmission[]> {
  const rows = await prisma.submission.findMany({
    where: { userId, isRun: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      status: true,
      language: true,
      createdAt: true,
      problem: { select: { slug: true, title: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    problemSlug: row.problem.slug,
    problemTitle: row.problem.title,
    status: row.status,
    language: row.language,
    createdAt: row.createdAt,
  }));
}

/**
 * Three problems to try today.
 *
 * Priority order, and the reason string shown for each:
 *   1. A problem for the weakest practised pattern  ("Strengthens <pattern>")
 *   2. A problem previously attempted but not solved ("You attempted this")
 *   3. An unattempted problem at the easiest unsolved difficulty ("Next up")
 *
 * Nothing here is random, and nothing is shown without a reason the user can
 * check against their own history.
 */
async function recommendProblems(
  userId: string,
  weakPatterns: WeakPattern[]
): Promise<RecommendedProblem[]> {
  const attempted = await prisma.userProblemProgress.findMany({
    where: { userId },
    select: { problemId: true, status: true },
  });

  const solvedIds = attempted
    .filter((row) => row.status === "SOLVED")
    .map((row) => row.problemId);
  const stuckIds = attempted
    .filter((row) => row.status === "ATTEMPTED")
    .map((row) => row.problemId);

  const picked = new Map<string, RecommendedProblem>();

  const select = {
    id: true,
    number: true,
    slug: true,
    title: true,
    difficulty: true,
    patterns: {
      select: { pattern: { select: { name: true } } },
      take: 3,
    },
  } as const;

  type Row = {
    id: string;
    number: number;
    slug: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    patterns: { pattern: { name: string } }[];
  };

  const add = (row: Row, reason: string) => {
    if (picked.size >= 3 || picked.has(row.id)) return;
    picked.set(row.id, {
      id: row.id,
      number: row.number,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      patterns: row.patterns.map((p) => p.pattern.name),
      reason,
    });
  };

  // 1. Shore up the weakest pattern.
  const weakest = weakPatterns[0];
  if (weakest) {
    const rows = await prisma.problem.findMany({
      where: {
        status: "PUBLISHED",
        id: solvedIds.length ? { notIn: solvedIds } : undefined,
        patterns: { some: { patternId: weakest.id } },
      },
      orderBy: [{ difficulty: "asc" }, { number: "asc" }],
      take: 2,
      select,
    });
    for (const row of rows) add(row, `Strengthens ${weakest.name}`);
  }

  // 2. Finish what was started.
  if (picked.size < 3 && stuckIds.length) {
    const rows = await prisma.problem.findMany({
      where: { status: "PUBLISHED", id: { in: stuckIds } },
      orderBy: { number: "asc" },
      take: 3 - picked.size,
      select,
    });
    for (const row of rows) add(row, "You attempted this but did not finish");
  }

  // 3. Keep moving through the catalogue.
  if (picked.size < 3) {
    const rows = await prisma.problem.findMany({
      where: {
        status: "PUBLISHED",
        id: solvedIds.length ? { notIn: solvedIds } : undefined,
      },
      orderBy: [{ difficulty: "asc" }, { number: "asc" }],
      take: 3 - picked.size,
      select,
    });
    for (const row of rows) add(row, "Next in the catalogue");
  }

  return [...picked.values()];
}
