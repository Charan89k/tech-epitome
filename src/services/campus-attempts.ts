import "server-only";

import { randomUUID } from "node:crypto";

import { choiceValueSchema, codingValueSchema } from "@/lib/campus/schemas";
import {
  attemptDeadline,
  countedAttempt,
  phaseOf,
  type Phase,
} from "@/lib/campus/rules";
import { prisma } from "@/lib/db";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { InstitutionError, scopeOf, type MemberContext } from "@/lib/tenancy/context";
import { withTenantScope, type TenantTx } from "@/lib/tenancy/scope";

import type { AnswerKey, PaperQuestion } from "./campus-assessments";
import { finalizeOpenAttempts, gradeAttempt } from "./campus-grading";

/**
 * Assessments, student side: start, autosave, submit, review.
 *
 * Time is the server's. The client gets `deadlineAt` and `serverNow` to
 * draw a countdown, but every decision (may this attempt start, may this
 * answer be saved, is this attempt over) is taken here and again by the
 * database policies with its own now(). A student who disconnects loses
 * nothing already saved; their attempt closes at its deadline with those
 * answers, the next time anyone reads it.
 */

const notFound = () => new InstitutionError("not_found", "Assessment not found.");

async function limit(userId: string, kind: "save" | "attempt"): Promise<void> {
  const policy =
    kind === "save" ? RATE_LIMITS.CAMPUS_ANSWER_SAVE : RATE_LIMITS.CAMPUS_ATTEMPT;
  const result = await rateLimit(`campus-${kind}:${userId}`, policy);
  if (!result.success)
    throw new InstitutionError("conflict", "Too many requests. Slow down.");
}

/** Visible to this student (RLS: published and in one of their classes). */
async function loadForStudent(tx: TenantTx, ctx: MemberContext, id: string) {
  const a = await tx.assessment.findFirst({
    where: { id, institutionId: ctx.institution.id, status: { not: "DRAFT" } },
  });
  if (!a) throw notFound();
  const enrolled = await tx.cohortMember.findFirst({
    where: {
      cohortId: a.cohortId,
      userId: ctx.user.id,
      role: "STUDENT",
      removedAt: null,
    },
    select: { id: true },
  });
  if (!enrolled) throw notFound();
  return a;
}

async function closeExpired(
  tx: TenantTx,
  ctx: MemberContext,
  assessment: {
    id: string;
    closesAt: Date;
    lateUntil: Date | null;
  }
): Promise<string[]> {
  return finalizeOpenAttempts(
    tx,
    assessment,
    {
      assessmentId: assessment.id,
      userId: ctx.user.id,
      deadlineAt: { lte: new Date() },
    },
    "TIME_EXPIRED"
  );
}

export type StudentAttemptRow = {
  id: string;
  number: number;
  status: "IN_PROGRESS" | "SUBMITTED";
  startedAt: Date;
  deadlineAt: Date;
  submittedAt: Date | null;
  finish: string | null;
  late: boolean;
  /** Null when not shown yet (policy) or not graded yet. */
  score: number | null;
  pendingGrading: boolean;
};

export type StudentAssessment = {
  id: string;
  cohortId: string;
  title: string;
  instructions: string;
  phase: Phase;
  opensAt: Date | null;
  closesAt: Date;
  lateUntil: Date | null;
  latePenaltyPercent: number;
  durationMinutes: number | null;
  maxAttempts: number;
  scorePolicy: "BEST" | "LATEST";
  maxScore: number | null;
  resultsReleased: boolean;
  attempts: StudentAttemptRow[];
  openAttemptId: string | null;
  canStart: boolean;
  /** The score that counts, when visible. */
  finalScore: number | null;
};

export async function getStudentAssessment(
  ctx: MemberContext,
  id: string
): Promise<StudentAssessment> {
  const { a, attempts, maxScore, finalized } = await withTenantScope(
    scopeOf(ctx),
    async (tx) => {
      const a = await loadForStudent(tx, ctx, id);
      const finalized = await closeExpired(tx, ctx, a);
      const attempts = await tx.assessmentAttempt.findMany({
        where: { assessmentId: id, userId: ctx.user.id },
        orderBy: { number: "asc" },
      });
      const maxScore = attempts[0]?.maxScore ?? null;
      return { a, attempts, maxScore, finalized };
    }
  );
  for (const attemptId of finalized) await gradeAttempt(attemptId);
  const fresh = finalized.length
    ? await withTenantScope(scopeOf(ctx), (tx) =>
        tx.assessmentAttempt.findMany({
          where: { assessmentId: id, userId: ctx.user.id },
          orderBy: { number: "asc" },
        })
      )
    : attempts;

  const phase = phaseOf(a, new Date());
  const visible = Boolean(a.resultsReleasedAt) || a.showScoreOnSubmit;
  const rows: StudentAttemptRow[] = fresh.map((t) => ({
    id: t.id,
    number: t.number,
    status: t.status,
    startedAt: t.startedAt,
    deadlineAt: t.deadlineAt,
    submittedAt: t.submittedAt,
    finish: t.finish,
    late: t.late,
    score: visible && t.status === "SUBMITTED" ? t.score : null,
    pendingGrading: t.needsGrading,
  }));
  const open = rows.find((r) => r.status === "IN_PROGRESS") ?? null;
  const counted = visible
    ? countedAttempt(
        fresh.filter((t) => t.status === "SUBMITTED"),
        a.scorePolicy
      )
    : null;

  return {
    id: a.id,
    cohortId: a.cohortId,
    title: a.title,
    instructions: a.instructions,
    phase,
    opensAt: a.opensAt,
    closesAt: a.closesAt,
    lateUntil: a.lateUntil,
    latePenaltyPercent: a.latePenaltyPercent,
    durationMinutes: a.durationMinutes,
    maxAttempts: a.maxAttempts,
    scorePolicy: a.scorePolicy,
    maxScore,
    resultsReleased: Boolean(a.resultsReleasedAt),
    attempts: rows,
    openAttemptId: open?.id ?? null,
    canStart:
      !open && (phase === "open" || phase === "late") && rows.length < a.maxAttempts,
    finalScore: counted?.score ?? null,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Starts (or resumes) an attempt. Idempotent: a second click, a retry or a
 * second tab gets the attempt already open. The attempt limit holds under
 * concurrent starts because (assessment, user, number) is unique and only
 * one IN_PROGRESS attempt per student can exist.
 */
export async function startAttempt(ctx: MemberContext, id: string): Promise<string> {
  await limit(ctx.user.id, "attempt");
  try {
    return await withTenantScope(scopeOf(ctx), async (tx) => {
      const a = await loadForStudent(tx, ctx, id);
      await closeExpired(tx, ctx, a);
      const mine = await tx.assessmentAttempt.findMany({
        where: { assessmentId: id, userId: ctx.user.id },
        select: { id: true, status: true },
      });
      const open = mine.find((t) => t.status === "IN_PROGRESS");
      if (open) return open.id;

      const now = new Date();
      const phase = phaseOf(a, now);
      if (phase !== "open" && phase !== "late") {
        throw new InstitutionError("conflict", "This assessment is not open.");
      }
      if (mine.length >= a.maxAttempts || !a.currentVersionId) {
        throw new InstitutionError("conflict", "No attempts left.");
      }
      // maxScore is filled in by grading (owner): the student cannot read
      // the version until this attempt exists (RLS).
      const created = await tx.assessmentAttempt.create({
        data: {
          institutionId: ctx.institution.id,
          cohortId: a.cohortId,
          assessmentId: id,
          versionId: a.currentVersionId,
          userId: ctx.user.id,
          number: mine.length + 1,
          startedAt: now,
          deadlineAt: attemptDeadline(a, now),
          maxScore: 0,
        },
        select: { id: true },
      });
      return created.id;
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // A concurrent start won the race; hand back its attempt.
    const open = await withTenantScope(scopeOf(ctx), (tx) =>
      tx.assessmentAttempt.findFirst({
        where: { assessmentId: id, userId: ctx.user.id, status: "IN_PROGRESS" },
        select: { id: true },
      })
    );
    if (open) return open.id;
    throw new InstitutionError("conflict", "No attempts left.");
  }
}

export type AttemptPaper = {
  attemptId: string;
  assessmentId: string;
  title: string;
  instructions: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  deadlineAt: Date;
  closesAt: Date;
  serverNow: Date;
  questions: PaperQuestion[];
  answers: Record<string, { value: unknown; seq: number }>;
};

/** The student's own open attempt: questions (no answers) and saved work. */
export async function getAttemptPaper(
  ctx: MemberContext,
  attemptId: string
): Promise<AttemptPaper> {
  const result = await withTenantScope(scopeOf(ctx), async (tx) => {
    const attempt = await tx.assessmentAttempt.findFirst({
      where: { id: attemptId, userId: ctx.user.id, institutionId: ctx.institution.id },
      select: {
        id: true,
        assessmentId: true,
        status: true,
        deadlineAt: true,
        assessment: {
          select: {
            id: true,
            title: true,
            instructions: true,
            closesAt: true,
            lateUntil: true,
          },
        },
        version: { select: { questions: true } },
        answers: { select: { questionKey: true, value: true, seq: true } },
      },
    });
    if (!attempt) throw new InstitutionError("not_found", "Attempt not found.");
    const finalized = await closeExpired(tx, ctx, attempt.assessment);
    return { attempt, finalized };
  });
  for (const id of result.finalized) await gradeAttempt(id);
  const { attempt } = result;
  return {
    attemptId: attempt.id,
    assessmentId: attempt.assessmentId,
    title: attempt.assessment.title,
    instructions: attempt.assessment.instructions,
    status: result.finalized.includes(attempt.id) ? "SUBMITTED" : attempt.status,
    deadlineAt: attempt.deadlineAt,
    closesAt: attempt.assessment.closesAt,
    serverNow: new Date(),
    questions: attempt.version.questions as PaperQuestion[],
    answers: Object.fromEntries(
      attempt.answers.map((a) => [a.questionKey, { value: a.value, seq: a.seq }])
    ),
  };
}

/** Checks a value against the question it answers. */
function validValue(question: PaperQuestion, value: unknown): boolean {
  if (question.kind === "CODING") return codingValueSchema.safeParse(value).success;
  const parsed = choiceValueSchema.safeParse(value);
  if (!parsed.success) return false;
  const ids = new Set(question.options.map((o) => o.id));
  const multi = question.type === "MULTI_SELECT";
  if (multi !== Array.isArray(parsed.data)) return false;
  const chosen = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  return chosen.every((c) => ids.has(c)) && new Set(chosen).size === chosen.length;
}

export type SaveResult =
  | { status: "saved"; seq: number }
  | { status: "stale"; seq: number }
  | { status: "closed" };

/**
 * Autosave. Idempotent and order-safe: each save carries the client's
 * sequence number, and the stored answer only moves forward, so a retried
 * or reordered request can never overwrite newer work.
 */
export async function saveAnswer(
  ctx: MemberContext,
  input: { attemptId: string; questionKey: string; value: unknown; seq: number }
): Promise<SaveResult> {
  await limit(ctx.user.id, "save");
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const attempt = await tx.assessmentAttempt.findFirst({
      where: {
        id: input.attemptId,
        userId: ctx.user.id,
        institutionId: ctx.institution.id,
      },
      select: {
        id: true,
        status: true,
        deadlineAt: true,
        version: { select: { questions: true } },
      },
    });
    if (!attempt) throw new InstitutionError("not_found", "Attempt not found.");
    if (attempt.status !== "IN_PROGRESS" || attempt.deadlineAt <= new Date()) {
      return { status: "closed" as const };
    }
    const question = (attempt.version.questions as PaperQuestion[]).find(
      (q) => q.key === input.questionKey
    );
    if (!question || !validValue(question, input.value)) {
      throw new InstitutionError("invalid", "That answer does not fit the question.");
    }

    const written = await tx.$executeRaw`
      INSERT INTO attempt_answers
        (id, "institutionId", "attemptId", "questionKey", value, seq, "savedAt")
      VALUES (${randomUUID()}, ${ctx.institution.id}, ${attempt.id}, ${input.questionKey},
              ${JSON.stringify(input.value)}::jsonb, ${input.seq}, now())
      ON CONFLICT ("attemptId", "questionKey") DO UPDATE
        SET value = EXCLUDED.value, seq = EXCLUDED.seq, "savedAt" = now()
        WHERE attempt_answers.seq < EXCLUDED.seq
    `;
    if (written === 1) return { status: "saved" as const, seq: input.seq };
    const stored = await tx.attemptAnswer.findUnique({
      where: {
        attemptId_questionKey: {
          attemptId: attempt.id,
          questionKey: input.questionKey,
        },
      },
      select: { seq: true },
    });
    return { status: "stale" as const, seq: stored?.seq ?? input.seq };
  });
}

/** Final. Submitting twice, or after time ran out, returns the same result. */
export async function submitAttempt(
  ctx: MemberContext,
  attemptId: string
): Promise<{ assessmentId: string }> {
  await limit(ctx.user.id, "attempt");
  const { assessmentId } = await withTenantScope(scopeOf(ctx), async (tx) => {
    const [locked] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM assessment_attempts
      WHERE id = ${attemptId} AND "userId" = ${ctx.user.id} FOR UPDATE`;
    if (!locked) throw new InstitutionError("not_found", "Attempt not found.");
    const attempt = await tx.assessmentAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: {
        assessmentId: true,
        assessment: { select: { closesAt: true, lateUntil: true } },
      },
    });
    await finalizeOpenAttempts(tx, attempt.assessment, { id: attemptId }, "SUBMITTED");
    return attempt;
  });
  await gradeAttempt(attemptId);
  return { assessmentId };
}

export type AttemptReview = {
  attemptId: string;
  assessmentId: string;
  title: string;
  student: { name: string | null; email: string } | null;
  number: number;
  status: "IN_PROGRESS" | "SUBMITTED";
  submittedAt: Date | null;
  finish: string | null;
  late: boolean;
  score: number | null;
  maxScore: number;
  needsGrading: boolean;
  /** Answers and feedback: staff always; the student once results are released. */
  showKey: boolean;
  questions: (PaperQuestion & {
    value: unknown;
    autoPoints: number | null;
    autoResult: unknown;
    /** Staff override, if any. */
    awarded: number | null;
    feedback: string | null;
    answer: string | string[] | null;
    explanation: string | null;
  })[];
};

/**
 * One attempt in full. RLS makes it visible to its student and to the
 * class's teachers only; anyone else gets "not found". The key is read as
 * the owner and only attached when the caller teaches the class or the
 * results have been released.
 */
export async function getAttemptReview(
  ctx: MemberContext,
  attemptId: string
): Promise<AttemptReview> {
  const loaded = await withTenantScope(scopeOf(ctx), async (tx) => {
    const attempt = await tx.assessmentAttempt.findFirst({
      where: { id: attemptId, institutionId: ctx.institution.id },
      select: {
        id: true,
        cohortId: true,
        assessmentId: true,
        versionId: true,
        userId: true,
        number: true,
        status: true,
        submittedAt: true,
        finish: true,
        late: true,
        score: true,
        maxScore: true,
        needsGrading: true,
        assessment: {
          select: { title: true, resultsReleasedAt: true, showScoreOnSubmit: true },
        },
        version: { select: { questions: true } },
        answers: {
          select: {
            questionKey: true,
            value: true,
            autoPoints: true,
            autoResult: true,
            points: true,
            feedback: true,
          },
        },
        user: { select: { name: true, email: true } },
      },
    });
    if (!attempt) throw new InstitutionError("not_found", "Attempt not found.");
    const [row] = await tx.$queryRaw<
      { ok: boolean }[]
    >`SELECT te_teaches(${attempt.cohortId}) AS ok`;
    return { attempt, teacher: row?.ok === true };
  });
  const { attempt, teacher } = loaded;
  const own = attempt.userId === ctx.user.id;
  if (!teacher && !own) throw new InstitutionError("not_found", "Attempt not found.");

  const released = Boolean(attempt.assessment.resultsReleasedAt);
  const showKey = teacher || (released && attempt.status === "SUBMITTED");
  const showScore = teacher || released || attempt.assessment.showScoreOnSubmit;
  const key: AnswerKey = showKey
    ? (((
        await prisma.assessmentAnswerKey.findUnique({
          where: { versionId: attempt.versionId },
          select: { key: true },
        })
      )?.key ?? {}) as AnswerKey)
    : {};

  return {
    attemptId: attempt.id,
    assessmentId: attempt.assessmentId,
    title: attempt.assessment.title,
    student: teacher ? attempt.user : null,
    number: attempt.number,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    finish: attempt.finish,
    late: attempt.late,
    score: showScore ? attempt.score : null,
    maxScore: attempt.maxScore,
    needsGrading: attempt.needsGrading,
    showKey,
    questions: (attempt.version.questions as PaperQuestion[]).map((q) => {
      const a = attempt.answers.find((x) => x.questionKey === q.key);
      return {
        ...q,
        value: a?.value ?? null,
        autoPoints: showKey ? (a?.autoPoints ?? null) : null,
        autoResult: showKey ? (a?.autoResult ?? null) : null,
        awarded: showKey ? (a?.points ?? null) : null,
        feedback: showKey ? (a?.feedback ?? null) : null,
        answer: key[q.key]?.answer ?? null,
        explanation: key[q.key]?.explanation ?? null,
      };
    }),
  };
}
