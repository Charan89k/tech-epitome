import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/db";

/** Only learners who opted in, and who chose a public name. */
export async function getLeaderboard(limit = 100) {
  return prisma.profile.findMany({
    where: {
      publicProfile: true,
      username: { not: null },
      problemsSolved: { gt: 0 },
      user: { status: "ACTIVE" },
    },
    orderBy: [
      { problemsSolved: "desc" },
      { hardSolved: "desc" },
      { longestStreak: "desc" },
    ],
    take: limit,
    select: {
      username: true,
      problemsSolved: true,
      easySolved: true,
      mediumSolved: true,
      hardSolved: true,
      currentStreak: true,
    },
  });
}

/** Null unless that learner opted in, so a private name looks like a missing one. */
export async function getPublicProfile(username: string) {
  const profile = await prisma.profile.findFirst({
    where: { username, publicProfile: true, user: { status: "ACTIVE" } },
    select: {
      username: true,
      bio: true,
      problemsSolved: true,
      easySolved: true,
      mediumSolved: true,
      hardSolved: true,
      currentStreak: true,
      longestStreak: true,
      userId: true,
    },
  });
  if (!profile) return null;
  const achievements = await prisma.userAchievement.findMany({
    where: { userId: profile.userId },
    select: { achievement: { select: { name: true, description: true } } },
    take: 24,
  });
  const { userId: _userId, ...rest } = profile;
  return { ...rest, achievements: achievements.map((a) => a.achievement) };
}

export const publicProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/, {
      message: "3-30 lowercase letters, digits, hyphens or underscores.",
    }),
  publicProfile: z.boolean(),
});

export type PublicProfileResult = "saved" | "username_taken";

export async function savePublicProfile(
  userId: string,
  input: z.infer<typeof publicProfileSchema>
): Promise<PublicProfileResult> {
  const clash = await prisma.profile.findUnique({
    where: { username: input.username },
    select: { userId: true },
  });
  if (clash && clash.userId !== userId) return "username_taken";
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
  return "saved";
}
