import "server-only";

import { randomUUID } from "node:crypto";

import type { Language } from "@/generated/prisma/enums";
import {
  buildHarness,
  DUPLICATE_SUBMIT_WINDOW_MS,
  getExecutionService,
  spliceUserCode,
  validateCustomInput,
  type ExecutionResult,
  type ExecutionTestCase,
  type Signature,
  type TestResult,
} from "@/lib/code-execution";
import { logExecution, type ExecutionMode } from "@/lib/code-execution/log";
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
 *   custom  — a run on one input the learner wrote, in the same wire format
 *             as the test cases, validated against the problem's signature.
 *             There is no expected output, so it reports what the function
 *             returned rather than a verdict. Also recorded nowhere.
 *   submit  — every test, recorded as an attempt, and feeds progress and
 *             pattern mastery.
 *
 * Every execution writes one structured log line (lib/code-execution/log),
 * which never contains code or test data.
 *
 * Both execute through the CodeExecutionService abstraction, so neither
 * knows or cares whether that is a container or a subprocess.
 */

export type RunOutcome = {
  result: ExecutionResult;
  /** Which adapter ran it, and whether it actually isolates anything. */
  executor: { name: string; sandboxed: boolean };
  /** A custom-input run: one case, reported as output rather than a verdict. */
  custom?: boolean;
};

export type SubmitOutcome = RunOutcome & {
  submissionId: string;
  /**
   * The same code was submitted moments ago; this is that submission's
   * stored result, and nothing was executed or recorded again.
   */
  duplicate?: boolean;
};

/** Who is running code, for the execution log. Null is a signed-out Run. */
type Actor = string | null;

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
  code: string,
  actor: Actor = null
): Promise<RunOutcome | null> {
  const problem = await loadProblem(slug);
  if (!problem) return null;

  const tests = await prisma.testCase.findMany({
    where: { problemId: problem.id, isSample: true },
    orderBy: { order: "asc" },
    select: { id: true, input: true, expected: true, isSample: true },
  });

  return execute(problem, language, code, tests, { mode: "run", actor });
}

/**
 * Runs against every test case, hidden ones included. Records nothing: the
 * caller (campus exam grading) stores its own result.
 */
export async function runAgainstAllTests(
  slug: string,
  language: Language,
  code: string,
  actor: Actor
): Promise<RunOutcome | null> {
  const problem = await loadProblem(slug);
  if (!problem) return null;

  const tests = await prisma.testCase.findMany({
    where: { problemId: problem.id },
    orderBy: [{ isSample: "desc" }, { order: "asc" }],
    select: { id: true, input: true, expected: true, isSample: true },
  });

  return execute(problem, language, code, tests, { mode: "submit", actor });
}

/**
 * Runs the learner's function on one input they wrote. Records nothing.
 *
 * The input is checked against this problem's signature first, so the only
 * thing that ever reaches the executor is a well-formed case for the
 * existing harness — never a free-form program or stdin of the learner's
 * choosing.
 */
export async function runCustomInput(
  slug: string,
  language: Language,
  code: string,
  customInput: string,
  actor: Actor = null
): Promise<RunOutcome | { invalidInput: string } | null> {
  const problem = await loadProblem(slug);
  if (!problem) return null;

  const checked = validateCustomInput(problem.signature, customInput);
  if (!checked.ok) return { invalidInput: checked.error };

  const outcome = await execute(
    problem,
    language,
    code,
    [{ id: "custom", input: checked.input, expected: null, isSample: true }],
    { mode: "custom", actor }
  );
  return { ...outcome, custom: true };
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
): Promise<SubmitOutcome | null> {
  const problem = await loadProblem(slug);
  if (!problem) return null;

  const duplicate = await findDuplicateSubmission(userId, problem.id, language, code);
  if (duplicate) return duplicate;

  const tests = await prisma.testCase.findMany({
    where: { problemId: problem.id },
    // Samples first: a failure on a visible case is far more useful to show
    // than a failure on a hidden one.
    orderBy: [{ isSample: "desc" }, { order: "asc" }],
    select: { id: true, input: true, expected: true, isSample: true },
  });

  const outcome = await execute(problem, language, code, tests, {
    mode: "submit",
    actor: userId,
  });

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

/**
 * The same learner submitting the same code to the same problem within
 * DUPLICATE_SUBMIT_WINDOW_MS gets the stored result back instead of a
 * second execution and a second recorded attempt.
 *
 * Deterministic and server-side: the decision depends only on what is in
 * the database, not on any client state. Two tabs submitting at the same
 * instant are serialised by the execution lease in the action, so the
 * second sees the first's row here.
 */
async function findDuplicateSubmission(
  userId: string,
  problemId: string,
  language: Language,
  code: string
): Promise<SubmitOutcome | null> {
  const recent = await prisma.submission.findFirst({
    where: {
      userId,
      problemId,
      language,
      code,
      isRun: false,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_SUBMIT_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      passedCount: true,
      totalCount: true,
      runtimeMs: true,
      memoryKb: true,
      errorMessage: true,
      testResults: true,
    },
  });
  if (!recent) return null;

  const service = await getExecutionService();
  const results = (recent.testResults ?? []) as unknown as TestResult[];

  logExecution({
    executionId: randomUUID(),
    userId,
    problemId,
    language,
    mode: "submit",
    provider: service.name,
    status: recent.status,
    durationMs: 0,
    memoryKb: recent.memoryKb,
    testCount: recent.totalCount ?? results.length,
    deduplicated: true,
  });

  return {
    result: {
      status: recent.status,
      passed: recent.passedCount ?? 0,
      total: recent.totalCount ?? results.length,
      executionTimeMs: recent.runtimeMs ?? 0,
      memoryKb: recent.memoryKb,
      ...(recent.errorMessage ? { compileError: recent.errorMessage } : {}),
      results,
    },
    executor: { name: service.name, sandboxed: service.isSandboxed },
    submissionId: recent.id,
    duplicate: true,
  };
}

async function execute(
  problem: ProblemForExecution,
  language: Language,
  code: string,
  tests: ExecutionTestCase[],
  context: { mode: ExecutionMode; actor: Actor }
): Promise<RunOutcome> {
  const executionId = randomUUID();
  const started = Date.now();
  let provider = "unavailable";

  try {
    const service = await getExecutionService();
    provider = service.name;

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

    logExecution({
      executionId,
      userId: context.actor ?? "anonymous",
      problemId: problem.id,
      language,
      mode: context.mode,
      provider,
      status: result.status,
      durationMs: Date.now() - started,
      memoryKb: result.memoryKb,
      testCount: tests.length,
    });

    return {
      result,
      executor: { name: service.name, sandboxed: service.isSandboxed },
    };
  } catch (error) {
    logExecution({
      executionId,
      userId: context.actor ?? "anonymous",
      problemId: problem.id,
      language,
      mode: context.mode,
      provider,
      status: "EXCEPTION",
      durationMs: Date.now() - started,
      memoryKb: null,
      testCount: tests.length,
    });
    throw error;
  }
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
