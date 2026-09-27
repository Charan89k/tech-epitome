import "server-only";

import type { AchievementKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { notifyQuietly } from "@/services/notifications";
import { PATTERN_MASTERY_THRESHOLD } from "@/services/progress";

/**
 * Achievements.
 *
 * Restrained by design: milestones that mark real progress through the
 * material, never a points economy and never a comparison between
 * learners. Nothing is awarded for logging in, and nothing here is
 * purchasable — there is nothing to purchase.
 *
 * **Every counter is recomputed from the learner's own rows**, not
 * incremented. That makes awarding idempotent: running it twice awards
 * nothing twice, and a backfill or a corrected count settles on the
 * right answer instead of drifting. The cost is a handful of counts on
 * the paths that can plausibly unlock something, which is why this is
 * called from those paths rather than on every request.
 */

export type UnlockedAchievement = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  unlockedAt: Date;
};

export type AchievementProgress = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  /** Null until unlocked. */
  unlockedAt: Date | null;
  /** Where the learner is against the bar, for the locked ones. */
  current: number;
  threshold: number;
};

/**
 * Every counter an achievement can be measured against.
 *
 * Computed once per award pass and shared, because several achievements
 * read the same number — three of them are thresholds on problems
 * solved.
 */
type Counters = {
  problemsSolved: number;
  mediumSolved: number;
  hardSolved: number;
  currentStreak: number;
  patternsMastered: number;
  coursesCompleted: number;
  reviewsCleared: number;
};

/**
 * Reads every counter, on one connection.
 *
 * `$transaction` with an array, and `countCompletedCourses` awaited
 * after rather than beside it. This runs on the submit path, which is
 * already doing real work; fanning out ten concurrent queries there
 * competes with the request that triggered it for the same pool.
 */
async function readCounters(userId: string): Promise<Counters> {
  const [
    problemsSolved,
    mediumSolved,
    hardSolved,
    profile,
    patternsMastered,
    reviewsCleared,
  ] = await prisma.$transaction([
    prisma.userProblemProgress.count({ where: { userId, status: "SOLVED" } }),
    prisma.userProblemProgress.count({
      where: { userId, status: "SOLVED", problem: { difficulty: "MEDIUM" } },
    }),
    prisma.userProblemProgress.count({
      where: { userId, status: "SOLVED", problem: { difficulty: "HARD" } },
    }),
    prisma.profile.findUnique({
      where: { userId },
      select: { currentStreak: true },
    }),
    prisma.userPatternMastery.count({
      where: { userId, score: { gte: PATTERN_MASTERY_THRESHOLD } },
    }),
    prisma.reviewItem.count({ where: { userId, totalReviews: { gt: 0 } } }),
  ]);

  return {
    problemsSolved,
    mediumSolved,
    hardSolved,
    currentStreak: profile?.currentStreak ?? 0,
    patternsMastered,
    coursesCompleted: await countCompletedCourses(userId),
    reviewsCleared,
  };
}

/**
 * Courses where every published chapter is complete.
 *
 * Two queries and a count in memory, rather than a grouped query per
 * course. The chapter table is small — tens of rows, not millions — and
 * a loop of queries over courses is the shape that quietly becomes an
 * N+1 when a fourth track is added.
 */
async function countCompletedCourses(userId: string): Promise<number> {
  // Sequential, not concurrent: see `readCounters`.
  const completed = await prisma.userChapterProgress.findMany({
    where: { userId, status: "COMPLETED" },
    select: { chapterId: true },
  });

  // Nobody with no completed chapters has completed a course, and this
  // is the common case on the submit path.
  if (completed.length === 0) return 0;

  const chapters = await prisma.chapter.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, section: { select: { courseId: true } } },
  });

  if (chapters.length === 0) return 0;

  const done = new Set(completed.map((row) => row.chapterId));
  const totals = new Map<string, { total: number; done: number }>();

  for (const chapter of chapters) {
    const courseId = chapter.section.courseId;
    const entry = totals.get(courseId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (done.has(chapter.id)) entry.done += 1;
    totals.set(courseId, entry);
  }

  let courses = 0;
  for (const entry of totals.values()) {
    if (entry.total > 0 && entry.done >= entry.total) courses += 1;
  }
  return courses;
}

/**
 * The counter an achievement is measured against.
 *
 * `DIFFICULTY_MILESTONE` reads the difficulty from the slug, which is
 * what the seed's own comment says it does. A slug naming neither
 * returns 0 rather than throwing: a malformed row should fail to unlock,
 * not take down the submit path it is called from.
 */
function counterFor(
  kind: AchievementKind,
  slug: string,
  counters: Counters
): number {
  switch (kind) {
    case "PROBLEMS_SOLVED":
      return counters.problemsSolved;
    case "DIFFICULTY_MILESTONE":
      if (slug.includes("hard")) return counters.hardSolved;
      if (slug.includes("medium")) return counters.mediumSolved;
      return 0;
    case "STREAK":
      return counters.currentStreak;
    case "PATTERN_MASTERY":
      return counters.patternsMastered;
    case "COURSE_COMPLETION":
      return counters.coursesCompleted;
    case "REVIEW_CONSISTENCY":
      return counters.reviewsCleared;
    default:
      return 0;
  }
}

/**
 * Awards anything newly earned, and notifies once per achievement.
 *
 * Never throws: it is called from the submit and completion paths, and
 * failing to award a badge must not fail the thing that earned it.
 * Returns what was newly unlocked so a caller can show it immediately.
 */
export async function awardAchievements(
  userId: string
): Promise<UnlockedAchievement[]> {
  try {
    const [definitions, already] = await prisma.$transaction([
      prisma.achievement.findMany({
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          kind: true,
          threshold: true,
          icon: true,
          xp: true,
        },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
    ]);

    const held = new Set(already.map((row) => row.achievementId));

    // Nothing left to earn: skip the counters entirely. This is the
    // steady state for an engaged learner, and it keeps the submit path
    // at two cheap queries instead of ten.
    if (held.size === definitions.length) return [];

    const counters = await readCounters(userId);
    const earned = definitions.filter(
      (definition) =>
        !held.has(definition.id) &&
        counterFor(definition.kind, definition.slug, counters) >=
          definition.threshold
    );

    if (earned.length === 0) return [];

    // `createMany` with skipDuplicates rather than a transaction: the
    // unique constraint is on (userId, achievementId), so two concurrent
    // submissions race to the same rows instead of double-awarding.
    await prisma.userAchievement.createMany({
      data: earned.map((definition) => ({
        userId,
        achievementId: definition.id,
      })),
      skipDuplicates: true,
    });

    const unlockedAt = new Date();
    for (const definition of earned) {
      await notifyQuietly({
        userId,
        kind: "MILESTONE",
        title: definition.name,
        body: definition.description,
        href: "/profile",
      });
    }

    return earned.map((definition) => ({
      slug: definition.slug,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      xp: definition.xp,
      unlockedAt,
    }));
  } catch (error) {
    console.error("[achievements] award pass failed", error);
    return [];
  }
}

/**
 * Every achievement with the learner's progress towards it.
 *
 * Locked ones show how far along they are rather than being hidden: a
 * badge you cannot see is not a goal, and a progress bar is the only
 * part of this that changes behaviour.
 */
export async function listAchievements(
  userId: string
): Promise<AchievementProgress[]> {
  const [definitions, held] = await prisma.$transaction([
    prisma.achievement.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        kind: true,
        threshold: true,
        icon: true,
        xp: true,
      },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    }),
  ]);

  const counters = await readCounters(userId);

  const unlockedAt = new Map(
    held.map((row) => [row.achievementId, row.unlockedAt])
  );

  return definitions.map((definition) => ({
    slug: definition.slug,
    name: definition.name,
    description: definition.description,
    icon: definition.icon,
    xp: definition.xp,
    unlockedAt: unlockedAt.get(definition.id) ?? null,
    current: Math.min(
      counterFor(definition.kind, definition.slug, counters),
      definition.threshold
    ),
    threshold: definition.threshold,
  }));
}
