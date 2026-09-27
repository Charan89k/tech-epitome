"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Language } from "@/generated/prisma/enums";
import { recordEvent } from "@/lib/analytics";
import { notifySolveMilestone } from "@/services/notifications";
import { getCurrentUser, requireUserOrThrow } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";
import { touchStudyDay } from "@/app/(shell)/learn/actions";
import {
  runAgainstSamples,
  submitSolution,
  type RunOutcome,
} from "@/services/submissions";

/**
 * Problem-solving mutations.
 *
 * Every one of these re-checks authorization and re-validates its input.
 * Code execution in particular is rate limited per user and per IP, because
 * it is the most expensive thing an unauthenticated-ish request can trigger.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const executionSchema = z.object({
  slug: z.string().min(1).max(160),
  language: z.nativeEnum(Language),
  // Generous but bounded: a submission is a function, not a repository.
  code: z.string().min(1).max(60_000),
});

export async function runCodeAction(raw: unknown): Promise<ActionResult<RunOutcome>> {
  const parsed = executionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const user = await getCurrentUser();
  const key = user ? `run:${user.id}` : `run:${await getClientIp()}`;
  const limited = await rateLimit(key, RATE_LIMITS.CODE_RUN);
  if (!limited.success) {
    return { ok: false, error: "Slow down a moment — too many runs. Try again shortly." };
  }

  try {
    const outcome = await runAgainstSamples(
      parsed.data.slug,
      parsed.data.language,
      parsed.data.code
    );
    if (!outcome) return { ok: false, error: "That problem is not available." };
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
): Promise<ActionResult<RunOutcome & { submissionId: string }>> {
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
    const outcome = await submitSolution(
      user.id,
      parsed.data.slug,
      parsed.data.language,
      parsed.data.code
    );
    if (!outcome) return { ok: false, error: "That problem is not available." };

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
