import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AssessmentStatus } from "@/generated/prisma/enums";
import type { AssessmentSettings } from "@/lib/campus/schemas";
import { phaseOf, attemptDeadline, type Phase } from "@/lib/campus/rules";
import { prisma } from "@/lib/db";
import {
  assertCan,
  InstitutionError,
  scopeOf,
  type MemberContext,
} from "@/lib/tenancy/context";
import { withTenantScope, type TenantTx } from "@/lib/tenancy/scope";

import { assertTeaches } from "./campus-classes";
import { finalizeOpenAttempts, gradeAttempt, recomputeScore } from "./campus-grading";
import { writeAudit } from "./institutions";

/**
 * Assessments, staff side: authoring, the publish lifecycle, submissions
 * and grading.
 *
 * Integrity rules (each also enforced in the database, migration
 * 20261028230149_campus_learning):
 *   - Publishing copies the questions into an immutable AssessmentVersion
 *     plus a separate answer key. Attempts read only that version, so later
 *     edits to bank questions never reach a live exam.
 *   - A published assessment's question list cannot change. To change it,
 *     unpublish, which is only possible while nobody has started an attempt.
 *   - After publishing only the deadline window (closesAt, lateUntil) can
 *     move, and every move is audited and re-applied to open attempts.
 *   - Publishing, closing, archiving, releasing results and every grade
 *     change write the institution audit log in the same transaction.
 */

const notFound = () => new InstitutionError("not_found", "Assessment not found.");

export type PaperQuestion = {
  key: string;
  kind: "CHOICE" | "CODING";
  type: string | null;
  category: string;
  prompt: string;
  code: string | null;
  options: { id: string; text: string }[];
  points: number;
  problem: {
    slug: string;
    title: string;
    statement: unknown;
    starterCode: Record<string, string>;
    samples: { input: string; expected: string }[];
  } | null;
};

export type AnswerKey = Record<
  string,
  {
    answer: string | string[] | null;
    explanation: string | null;
    problemSlug: string | null;
  }
>;

type Item = { questionId: string; points?: number };

function itemsOf(json: unknown): Item[] {
  return Array.isArray(json) ? (json as Item[]) : [];
}

/** Loads an assessment visible in this scope, or throws not_found. */
async function load(tx: TenantTx, ctx: MemberContext, id: string) {
  const a = await tx.assessment.findFirst({
    where: { id, institutionId: ctx.institution.id },
  });
  if (!a) throw notFound();
  return a;
}

async function loadTaught(tx: TenantTx, ctx: MemberContext, id: string) {
  const a = await load(tx, ctx, id);
  await assertTeaches(tx, a.cohortId);
  return a;
}

type CatalogueProblem = Awaited<ReturnType<typeof loadProblems>>[number];

/** The published problems behind coding questions, read as the owner. */
async function loadProblems(ids: string[]) {
  return prisma.problem.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      statement: true,
      starterCode: true,
      testCases: {
        where: { isSample: true },
        orderBy: { order: "asc" },
        select: { input: true, expected: true },
      },
    },
  });
}

/**
 * The coding problems an assessment's draft items need, fetched before the
 * tenant transaction that publishes it (the owner connection is never used
 * inside a tenant transaction). buildPaper re-checks against the rows it
 * reads, so a change in between fails rather than slipping through.
 */
async function problemsForDraft(
  ctx: MemberContext,
  id: string
): Promise<CatalogueProblem[]> {
  const ids = await withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await load(tx, ctx, id);
    const rows = await tx.bankQuestion.findMany({
      where: { id: { in: itemsOf(a.items).map((i) => i.questionId) } },
      select: { problemId: true },
    });
    return rows.map((r) => r.problemId).filter((v): v is string => !!v);
  });
  return loadProblems(ids);
}

/** Builds the student-safe paper and its key from bank questions. */
async function buildPaper(
  tx: TenantTx,
  ctx: MemberContext,
  items: Item[],
  problems: CatalogueProblem[]
): Promise<{ questions: PaperQuestion[]; key: AnswerKey; maxScore: number }> {
  const rows = await tx.bankQuestion.findMany({
    where: {
      id: { in: items.map((i) => i.questionId) },
      institutionId: ctx.institution.id,
      archivedAt: null,
    },
  });

  const questions: PaperQuestion[] = [];
  const key: AnswerKey = {};
  items.forEach((item, index) => {
    const q = rows.find((r) => r.id === item.questionId);
    if (!q) {
      throw new InstitutionError(
        "invalid",
        `Question ${index + 1} is no longer available.`
      );
    }
    const problem = q.problemId ? problems.find((p) => p.id === q.problemId) : null;
    if (q.kind === "CODING" && !problem) {
      throw new InstitutionError(
        "invalid",
        `Question ${index + 1}'s problem is unpublished.`
      );
    }
    const qKey = `q${index + 1}`;
    questions.push({
      key: qKey,
      kind: q.kind,
      type: q.type,
      category: q.category,
      prompt: q.prompt,
      code: q.code,
      options: q.options as PaperQuestion["options"],
      points: item.points ?? q.points,
      problem: problem
        ? {
            slug: problem.slug,
            title: problem.title,
            statement: problem.statement,
            starterCode: (problem.starterCode ?? {}) as Record<string, string>,
            samples: problem.testCases,
          }
        : null,
    });
    key[qKey] = {
      answer: (q.answer ?? null) as string | string[] | null,
      explanation: q.explanation,
      problemSlug: problem?.slug ?? null,
    };
  });
  return { questions, key, maxScore: questions.reduce((s, q) => s + q.points, 0) };
}

// ---------------------------------------------------------------------------
// Authoring
// ---------------------------------------------------------------------------

export async function createAssessment(
  ctx: MemberContext,
  cohortId: string,
  settings: AssessmentSettings
): Promise<{ id: string }> {
  assertCan(ctx, "classes.create");
  return withTenantScope(scopeOf(ctx), async (tx) => {
    await assertTeaches(tx, cohortId);
    const row = await tx.assessment.create({
      data: {
        institutionId: ctx.institution.id,
        cohortId,
        createdById: ctx.user.id,
        ...settings,
      },
      select: { id: true },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "assessment.create",
      targetType: "assessment",
      targetId: row.id,
      summary: `Drafted assessment "${settings.title}"`,
      metadata: { cohortId },
    });
    return row;
  });
}

/** Fields that, once published, may still move: the deadline window. */
const LIVE_EDITABLE = ["closesAt", "lateUntil"] as const;

export async function updateAssessment(
  ctx: MemberContext,
  id: string,
  settings: AssessmentSettings
): Promise<void> {
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    if (a.status === "ARCHIVED" || a.status === "CLOSED") {
      throw new InstitutionError("conflict", "A closed assessment cannot be edited.");
    }
    if (a.status === "DRAFT") {
      await tx.assessment.update({ where: { id }, data: settings });
      return;
    }

    // Published: everything but the deadline window must stay as it is.
    const same = (x: unknown, y: unknown) =>
      x instanceof Date || y instanceof Date
        ? (x as Date | null)?.getTime() === (y as Date | null)?.getTime()
        : (x ?? null) === (y ?? null);
    const locked = (Object.keys(settings) as (keyof AssessmentSettings)[]).filter(
      (k) =>
        !(LIVE_EDITABLE as readonly string[]).includes(k) && !same(settings[k], a[k])
    );
    if (locked.length > 0) {
      throw new InstitutionError(
        "conflict",
        "Only the deadline can change after publishing. Unpublish to change the rest."
      );
    }
    if (same(settings.closesAt, a.closesAt) && same(settings.lateUntil, a.lateUntil))
      return;

    await tx.assessment.update({
      where: { id },
      data: { closesAt: settings.closesAt, lateUntil: settings.lateUntil ?? null },
    });
    // Re-apply the window to attempts in progress, so the change is honest
    // for everyone mid-exam rather than only for later starters.
    const timing = {
      ...a,
      closesAt: settings.closesAt,
      lateUntil: settings.lateUntil ?? null,
    };
    const open = await tx.assessmentAttempt.findMany({
      where: { assessmentId: id, status: "IN_PROGRESS" },
      select: { id: true, startedAt: true },
    });
    for (const attempt of open) {
      await tx.assessmentAttempt.update({
        where: { id: attempt.id },
        data: { deadlineAt: attemptDeadline(timing, attempt.startedAt) },
      });
    }
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "assessment.deadline_change",
      targetType: "assessment",
      targetId: id,
      summary: `Moved the deadline of "${a.title}"`,
      metadata: {
        oldClosesAt: a.closesAt.toISOString(),
        newClosesAt: settings.closesAt.toISOString(),
        oldLateUntil: a.lateUntil?.toISOString() ?? null,
        newLateUntil: settings.lateUntil?.toISOString() ?? null,
        openAttempts: open.length,
      },
    });
  });
}

async function setItems(
  ctx: MemberContext,
  id: string,
  change: (items: Item[]) => Item[]
): Promise<void> {
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    if (a.status !== "DRAFT") {
      throw new InstitutionError("conflict", "Questions are frozen once published.");
    }
    await tx.assessment.update({
      where: { id },
      data: { items: change(itemsOf(a.items)) },
    });
  });
}

export async function addItem(
  ctx: MemberContext,
  id: string,
  item: Item
): Promise<void> {
  assertCan(ctx, "banks.manage");
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const q = await tx.bankQuestion.findFirst({
      where: {
        id: item.questionId,
        institutionId: ctx.institution.id,
        archivedAt: null,
      },
      select: { id: true },
    });
    if (!q) throw new InstitutionError("not_found", "Question not found.");
  });
  await setItems(ctx, id, (items) => {
    if (items.length >= 100)
      throw new InstitutionError("invalid", "At most 100 questions.");
    if (items.some((i) => i.questionId === item.questionId)) {
      throw new InstitutionError(
        "conflict",
        "That question is already in the assessment."
      );
    }
    return [...items, item];
  });
}

export async function removeItem(
  ctx: MemberContext,
  id: string,
  index: number
): Promise<void> {
  await setItems(ctx, id, (items) => items.filter((_, i) => i !== index));
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export type StaffAssessment = {
  id: string;
  cohortId: string;
  title: string;
  instructions: string;
  status: AssessmentStatus;
  phase: Phase;
  settings: AssessmentSettings;
  resultsReleasedAt: Date | null;
  publishedAt: Date | null;
  items: {
    index: number;
    questionId: string;
    points: number;
    kind: string;
    category: string;
    prompt: string;
  }[];
  attemptCount: number;
};

export async function getStaffAssessment(
  ctx: MemberContext,
  id: string
): Promise<StaffAssessment> {
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    const items = itemsOf(a.items);
    const questions = await tx.bankQuestion.findMany({
      where: { id: { in: items.map((i) => i.questionId) } },
      select: { id: true, kind: true, category: true, prompt: true, points: true },
    });
    const attemptCount = await tx.assessmentAttempt.count({
      where: { assessmentId: id },
    });
    return {
      id: a.id,
      cohortId: a.cohortId,
      title: a.title,
      instructions: a.instructions,
      status: a.status,
      phase: phaseOf(a, new Date()),
      resultsReleasedAt: a.resultsReleasedAt,
      publishedAt: a.publishedAt,
      settings: {
        title: a.title,
        instructions: a.instructions,
        opensAt: a.opensAt,
        closesAt: a.closesAt,
        lateUntil: a.lateUntil,
        latePenaltyPercent: a.latePenaltyPercent,
        durationMinutes: a.durationMinutes,
        maxAttempts: a.maxAttempts,
        scorePolicy: a.scorePolicy,
        showScoreOnSubmit: a.showScoreOnSubmit,
      },
      items: items.map((item, index) => {
        const q = questions.find((x) => x.id === item.questionId);
        return {
          index,
          questionId: item.questionId,
          points: item.points ?? q?.points ?? 0,
          kind: q?.kind ?? "MISSING",
          category: q?.category ?? "",
          prompt: q?.prompt ?? "(removed from its bank)",
        };
      }),
      attemptCount,
    };
  });
}

/** The paper exactly as a student would get it, with the key beside it. */
export async function previewAssessment(ctx: MemberContext, id: string) {
  const problems = await problemsForDraft(ctx, id);
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    if (a.currentVersionId && a.status !== "DRAFT") {
      const version = await tx.assessmentVersion.findUnique({
        where: { id: a.currentVersionId },
        select: {
          questions: true,
          maxScore: true,
          answerKey: { select: { key: true } },
        },
      });
      if (version) {
        return {
          questions: version.questions as PaperQuestion[],
          key: (version.answerKey?.key ?? {}) as AnswerKey,
          maxScore: version.maxScore,
          frozen: true,
        };
      }
    }
    return {
      ...(await buildPaper(tx, ctx, itemsOf(a.items), problems)),
      frozen: false,
    };
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export async function publishAssessment(ctx: MemberContext, id: string): Promise<void> {
  assertCan(ctx, "banks.manage");
  const problems = await problemsForDraft(ctx, id);
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    if (a.status !== "DRAFT")
      throw new InstitutionError("conflict", "Already published.");
    const items = itemsOf(a.items);
    if (items.length === 0)
      throw new InstitutionError("invalid", "Add at least one question.");
    if (a.closesAt <= new Date()) {
      throw new InstitutionError("invalid", "The deadline has already passed.");
    }

    const paper = await buildPaper(tx, ctx, items, problems);
    const previous = await tx.assessmentVersion.count({ where: { assessmentId: id } });
    const version = await tx.assessmentVersion.create({
      data: {
        institutionId: ctx.institution.id,
        cohortId: a.cohortId,
        assessmentId: id,
        version: previous + 1,
        questions: paper.questions as unknown as Prisma.InputJsonArray,
        maxScore: paper.maxScore,
        publishedById: ctx.user.id,
        answerKey: {
          create: {
            institutionId: ctx.institution.id,
            cohortId: a.cohortId,
            key: paper.key,
          },
        },
      },
      select: { id: true, version: true },
    });
    await tx.assessment.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        currentVersionId: version.id,
        publishedAt: new Date(),
      },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "assessment.publish",
      targetType: "assessment",
      targetId: id,
      summary: `Published "${a.title}" (version ${version.version})`,
      metadata: {
        version: version.version,
        questions: paper.questions.length,
        maxScore: paper.maxScore,
        opensAt: a.opensAt?.toISOString() ?? null,
        closesAt: a.closesAt.toISOString(),
      },
    });
  });
}

/** Back to draft, only while nobody has started: no attempt is orphaned. */
export async function unpublishAssessment(
  ctx: MemberContext,
  id: string
): Promise<void> {
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    if (a.status !== "PUBLISHED")
      throw new InstitutionError("conflict", "Not published.");
    // Lock the row so a concurrent start either lands first (and blocks
    // this) or waits and then fails the attempt policy on DRAFT.
    await tx.$queryRaw`SELECT id FROM assessments WHERE id = ${id} FOR UPDATE`;
    if ((await tx.assessmentAttempt.count({ where: { assessmentId: id } })) > 0) {
      throw new InstitutionError(
        "conflict",
        "Students have started; it can only be closed now."
      );
    }
    await tx.assessment.update({ where: { id }, data: { status: "DRAFT" } });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "assessment.unpublish",
      targetType: "assessment",
      targetId: id,
      summary: `Unpublished "${a.title}" before any attempt`,
    });
  });
}

export async function closeAssessment(ctx: MemberContext, id: string): Promise<void> {
  const finalized = await withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    if (a.status !== "PUBLISHED") throw new InstitutionError("conflict", "Not open.");
    await tx.$queryRaw`SELECT id FROM assessments WHERE id = ${id} FOR UPDATE`;
    await tx.assessment.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    const ids = await finalizeOpenAttempts(
      tx,
      a,
      { assessmentId: id },
      "CLOSED_BY_STAFF"
    );
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "assessment.close",
      targetType: "assessment",
      targetId: id,
      summary: `Closed "${a.title}"`,
      metadata: { finalizedAttempts: ids.length },
    });
    return ids;
  });
  for (const attemptId of finalized) await gradeAttempt(attemptId);
}

export async function archiveAssessment(
  ctx: MemberContext,
  id: string
): Promise<string> {
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    if (a.status === "PUBLISHED") {
      throw new InstitutionError("conflict", "Close it before archiving.");
    }
    if (a.status === "ARCHIVED") return a.cohortId;
    await tx.assessment.update({ where: { id }, data: { status: "ARCHIVED" } });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "assessment.archive",
      targetType: "assessment",
      targetId: id,
      summary: `Archived "${a.title}"`,
    });
    return a.cohortId;
  });
}

/** Answers and feedback become visible to students; only after closing. */
export async function releaseResults(ctx: MemberContext, id: string): Promise<void> {
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    if (phaseOf(a, new Date()) !== "closed") {
      throw new InstitutionError(
        "conflict",
        "Results can be released once it has closed."
      );
    }
    if (a.resultsReleasedAt) return;
    await tx.assessment.update({
      where: { id },
      data: { resultsReleasedAt: new Date() },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "assessment.release_results",
      targetType: "assessment",
      targetId: id,
      summary: `Released results of "${a.title}"`,
    });
  });
}

// ---------------------------------------------------------------------------
// Submissions and grading
// ---------------------------------------------------------------------------

export type SubmissionRow = {
  attemptId: string;
  number: number;
  student: { id: string; name: string | null; email: string };
  status: "IN_PROGRESS" | "SUBMITTED";
  startedAt: Date;
  submittedAt: Date | null;
  finish: string | null;
  late: boolean;
  score: number | null;
  maxScore: number;
  needsGrading: boolean;
};

export async function listSubmissions(
  ctx: MemberContext,
  id: string
): Promise<SubmissionRow[]> {
  const { rows, finalized } = await withTenantScope(scopeOf(ctx), async (tx) => {
    const a = await loadTaught(tx, ctx, id);
    // Attempts whose time ran out while nobody was looking close now.
    const finalized = await finalizeOpenAttempts(
      tx,
      a,
      { assessmentId: id, deadlineAt: { lte: new Date() } },
      "TIME_EXPIRED"
    );
    const rows = await tx.assessmentAttempt.findMany({
      where: { assessmentId: id },
      orderBy: [{ userId: "asc" }, { number: "asc" }],
      select: {
        id: true,
        number: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        finish: true,
        late: true,
        score: true,
        maxScore: true,
        needsGrading: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return { rows, finalized };
  });
  for (const attemptId of finalized) await gradeAttempt(attemptId);
  return rows.map(({ id: attemptId, user, ...r }) => ({
    attemptId,
    student: user,
    ...r,
    // Grading above ran after this read; mark those as pending rather than wrong.
    status: finalized.includes(attemptId) ? "SUBMITTED" : r.status,
  }));
}

export async function gradeAnswer(
  ctx: MemberContext,
  attemptId: string,
  questionKey: string,
  grade: { points: number; feedback: string | null }
): Promise<string> {
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const [locked] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM assessment_attempts WHERE id = ${attemptId} FOR UPDATE`;
    const attempt = locked
      ? await tx.assessmentAttempt.findFirst({
          where: { id: attemptId, institutionId: ctx.institution.id },
          select: {
            id: true,
            cohortId: true,
            assessmentId: true,
            status: true,
            score: true,
            userId: true,
            version: { select: { questions: true } },
          },
        })
      : null;
    if (!attempt) throw new InstitutionError("not_found", "Attempt not found.");
    await assertTeaches(tx, attempt.cohortId);
    if (attempt.status !== "SUBMITTED") {
      throw new InstitutionError("conflict", "The attempt is still in progress.");
    }
    const question = (attempt.version.questions as PaperQuestion[]).find(
      (q) => q.key === questionKey
    );
    if (!question) throw new InstitutionError("not_found", "Question not found.");
    if (grade.points > question.points) {
      throw new InstitutionError("invalid", `At most ${question.points} points.`);
    }
    const answer = await tx.attemptAnswer.findUnique({
      where: { attemptId_questionKey: { attemptId, questionKey } },
      select: { id: true, points: true, autoPoints: true, feedback: true },
    });
    if (!answer) throw new InstitutionError("not_found", "No answer to grade.");

    await tx.attemptAnswer.update({
      where: { id: answer.id },
      data: {
        points: grade.points,
        feedback: grade.feedback,
        gradedById: ctx.user.id,
        gradedAt: new Date(),
      },
    });
    const score = await recomputeScore(tx, attemptId);
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "grade.change",
      targetType: "assessment_attempt",
      targetId: attemptId,
      summary: `Graded ${questionKey}: ${answer.points ?? answer.autoPoints ?? "ungraded"} -> ${grade.points}`,
      metadata: {
        assessmentId: attempt.assessmentId,
        studentId: attempt.userId,
        questionKey,
        oldPoints: answer.points ?? answer.autoPoints ?? null,
        newPoints: grade.points,
        oldScore: attempt.score,
        newScore: score,
        feedbackChanged: (answer.feedback ?? null) !== grade.feedback,
      },
    });
    return attempt.assessmentId;
  });
}
