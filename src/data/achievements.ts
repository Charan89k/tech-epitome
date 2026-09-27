import type { AchievementKind } from "@/generated/prisma/enums";

/**
 * Achievement definitions.
 *
 * Kept deliberately restrained: milestones that mark real progress through
 * the material, not a points economy. Nothing here is awarded for logging
 * in, and nothing compares one learner to another.
 *
 * `threshold` is interpreted per `kind` by the achievement service:
 *   PROBLEMS_SOLVED      total accepted problems
 *   DIFFICULTY_MILESTONE count at the difficulty named in the slug
 *   STREAK               consecutive study days
 *   PATTERN_MASTERY      patterns at or above the mastery score
 *   COURSE_COMPLETION    courses fully completed
 *   REVIEW_CONSISTENCY   review items cleared on time
 */
export type AchievementSeed = {
  slug: string;
  name: string;
  description: string;
  kind: AchievementKind;
  threshold: number;
  icon: string;
  xp: number;
  order: number;
};

export const ACHIEVEMENTS: AchievementSeed[] = [
  {
    slug: "first-problem",
    name: "First Forge",
    description: "Solved your first problem.",
    kind: "PROBLEMS_SOLVED",
    threshold: 1,
    icon: "Sparkles",
    xp: 50,
    order: 10,
  },
  {
    slug: "ten-problems",
    name: "Ten Down",
    description: "Solved ten problems.",
    kind: "PROBLEMS_SOLVED",
    threshold: 10,
    icon: "ListChecks",
    xp: 100,
    order: 20,
  },
  {
    slug: "fifty-problems",
    name: "Fifty Deep",
    description: "Solved fifty problems.",
    kind: "PROBLEMS_SOLVED",
    threshold: 50,
    icon: "Layers",
    xp: 300,
    order: 30,
  },
  {
    slug: "hundred-problems",
    name: "Century",
    description: "Solved one hundred problems.",
    kind: "PROBLEMS_SOLVED",
    threshold: 100,
    icon: "Trophy",
    xp: 600,
    order: 40,
  },
  {
    slug: "first-medium",
    name: "Stepping Up",
    description: "Solved your first Medium problem.",
    kind: "DIFFICULTY_MILESTONE",
    threshold: 1,
    icon: "TrendingUp",
    xp: 100,
    order: 50,
  },
  {
    slug: "first-hard",
    name: "Deep Water",
    description: "Solved your first Hard problem.",
    kind: "DIFFICULTY_MILESTONE",
    threshold: 1,
    icon: "Flame",
    xp: 200,
    order: 60,
  },
  {
    slug: "streak-7",
    name: "Seven Straight",
    description: "Studied seven days in a row.",
    kind: "STREAK",
    threshold: 7,
    icon: "CalendarCheck",
    xp: 150,
    order: 70,
  },
  {
    slug: "streak-30",
    name: "A Month of Mornings",
    description: "Studied thirty days in a row.",
    kind: "STREAK",
    threshold: 30,
    icon: "CalendarHeart",
    xp: 500,
    order: 80,
  },
  {
    slug: "pattern-first",
    name: "Pattern Spotter",
    description: "Reached mastery on your first pattern.",
    kind: "PATTERN_MASTERY",
    threshold: 1,
    icon: "Shapes",
    xp: 150,
    order: 90,
  },
  {
    slug: "pattern-ten",
    name: "Pattern Master",
    description: "Reached mastery on ten patterns.",
    kind: "PATTERN_MASTERY",
    threshold: 10,
    icon: "Boxes",
    xp: 500,
    order: 100,
  },
  {
    slug: "course-first",
    name: "Course Cleared",
    description: "Completed every chapter in a course.",
    kind: "COURSE_COMPLETION",
    threshold: 1,
    icon: "GraduationCap",
    xp: 400,
    order: 110,
  },
  {
    slug: "review-fifty",
    name: "It Stuck",
    description: "Cleared fifty scheduled reviews on time.",
    kind: "REVIEW_CONSISTENCY",
    threshold: 50,
    icon: "Repeat2",
    xp: 300,
    order: 120,
  },
];
