import "server-only";

import { cache } from "react";

import { daysBetweenUtc } from "@/lib/dates";
import { prisma } from "@/lib/db";

/**
 * Progress reads.
 *
 * All of these hit denormalised counters (Profile, StudyDay) rather than
 * aggregating raw events, because every one of them is on the dashboard's
 * critical path. The counters are maintained by the write-side functions in
 * this module, so there is exactly one place that can get them wrong.
 */

/** Current streak in days. Zero when the user has never studied. */
export const getStreak = cache(async (userId: string): Promise<number> => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { currentStreak: true, lastActiveOn: true },
  });

  if (!profile?.lastActiveOn) return 0;

  // A stored streak goes stale the moment a day is missed, and nothing runs
  // overnight to reset it. Recompute freshness on read: the streak only
  // counts if the last active day was today or yesterday.
  const days = daysBetweenUtc(profile.lastActiveOn, new Date());
  return days <= 1 ? profile.currentStreak : 0;
});

export type ProgressSummary = {
  problemsSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  patternsMastered: number;
  currentStreak: number;
  longestStreak: number;
  studySeconds: number;
  chaptersCompleted: number;
};

/** Score at or above which a pattern counts as mastered. */
export const PATTERN_MASTERY_THRESHOLD = 75;

export const getProgressSummary = cache(
  async (userId: string): Promise<ProgressSummary> => {
    const [profile, patternsMastered, chaptersCompleted] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId },
        select: {
          problemsSolved: true,
          easySolved: true,
          mediumSolved: true,
          hardSolved: true,
          currentStreak: true,
          longestStreak: true,
          studySeconds: true,
          lastActiveOn: true,
        },
      }),
      prisma.userPatternMastery.count({
        where: { userId, score: { gte: PATTERN_MASTERY_THRESHOLD } },
      }),
      prisma.userChapterProgress.count({
        where: { userId, status: "COMPLETED" },
      }),
    ]);

    const streakIsCurrent =
      profile?.lastActiveOn != null &&
      daysBetweenUtc(profile.lastActiveOn, new Date()) <= 1;

    return {
      problemsSolved: profile?.problemsSolved ?? 0,
      easySolved: profile?.easySolved ?? 0,
      mediumSolved: profile?.mediumSolved ?? 0,
      hardSolved: profile?.hardSolved ?? 0,
      patternsMastered,
      currentStreak: streakIsCurrent ? (profile?.currentStreak ?? 0) : 0,
      longestStreak: profile?.longestStreak ?? 0,
      studySeconds: profile?.studySeconds ?? 0,
      chaptersCompleted,
    };
  }
);

export { daysBetweenUtc, utcDayStart } from "@/lib/dates";
