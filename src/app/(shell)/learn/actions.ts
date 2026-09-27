"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, requireUserOrThrow } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import { touchStudyDay } from "@/services/study-days";
import { awardAchievements } from "@/services/achievements";
import { ensureReviewItem } from "@/services/review";
import { gradeQuiz, type QuizResult } from "@/services/quiz";
import { quizSubmissionSchema } from "@/lib/validation/quiz";

/**
 * Learning-side mutations.
 *
 * Progress is written here and nowhere else, so the denormalised counters on
 * Profile and StudyDay cannot drift: every path that advances a learner runs
 * through one of these functions.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Records that a chapter was opened.
 *
 * Deliberately does NOT mark it complete. Opening a page is not learning,
 * and a curriculum that ticks itself off as you scroll past is worthless as
 * a record of what you actually know.
 */
export async function startChapterAction(chapterId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return; // anonymous browsing is allowed; there is just nothing to record

  const existing = await prisma.userChapterProgress.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId } },
    select: { status: true },
  });

  // Never downgrade a completed chapter back to in-progress on a revisit.
  if (existing?.status === "COMPLETED") return;

  await prisma.userChapterProgress.upsert({
    where: { userId_chapterId: { userId: user.id, chapterId } },
    create: {
      userId: user.id,
      chapterId,
      status: "IN_PROGRESS",
      percent: 0,
      startedAt: new Date(),
    },
    update: { status: "IN_PROGRESS" },
  });

  await recordEvent(user.id, "lesson_started", { chapterId });
}

/** Marks a chapter complete. Explicit — the learner has to say so. */
export async function completeChapterAction(
  chapterId: string,
  secondsSpent = 0
): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, status: true, keyTakeaways: true },
  });

  if (!chapter || chapter.status !== "PUBLISHED") {
    return { ok: false, error: "That chapter is not available." };
  }

  const already = await prisma.userChapterProgress.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId } },
    select: { status: true },
  });

  const alreadyComplete = already?.status === "COMPLETED";

  await prisma.userChapterProgress.upsert({
    where: { userId_chapterId: { userId: user.id, chapterId } },
    create: {
      userId: user.id,
      chapterId,
      status: "COMPLETED",
      percent: 100,
      seconds: clampSeconds(secondsSpent),
      startedAt: new Date(),
      completedAt: new Date(),
    },
    update: {
      status: "COMPLETED",
      percent: 100,
      seconds: { increment: clampSeconds(secondsSpent) },
      completedAt: new Date(),
    },
  });

  // Counting a re-completion would let anyone inflate their study time by
  // clicking the button repeatedly.
  if (!alreadyComplete) {
    await touchStudyDay(user.id, {
      seconds: clampSeconds(secondsSpent),
      chapters: 1,
      xp: 20,
    });
    await recordEvent(user.id, "lesson_completed", { chapterId });
    await awardAchievements(user.id);
  }

  // Schedule the concept for recall. Only chapters that state what should
  // be remembered get one: a review card built from nothing would ask the
  // learner to recall nothing. `ensureReviewItem` is an upsert that leaves
  // an existing schedule alone, so re-completing a chapter never resets it.
  if (chapter.keyTakeaways.length > 0) {
    await ensureReviewItem(user.id, "CHAPTER", chapterId);
  }

  revalidatePath("/dashboard");
  revalidatePath("/learn/dsa");
  revalidatePath("/review");
  return { ok: true, data: undefined };
}

/** Undoes a completion, for a learner who marked the wrong chapter. */
export async function uncompleteChapterAction(
  chapterId: string
): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  await prisma.userChapterProgress.updateMany({
    where: { userId: user.id, chapterId },
    data: { status: "IN_PROGRESS", percent: 50, completedAt: null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/learn/dsa");
  return { ok: true, data: undefined };
}

export async function submitQuizAction(
  raw: unknown
): Promise<ActionResult<QuizResult>> {
  const user = await requireUserOrThrow();

  const parsed = quizSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That submission was not in the expected shape." };
  }

  const result = await gradeQuiz(user.id, parsed.data.quizSlug, parsed.data.answers);
  if (!result) {
    return { ok: false, error: "That quiz is not available." };
  }

  await touchStudyDay(user.id, { seconds: 0, chapters: 0, xp: result.passed ? 15 : 5 });
  await recordEvent(user.id, "quiz_completed", {
    quizSlug: parsed.data.quizSlug,
    percent: result.percent,
    passed: result.passed,
  });

  revalidatePath("/dashboard");
  return { ok: true, data: result };
}

/** Seconds are clamped so a tab left open overnight cannot claim eight hours. */
function clampSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.min(Math.round(seconds), 60 * 60);
}

