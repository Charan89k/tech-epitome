"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Language } from "@/generated/prisma/enums";
import { recordEvent } from "@/lib/analytics";
import { awardAchievements } from "@/services/achievements";
import { notifySolveMilestone } from "@/services/notifications";
import { getCurrentUser, requireUserOrThrow } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CUSTOM_INPUT_LIMITS } from "@/lib/code-execution/limits";
import { ANONYMOUS_SLOTS_PER_IP, withExecutionSlot } from "@/lib/execution-lock";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";
import { touchStudyDay } from "@/services/study-days";
import {
  runAgainstSamples,
  runCustomInput,
  submitSolution,
  type RunOutcome,
  type SubmitOutcome,
} from "@/services/submissions";

/**
 * Problem-solving mutations.
 *
 * Every one of these re-checks authorization and re-validates its input.
 * Code execution in particular is rate limited per user and per IP, because
 * it is the most expensive thing an unauthenticated-ish request can trigger,
 * and holds an execution lease (lib/execution-lock) so one learner has at
 * most one run or submit in flight, however many tabs they open.
 */

const BUSY_MESSAGE =
  "Your previous run is still going. Wait for it to finish, then try again.";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const executionSchema = z.object({
  slug: z.string().min(1).max(160),
  language: z.nativeEnum(Language),
  // Generous but bounded: a submission is a function, not a repository.
  code: z.string().min(1).max(60_000),
});

const runSchema = executionSchema.extend({
  /**
   * One test case in the harness wire format, run instead of the samples.
   * Bounded here by size; its shape is checked against the problem's
   * signature by the service before anything executes.
   */
  customInput: z.string().max(CUSTOM_INPUT_LIMITS.maxChars).optional(),
});

export async function runCodeAction(raw: unknown): Promise<ActionResult<RunOutcome>> {
  const parsed = runSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const user = await getCurrentUser();
  const owner = user ? user.id : `ip:${await getClientIp()}`;
  const limited = await rateLimit(`run:${owner}`, RATE_LIMITS.CODE_RUN);
  if (!limited.success) {
    return { ok: false, error: "Slow down a moment — too many runs. Try again shortly." };
  }

  const { slug, language, code, customInput } = parsed.data;

  try {
    const slot = await withExecutionSlot(
      owner,
      () =>
        customInput !== undefined
          ? runCustomInput(slug, language, code, customInput, user?.id ?? null)
          : runAgainstSamples(slug, language, code, user?.id ?? null),
      // One per learner; a few per IP for visitors, who may share one.
      { slots: user ? 1 : ANONYMOUS_SLOTS_PER_IP }
    );
    if (!slot.ok) return { ok: false, error: BUSY_MESSAGE };

    const outcome = slot.value;
    if (!outcome) return { ok: false, error: "That problem is not available." };
    if ("invalidInput" in outcome) return { ok: false, error: outcome.invalidInput };
    return { ok: true, data: outcome };
  } catch (error) {
    console.error("[run] execution failed", error);
    return {
      ok: false,
      error:
        error instanceof Error && error.message.includes("CODE_EXECUTION_DRIVER")
          ? error.message
          : "Could not run your code. The execution service may be unavailable.",
    };
  }
}

export async function submitCodeAction(
  raw: unknown
): Promise<ActionResult<SubmitOutcome>> {
  const user = await requireUserOrThrow();

  const parsed = executionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const limited = await rateLimit(`submit:${user.id}`, RATE_LIMITS.CODE_SUBMIT);
  if (!limited.success) {
    return { ok: false, error: "Too many submissions. Try again in a minute." };
  }

  try {
    const slot = await withExecutionSlot(user.id, () =>
      submitSolution(user.id, parsed.data.slug, parsed.data.language, parsed.data.code)
    );
    if (!slot.ok) return { ok: false, error: BUSY_MESSAGE };

    const outcome = slot.value;
    if (!outcome) return { ok: false, error: "That problem is not available." };

    // A duplicate is the earlier submission's result, already counted:
    // recording it again would double the attempt, the event and the XP.
    if (outcome.duplicate) return { ok: true, data: outcome };

    await recordEvent(user.id, "problem_submitted", {
      slug: parsed.data.slug,
      status: outcome.result.status,
    });

    if (outcome.result.status === "ACCEPTED") {
      await recordEvent(user.id, "problem_solved", { slug: parsed.data.slug });
      await touchStudyDay(user.id, { seconds: 0, chapters: 0, xp: 25, solved: 1 });

      // The counter the profile page already maintains, read back after
      // the write so the milestone fires on the exact number rather than
      // on an estimate.
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { problemsSolved: true },
      });
      if (profile) await notifySolveMilestone(user.id, profile.problemsSolved);

      // Recomputed from the learner's own rows, so this is idempotent and
      // a second submission awards nothing twice. Never throws.
      await awardAchievements(user.id);
    }

    revalidatePath("/dashboard");
    revalidatePath("/problems");
    return { ok: true, data: outcome };
  } catch (error) {
    console.error("[submit] execution failed", error);
    return {
      ok: false,
      error:
        error instanceof Error && error.message.includes("CODE_EXECUTION_DRIVER")
          ? error.message
          : "Could not run your submission. The execution service may be unavailable.",
    };
  }
}

/**
 * Reveals the next hint.
 *
 * The server decides which hint comes next from the stored counter, so the
 * ladder cannot be skipped by asking for hint 4 directly — which matters,
 * because the escalation is the teaching device.
 */
export async function revealHintAction(
  slug: string
): Promise<ActionResult<{ index: number; body: string; remaining: number }>> {
  const user = await requireUserOrThrow();

  const problem = await prisma.problem.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, hints: { orderBy: { order: "asc" }, select: { order: true, body: true } } },
  });

  if (!problem) return { ok: false, error: "That problem is not available." };
  if (problem.hints.length === 0) {
    return { ok: false, error: "This problem has no hints." };
  }

  const progress = await prisma.userProblemProgress.findUnique({
    where: { userId_problemId: { userId: user.id, problemId: problem.id } },
    select: { hintsRevealed: true },
  });

  const alreadyRevealed = progress?.hintsRevealed ?? 0;
  if (alreadyRevealed >= problem.hints.length) {
    return { ok: false, error: "You have already seen every hint." };
  }

  const next = problem.hints[alreadyRevealed]!;

  await prisma.userProblemProgress.upsert({
    where: { userId_problemId: { userId: user.id, problemId: problem.id } },
    create: {
      userId: user.id,
      problemId: problem.id,
      status: "ATTEMPTED",
      hintsRevealed: 1,
    },
    update: { hintsRevealed: alreadyRevealed + 1 },
  });

  await recordEvent(user.id, "hint_opened", { slug, index: alreadyRevealed + 1 });

  return {
    ok: true,
    data: {
      index: alreadyRevealed + 1,
      body: next.body,
      remaining: problem.hints.length - (alreadyRevealed + 1),
    },
  };
}

/** Records that the solution was opened. Tracked, never blocked. */
export async function revealSolutionAction(slug: string): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  const problem = await prisma.problem.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!problem) return { ok: false, error: "That problem is not available." };

  await prisma.userProblemProgress.upsert({
    where: { userId_problemId: { userId: user.id, problemId: problem.id } },
    create: {
      userId: user.id,
      problemId: problem.id,
      status: "ATTEMPTED",
      solutionViewedAt: new Date(),
    },
    update: { solutionViewedAt: new Date() },
  });

  await recordEvent(user.id, "solution_opened", { slug });
  return { ok: true, data: undefined };
}
