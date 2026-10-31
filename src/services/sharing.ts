import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * Shareable achievement summaries.
 *
 * Off by default: nothing is public until the learner creates a link, and
 * revoking it ends access at once. A link shows a name the learner typed
 * (or "A Tech Epitome learner"), unlocked achievements and three activity
 * counts. Never: email, account name, scores, interview feedback,
 * transcripts, notes, colleges or anything about other people.
 *
 * Only the SHA-256 of the token is stored, so the database cannot be read
 * back into working links. One active link per learner; making a new one
 * revokes the old.
 */

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export class ShareLimitError extends Error {}

export async function createShareLink(
  userId: string,
  displayName: string | null
): Promise<string> {
  const limited = await rateLimit(`share-link:${userId}`, RATE_LIMITS.SHARE_LINK);
  if (!limited.success)
    throw new ShareLimitError("Too many new links. Try again later.");

  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.shareLink.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.shareLink.create({
      data: { userId, tokenHash: hash(token), displayName },
    }),
  ]);
  return token;
}

export async function revokeShareLinks(userId: string): Promise<void> {
  await prisma.shareLink.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getActiveShareLink(
  userId: string
): Promise<{ createdAt: Date; displayName: string | null } | null> {
  return prisma.shareLink.findFirst({
    where: { userId, revokedAt: null },
    select: { createdAt: true, displayName: true },
  });
}

export type SharedSummary = {
  displayName: string;
  achievements: { name: string; description: string; unlockedAt: Date }[];
  counts: { problemsSolved: number; lessonsCompleted: number; mockInterviews: number };
};

/** The public view. Null for an unknown, revoked or suspended owner's link. */
export async function getSharedSummary(token: string): Promise<SharedSummary | null> {
  if (!SHARE_TOKEN_PATTERN.test(token)) return null;
  const link = await prisma.shareLink.findUnique({
    where: { tokenHash: hash(token) },
    select: {
      revokedAt: true,
      displayName: true,
      userId: true,
      user: { select: { status: true } },
    },
  });
  if (!link || link.revokedAt || link.user.status !== "ACTIVE") return null;
  const userId = link.userId;

  const [achievements, problemsSolved, lessonsCompleted, mockInterviews] =
    await Promise.all([
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "asc" },
        select: {
          unlockedAt: true,
          achievement: { select: { name: true, description: true } },
        },
      }),
      prisma.userProblemProgress.count({ where: { userId, status: "SOLVED" } }),
      prisma.userChapterProgress.count({ where: { userId, status: "COMPLETED" } }),
      prisma.interviewSession.count({ where: { userId, status: "COMPLETED" } }),
    ]);

  return {
    displayName: link.displayName ?? "A Tech Epitome learner",
    achievements: achievements.map((a) => ({
      name: a.achievement.name,
      description: a.achievement.description,
      unlockedAt: a.unlockedAt,
    })),
    counts: { problemsSolved, lessonsCompleted, mockInterviews },
  };
}
