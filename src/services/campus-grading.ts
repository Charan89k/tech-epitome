import "server-only";

import type { Language, Prisma } from "@/generated/prisma/client";
import type { AttemptFinish } from "@/generated/prisma/enums";
import {
  applyLatePenalty,
  hardClose,
  isLate,
  scoreChoice,
  scoreCoding,
} from "@/lib/campus/rules";
import { executionStatus } from "@/lib/code-execution";
import { prisma } from "@/lib/db";
import type { TenantTx } from "@/lib/tenancy/scope";

import type { AnswerKey, PaperQuestion } from "./campus-assessments";
import { runAgainstAllTests } from "./submissions";

/**
 * Finalising and scoring attempts.
 *
 * Finalisation runs in the caller's tenant transaction (student or staff).
 * Scoring needs the answer key, which no role a student acts under may
 * read, so gradeAttempt and autoGradeCoding run as the database owner.
 * They are reachable only from server code after the tenant transaction
 * has already authorised the attempt, never with an id taken straight from
 * a request.
 *
 * Definitions (docs/CAMPUS.md):
 *   - An attempt is final once SUBMITTED, by the student, by its time limit
 *     or deadline running out (applied lazily on the next read by anyone),
 *     or by staff closing the assessment. Answers saved before that moment
 *     count; nothing after it can be saved (the database checks the clock).
 *   - It is late if any answer was saved after closesAt, i.e. inside the
 *     grace window. Submitting late without changing anything is not late.
 */

type Timing = { closesAt: Date; lateUntil: Date | null };

export async function finalizeOpenAttempts(
  tx: TenantTx,
  assessment: Timing,
  where: Prisma.AssessmentAttemptWhereInput,
  reason: AttemptFinish
): Promise<string[]> {
  const now = new Date();
  const open = await tx.assessmentAttempt.findMany({
    where: { ...where, status: "IN_PROGRESS" },
    select: { id: true, deadlineAt: true },
  });
  const finalized: string[] = [];
  for (const attempt of open) {
    const expired = now >= attempt.deadlineAt;
    const last = await tx.attemptAnswer.aggregate({
      where: { attemptId: attempt.id },
      _max: { savedAt: true },
    });
    const lastSaved = last._max.savedAt;
    const { count } = await tx.assessmentAttempt.updateMany({
      where: { id: attempt.id, status: "IN_PROGRESS" },
      data: {
        status: "SUBMITTED",
        submittedAt: expired ? attempt.deadlineAt : now,
        finish: expired
          ? attempt.deadlineAt >= hardClose(assessment)
            ? "DEADLINE"
            : "TIME_EXPIRED"
          : reason,
        late: lastSaved ? isLate(assessment, lastSaved) : false,
      },
    });
    if (count === 1) finalized.push(attempt.id);
  }
  return finalized;
}

/**
 * Sums the attempt from its answers: staff points win over automatic ones,
 * an unanswered question scores 0, and a coding answer with neither leaves
 * the attempt flagged for grading. The late penalty applies to the total.
 */
export async function recomputeScore(
  client: TenantTx,
  attemptId: string
): Promise<number> {
  const attempt = await client.assessmentAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    select: {
      late: true,
      assessment: { select: { latePenaltyPercent: true } },
      version: { select: { questions: true } },
      answers: { select: { questionKey: true, points: true, autoPoints: true } },
    },
  });
  const questions = attempt.version.questions as PaperQuestion[];
  let raw = 0;
  let needsGrading = false;
  for (const q of questions) {
    const answer = attempt.answers.find((a) => a.questionKey === q.key);
    if (!answer) continue;
    const points = answer.points ?? answer.autoPoints;
    if (points === null) {
      if (q.kind === "CODING") needsGrading = true;
      continue;
    }
    raw += points;
  }
  const score =
    Math.round(
      applyLatePenalty(raw, attempt.late, attempt.assessment.latePenaltyPercent) * 100
    ) / 100;
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  await client.assessmentAttempt.update({
    where: { id: attemptId },
    data: { score, needsGrading, maxScore },
  });
  return score;
}

async function loadForGrading(attemptId: string) {
  return prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      status: true,
      userId: true,
      version: { select: { questions: true, answerKey: { select: { key: true } } } },
      answers: {
        select: {
          id: true,
          questionKey: true,
          value: true,
          autoPoints: true,
          points: true,
        },
      },
    },
  });
}

/** Scores the choice answers of a finalised attempt. Owner connection. */
export async function gradeAttempt(attemptId: string): Promise<void> {
  const attempt = await loadForGrading(attemptId);
  if (!attempt || attempt.status !== "SUBMITTED") return;
  const questions = attempt.version.questions as PaperQuestion[];
  const key = (attempt.version.answerKey?.key ?? {}) as AnswerKey;

  await prisma.$transaction(async (tx) => {
    for (const answer of attempt.answers) {
      const q = questions.find((x) => x.key === answer.questionKey);
      const expected = key[answer.questionKey]?.answer;
      if (!q || q.kind !== "CHOICE" || expected == null) continue;
      await tx.attemptAnswer.update({
        where: { id: answer.id },
        data: { autoPoints: scoreChoice(expected, answer.value, q.points) },
      });
    }
    await recomputeScore(tx, attemptId);
  });
}

/**
 * Runs each coding answer against all of its problem's tests, if code
 * execution is enabled. Otherwise the answers stay for staff to grade.
 * Called after the response (next/server `after`), so a submit never waits
 * on containers.
 */
export async function autoGradeCoding(attemptId: string): Promise<void> {
  if (!executionStatus().available) return;
  const attempt = await loadForGrading(attemptId);
  if (!attempt || attempt.status !== "SUBMITTED") return;
  const questions = attempt.version.questions as PaperQuestion[];

  let changed = false;
  for (const answer of attempt.answers) {
    const q = questions.find((x) => x.key === answer.questionKey);
    if (!q?.problem || answer.points !== null || answer.autoPoints !== null) continue;
    const value = answer.value as { language?: Language; code?: string } | null;
    if (!value?.language || !value.code?.trim()) continue;
    try {
      const outcome = await runAgainstAllTests(
        q.problem.slug,
        value.language,
        value.code,
        attempt.userId
      );
      if (!outcome || outcome.result.status === "INTERNAL_ERROR") continue;
      const { passed, total, status } = outcome.result;
      await prisma.attemptAnswer.update({
        where: { id: answer.id },
        data: {
          autoPoints: scoreCoding(passed, total, q.points),
          autoResult: { status, passed, total },
        },
      });
      changed = true;
    } catch (error) {
      // Left ungraded and flagged; staff grade it by hand.
      console.error("[campus] coding auto-grade failed", {
        attemptId,
        questionKey: answer.questionKey,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  if (changed) await recomputeScore(prisma, attemptId);
}
