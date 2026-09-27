"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ExperienceLevel,
  InterviewType,
  Language,
  LearningGoal,
} from "@/generated/prisma/enums";
import { requireUserOrThrow } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * Onboarding answers.
 *
 * Every field is optional, because onboarding is genuinely skippable and
 * a default would record an answer the learner never gave. Skipping still
 * writes `onboardedAt`, so the prompt stops appearing — "I do not want to
 * answer" is itself an answer to whether we should keep asking.
 *
 * Nothing here gates anything. The answers steer what the dashboard
 * suggests first; they never decide what a learner may open.
 */

export type OnboardingState = {
  status: "idle" | "saved" | "error";
  message?: string;
};

const onboardingSchema = z.object({
  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
  primaryGoal: z.nativeEnum(LearningGoal).optional(),
  targetInterview: z.nativeEnum(InterviewType).optional(),
  preferredLanguage: z.nativeEnum(Language).optional(),
  // A week has seven days and nobody finishes fifty chapters in one, so
  // the range is the honest one rather than an arbitrary large number.
  weeklyTarget: z.coerce.number().int().min(1).max(40).optional(),
});

/** "" from an unanswered select becomes undefined, not a validation error. */
function opt(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

export async function saveOnboardingAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const user = await requireUserOrThrow();

  const parsed = onboardingSchema.safeParse({
    experienceLevel: opt(formData.get("experienceLevel")),
    primaryGoal: opt(formData.get("primaryGoal")),
    targetInterview: opt(formData.get("targetInterview")),
    preferredLanguage: opt(formData.get("preferredLanguage")),
    weeklyTarget: opt(formData.get("weeklyTarget")),
  });

  if (!parsed.success) {
    return { status: "error", message: "Those answers could not be saved." };
  }

  const data = {
    ...parsed.data,
    onboardedAt: new Date(),
  };

  try {
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
  } catch {
    return { status: "error", message: "Could not save that. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { status: "saved" };
}

/**
 * Records that the learner chose not to answer.
 *
 * Writes `onboardedAt` and nothing else, so the prompt stops without
 * inventing preferences. Everything stays null, and every screen that
 * reads a preference already handles null by showing nothing rather than
 * a default.
 */
export async function skipOnboardingAction(): Promise<{ ok: true }> {
  const user = await requireUserOrThrow();

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, onboardedAt: new Date() },
    update: { onboardedAt: new Date() },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
