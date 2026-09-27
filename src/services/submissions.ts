import "server-only";

import type { Language } from "@/generated/prisma/enums";
import {
  buildHarness,
  getExecutionService,
  spliceUserCode,
  type ExecutionResult,
  type Signature,
} from "@/lib/code-execution";
import { prisma } from "@/lib/db";
import {
  bumpReviewPriority,
  ensureReviewItem,
  initialEaseForProblem,
} from "@/services/review";

/**
 * Running and submitting code.
 *
 * Two modes, deliberately different:
 *
 *   run     — sample tests only, nothing recorded. This is the learner
 *             poking at their own code and should be free of consequence.
 *   submit  — every test, recorded as an attempt, and feeds progress and
 *             pattern mastery.
 *
 * Both execute through the CodeExecutionService abstraction, so neither
 * knows or cares whether that is a container or a subprocess.
 */

export type RunOutcome = {
  result: ExecutionResult;
  /** Which adapter ran it, and whether it actually isolates anything. */
  executor: { name: string; sandboxed: boolean };
};

type ProblemForExecution = {
  id: string;
  slug: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  signature: Signature;
};

async function loadProblem(slug: string): Promise<ProblemForExecution | null> {
  const problem = await prisma.problem.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      timeLimitMs: true,
      memoryLimitMb: true,
      harnessCode: true,
    },
  });

  if (!problem) return null;

  const stored = problem.harnessCode as { signature?: Signature } | null;
  if (!stored?.signature) {
    throw new Error(`Problem ${slug} has no stored signature.`);
  }

  return {
    id: problem.id,
    slug: problem.slug,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    signature: stored.signature,
  };
}

/** Runs against the sample tests only. Records nothing. */
export async function runAgainstSamples(
  slug: string,
  language: Language,
  code: string
): Promise<RunOutcome | null> {
  const problem = await loadProblem(slug);
  if (!problem) return null;

  const tests = await prisma.testCase.findMany({
    where: { problemId: problem.id, isSample: true },
    orderBy: { order: "asc" },
    select: { id: true, input: true, expected: true, isSample: true },
  });

  return execute(problem, language, code, tests);
}

/**
 * Runs the full suite, records a submission, and updates progress.
 *
 * Progress is written here rather than by the caller so there is exactly
 * one place where an accepted submission turns into a solved problem, a
 * study day and a mastery adjustment.
 */
export async function submitSolution(
  userId: string,
  slug: string,
  language: Language,
  code: string
): Promise<(RunOutcome & { submissionId: string }) | null> {
  const problem = await loadProblem(slug);
  if (!problem) return null;

  const tests = await prisma.testCase.findMany({
    where: { problemId: problem.id },
    // Samples first: a failure on a visible case is far more useful to show
    // than a failure on a hidden one.
    orderBy: [{ isSample: "desc" }, { order: "asc" }],
    select: { id: true, input: true, expected: true, isSample: true },
  });

  const outcome = await execute(problem, language, code, tests);

  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId: problem.id,
      language,
      code,
      status: outcome.result.status,
      passedCount: outcome.result.passed,
      totalCount: outcome.result.total,
      runtimeMs: outcome.result.executionTimeMs,
      memoryKb: outcome.result.memoryKb,
      errorMessage: outcome.result.compileError ?? null,
      testResults: outcome.result.results as unknown as object,
      isRun: false,
      completedAt: new Date(),
    },
    select: { id: true },
  });

  await updateProblemProgress(
    userId,
    problem.id,
    language,
    outcome.result.status === "ACCEPTED"
  );

  return { ...outcome, submissionId: submission.id };
}

async function execute(
  problem: ProblemForExecution,
  language: Language,
  code: string,
  tests: { id: string; input: string; expected: string; isSample: boolean }[]
): Promise<RunOutcome> {
  const service = await getExecutionService();

  // The harness is regenerated from the signature on every run rather than
  // stored, so fixing a reader bug fixes every problem at once instead of
  // requiring a data migration.
  const harness = buildHarness(language, problem.signature);
  const program = spliceUserCode(harness, code);

  const result = await service.execute({
    language,
    program,
    tests,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
  });

  return {
    result,
    executor: { name: service.name, sandboxed: service.isSandboxed },
  };
}

/**
 * Updates the per-problem record and, on a first solve, the aggregate
 * counters and pattern mastery.
 */
async function updateProblemProgress(
  userId: string,
  problemId: string,
  language: Language,
  accepted: boolean
): Promise<void> {
  const existing = await prisma.userProblemProgress.findUnique({
    where: { userId_problemId: { userId, problemId } },
    select: { status: true, hintsRevealed: true },
  });

  const alreadySolved = existing?.status === "SOLVED";
  const now = new Date();

  await prisma.userProblemProgress.upsert({
    where: { userId_problemId: { userId, problemId } },
    create: {
      userId,
      problemId,
      status: accepted ? "SOLVED" : "ATTEMPTED",
      attempts: 1,
      lastAttemptAt: now,
      firstSolvedAt: accepted ? now : null,
      solvedLanguage: accepted ? language : null,
    },
    update: {
      // Never downgrade a solved problem because of a later failed attempt.
      status: accepted || alreadySolved ? "SOLVED" : "ATTEMPTED",
      attempts: { increment: 1 },
      lastAttemptAt: now,
      ...(accepted && !alreadySolved
        ? { firstSolvedAt: now, solvedLanguage: language }
        : {}),
    },
  });

  await updatePatternMastery(userId, problemId, accepted, existing?.hintsRevealed ?? 0);

  await syncReviewSchedule(userId, problemId, accepted, existing);

  if (!accepted || alreadySolved) return;

  // First solve: bump the denormalised counters the dashboard reads.
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { difficulty: true },
  });

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      problemsSolved: 1,
      easySolved: problem?.difficulty === "EASY" ? 1 : 0,
      mediumSolved: problem?.difficulty === "MEDIUM" ? 1 : 0,
      hardSolved: problem?.difficulty === "HARD" ? 1 : 0,
    },
    update: {
      problemsSolved: { increment: 1 },
      ...(problem?.difficulty === "EASY" ? { easySolved: { increment: 1 } } : {}),
      ...(problem?.difficulty === "MEDIUM" ? { mediumSolved: { increment: 1 } } : {}),
      ...(problem?.difficulty === "HARD" ? { hardSolved: { increment: 1 } } : {}),
    },
  });
}

/**
 * Connects a submission to the spaced-revision queue.
 *
 * Solving creates the review items; failing pulls an existing one forward.
 * The asymmetry is deliberate — you cannot usefully review something you
 * have never solved, so a failed attempt on a problem with no review
 * history creates nothing rather than scheduling a card the learner has no
 * answer for.
 *
 * Two items are created on a solve, because they are different things worth
 * remembering: the problem itself, and the pattern it taught. The pattern is
 * the transferable half.
 */
async function syncReviewSchedule(
  userId: string,
  problemId: string,
  accepted: boolean,
  existing: { hintsRevealed: number } | null
): Promise<void> {
  if (!accepted) {
    // Getting it wrong again means it is worth seeing sooner, but only if
    // it is already being tracked.
    await bumpReviewPriority(userId, "PROBLEM", problemId);
    return;
  }

  const progress = await prisma.userProblemProgress.findUnique({
    where: { userId_problemId: { userId, problemId } },
    select: { hintsRevealed: true, solutionViewedAt: true },
  });

  const hintsRevealed = progress?.hintsRevealed ?? existing?.hintsRevealed ?? 0;
  const solutionViewed = Boolean(progress?.solutionViewedAt);

  await ensureReviewItem(userId, "PROBLEM", problemId, {
    // How much help it took sets the starting ease, so a problem solved
    // only after reading the solution comes back sooner and grows slower.
    ease: initialEaseForProblem(hintsRevealed, solutionViewed),
  });

  const primary = await prisma.problemPattern.findFirst({
    where: { problemId },
    orderBy: { isPrimary: "desc" },
    select: { patternId: true },
  });

  if (primary) {
    await ensureReviewItem(userId, "PATTERN", primary.patternId);
  }
}

/**
 * Recomputes mastery for every pattern the problem teaches.
 *
 * The score is an exponentially weighted average, so recent attempts matter
 * more than old ones — someone who struggled six months ago and has since
 * solved five cleanly should not still read as weak.
 *
 * Solving without hints scores full marks; solving after hints scores
 * partial, because needing the hint is exactly the signal that recognition
 * has not landed yet. That is also why mastery is never inferred from
 * anything other than observed attempts.
 */
async function updatePatternMastery(
  userId: string,
  problemId: string,
  accepted: boolean,
  hintsRevealed: number
): Promise<void> {
  const links = await prisma.problemPattern.findMany({
    where: { problemId },
    select: { patternId: true },
  });

  const attemptScore = !accepted ? 0 : hintsRevealed === 0 ? 100 : hintsRevealed <= 2 ? 70 : 45;

  const WEIGHT = 0.4; // how much one attempt moves the score

  for (const link of links) {
    const existing = await prisma.userPatternMastery.findUnique({
      where: { userId_patternId: { userId, patternId: link.patternId } },
      select: { score: true, attempts: true, solved: true, solvedNoHint: true },
    });

    const previous = existing?.score ?? 0;
    const next =
      existing && existing.attempts > 0
        ? Math.round(previous * (1 - WEIGHT) + attemptScore * WEIGHT)
        : attemptScore;

    await prisma.userPatternMastery.upsert({
      where: { userId_patternId: { userId, patternId: link.patternId } },
      create: {
        userId,
        patternId: link.patternId,
        score: next,
        attempts: 1,
        solved: accepted ? 1 : 0,
        solvedNoHint: accepted && hintsRevealed === 0 ? 1 : 0,
        lastPracticedAt: new Date(),
      },
      update: {
        score: next,
        attempts: { increment: 1 },
        solved: { increment: accepted ? 1 : 0 },
        solvedNoHint: { increment: accepted && hintsRevealed === 0 ? 1 : 0 },
        lastPracticedAt: new Date(),
      },
    });
  }
}

/** Recent scored submissions for a problem. */
export async function listSubmissions(userId: string, problemSlug: string) {
  return prisma.submission.findMany({
    where: { userId, isRun: false, problem: { slug: problemSlug } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      language: true,
      passedCount: true,
      totalCount: true,
      runtimeMs: true,
      createdAt: true,
    },
  });
}
