import "server-only";

import { recordEvent } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { awardAchievements } from "./achievements";
import { ensureReviewItem } from "./review";
import { touchStudyDay } from "./study-days";

/**
 * Chapter progress writes. Completion semantics:
 *
 * - Opening a published chapter moves it NOT_STARTED -> IN_PROGRESS. It
 *   never downgrades a COMPLETED chapter.
 * - Completing is explicit. `completedAt` records the *first* completion and
 *   is never cleared, so un-marking and re-marking a chapter cannot earn its
 *   XP, study-day count or achievement progress twice.
 * - Every write is a single conditional statement (insert-if-absent, or
 *   update-where-still-eligible), so concurrent requests cannot create a
 *   duplicate row or double-count a counter.
 *
 * Callers authenticate first and pass their own user id; this module is not
 * reachable from a browser.
 */

export const CHAPTER_XP = 20;
/** A tab left open overnight cannot claim eight hours. */
const MAX_CHAPTER_SECONDS = 60 * 60;

export function clampSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.min(Math.round(seconds), MAX_CHAPTER_SECONDS);
}

async function publishedChapter(chapterId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, status: true, keyTakeaways: true },
  });
  return chapter?.status === "PUBLISHED" ? chapter : null;
}

/** Inserts the progress row if absent. ON CONFLICT DO NOTHING: race-free. */
async function ensureRow(userId: string, chapterId: string): Promise<boolean> {
  const { count } = await prisma.userChapterProgress.createMany({
    data: [{ userId, chapterId, status: "IN_PROGRESS", startedAt: new Date() }],
    skipDuplicates: true,
  });
  return count === 1;
}

/** Returns false when the chapter is missing or unpublished. */
export async function startChapter(
  userId: string,
  chapterId: string
): Promise<boolean> {
  if (!(await publishedChapter(chapterId))) return false;

  const created = await ensureRow(userId, chapterId);
  if (!created) {
    await prisma.userChapterProgress.updateMany({
      where: { userId, chapterId, status: "NOT_STARTED" },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
    return true;
  }
  await recordEvent(userId, "lesson_started", { chapterId });
  return true;
}

export type CompletionResult =
  { ok: true; firstCompletion: boolean } | { ok: false; error: "not_found" };

export async function completeChapter(
  userId: string,
  chapterId: string,
  secondsSpent = 0
): Promise<CompletionResult> {
  const chapter = await publishedChapter(chapterId);
  if (!chapter) return { ok: false, error: "not_found" };

  const seconds = clampSeconds(secondsSpent);
  await ensureRow(userId, chapterId);

  // Only one request can win this: the row stops matching once it is set.
  const first = await prisma.userChapterProgress.updateMany({
    where: { userId, chapterId, completedAt: null },
    data: {
      status: "COMPLETED",
      percent: 100,
      completedAt: new Date(),
      seconds: { increment: seconds },
    },
  });
  const firstCompletion = first.count === 1;

  if (firstCompletion) {
    await touchStudyDay(userId, { seconds, chapters: 1, xp: CHAPTER_XP });
    await recordEvent(userId, "lesson_completed", { chapterId });
    await awardAchievements(userId);
  } else {
    await prisma.userChapterProgress.updateMany({
      where: { userId, chapterId },
      data: { status: "COMPLETED", percent: 100 },
    });
  }

  // A review card built from no takeaways would ask the learner to recall
  // nothing. `ensureReviewItem` leaves an existing schedule alone.
  if (chapter.keyTakeaways.length > 0) {
    await ensureReviewItem(userId, "CHAPTER", chapterId);
  }

  return { ok: true, firstCompletion };
}

/** Undoes a mistaken completion. Keeps `completedAt`, so no credit is re-earned. */
export async function uncompleteChapter(
  userId: string,
  chapterId: string
): Promise<void> {
  await prisma.userChapterProgress.updateMany({
    where: { userId, chapterId, status: "COMPLETED" },
    data: { status: "IN_PROGRESS", percent: 50 },
  });
}
