"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser, requireUserOrThrow } from "@/lib/auth/session";
import { recordEvent } from "@/lib/analytics";
import { touchStudyDay } from "@/services/study-days";
import { awardAchievements } from "@/services/achievements";
import {
  completeChapter,
  startChapter,
  uncompleteChapter,
} from "@/services/learning-progress";
import { gradeQuiz, type QuizResult } from "@/services/quiz";
import { quizSubmissionSchema } from "@/lib/validation/quiz";

/**
 * Learning-side mutations.
 *
 * Authenticate and validate here; the progress rules themselves live in
 * `services/learning-progress` and `services/quiz`, so the denormalised
 * counters on Profile and StudyDay have one writer each.
 */

const chapterIdSchema = z.string().min(1).max(64);
const QUIZ_PASS_XP = 15;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Records that a chapter was opened. Deliberately does NOT mark it complete:
 * opening a page is not learning. Semantics live in `learning-progress`.
 */
export async function startChapterAction(chapterId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return; // anonymous browsing is allowed; there is just nothing to record
  if (!chapterIdSchema.safeParse(chapterId).success) return;
  await startChapter(user.id, chapterId);
}

/** Marks a chapter complete. Explicit — the learner has to say so. */
export async function completeChapterAction(
  chapterId: string,
  secondsSpent = 0
): Promise<ActionResult> {
  const user = await requireUserOrThrow();
  if (!chapterIdSchema.safeParse(chapterId).success) {
    return { ok: false, error: "That chapter is not available." };
  }

  const result = await completeChapter(user.id, chapterId, Number(secondsSpent));
  if (!result.ok) return { ok: false, error: "That chapter is not available." };

  revalidatePath("/dashboard");
  revalidatePath("/learn", "layout");
  revalidatePath("/review");
  return { ok: true, data: undefined };
}

/** Undoes a completion, for a learner who marked the wrong chapter. */
export async function uncompleteChapterAction(
  chapterId: string
): Promise<ActionResult> {
  const user = await requireUserOrThrow();
  if (!chapterIdSchema.safeParse(chapterId).success) {
    return { ok: false, error: "That chapter is not available." };
  }
  await uncompleteChapter(user.id, chapterId);

  revalidatePath("/dashboard");
  revalidatePath("/learn", "layout");
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

  // Every attempt counts as activity for the streak; XP only for the first pass.
  await touchStudyDay(user.id, {
    seconds: 0,
    chapters: 0,
    xp: result.firstPass ? QUIZ_PASS_XP : 0,
  });
  await recordEvent(user.id, "quiz_completed", {
    quizSlug: parsed.data.quizSlug,
    percent: result.percent,
    passed: result.passed,
  });
  await awardAchievements(user.id);

  revalidatePath("/dashboard");
  return { ok: true, data: result };
}
