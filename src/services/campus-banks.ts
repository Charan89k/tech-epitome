import "server-only";

import type { z } from "zod";

import type { BankQuestionInput, bankSchema } from "@/lib/campus/schemas";
import { prisma } from "@/lib/db";
import {
  assertCan,
  InstitutionError,
  scopeOf,
  type MemberContext,
} from "@/lib/tenancy/context";
import { withTenantScope, type TenantTx } from "@/lib/tenancy/scope";

import { writeAudit } from "./institutions";

/**
 * Question banks: reusable MCQ, aptitude and coding questions shared by an
 * institution's staff. They hold answers, so students cannot read them at
 * all (RLS: staff only). Any staff member may use a bank's questions in an
 * assessment; only the bank's creator or an institution admin may change
 * it. Editing a question never changes a published exam: publishing copies
 * the questions into a frozen version.
 */

const notFound = () => new InstitutionError("not_found", "Question bank not found.");

function canEdit(ctx: MemberContext, createdById: string): boolean {
  return (
    ctx.platformAdmin || ctx.role === "INSTITUTION_ADMIN" || createdById === ctx.user.id
  );
}

async function editableBank(tx: TenantTx, ctx: MemberContext, bankId: string) {
  const bank = await tx.questionBank.findFirst({
    where: { id: bankId, institutionId: ctx.institution.id, archivedAt: null },
    select: { id: true, name: true, createdById: true },
  });
  if (!bank) throw notFound();
  if (!canEdit(ctx, bank.createdById)) {
    throw new InstitutionError(
      "forbidden",
      "Only the bank's owner or an admin can edit it."
    );
  }
  return bank;
}

export async function listBanks(ctx: MemberContext) {
  assertCan(ctx, "banks.manage");
  return withTenantScope(scopeOf(ctx), (tx) =>
    tx.questionBank.findMany({
      where: { institutionId: ctx.institution.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        createdById: true,
        _count: { select: { questions: { where: { archivedAt: null } } } },
      },
    })
  );
}

export async function createBank(
  ctx: MemberContext,
  input: z.output<typeof bankSchema>
): Promise<{ id: string }> {
  assertCan(ctx, "banks.manage");
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const bank = await tx.questionBank.create({
      data: { institutionId: ctx.institution.id, createdById: ctx.user.id, ...input },
      select: { id: true },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "bank.create",
      targetType: "question_bank",
      targetId: bank.id,
      summary: `Created question bank "${input.name}"`,
    });
    return bank;
  });
}

export type BankQuestionRow = {
  id: string;
  kind: "CHOICE" | "CODING";
  type: string | null;
  category: string;
  prompt: string;
  code: string | null;
  options: { id: string; text: string }[];
  answer: string | string[] | null;
  explanation: string | null;
  points: number;
  problem: { slug: string; title: string } | null;
};

export async function getBank(ctx: MemberContext, bankId: string) {
  assertCan(ctx, "banks.manage");
  const bank = await withTenantScope(scopeOf(ctx), async (tx) => {
    const row = await tx.questionBank.findFirst({
      where: { id: bankId, institutionId: ctx.institution.id, archivedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        createdById: true,
        questions: {
          where: { archivedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            kind: true,
            type: true,
            category: true,
            prompt: true,
            code: true,
            options: true,
            answer: true,
            explanation: true,
            points: true,
            problemId: true,
          },
        },
      },
    });
    if (!row) throw notFound();
    return row;
  });
  // Catalogue titles as the owner, after the tenant transaction.
  const problems = await prisma.problem.findMany({
    where: {
      id: {
        in: bank.questions.map((q) => q.problemId).filter((v): v is string => !!v),
      },
    },
    select: { id: true, slug: true, title: true },
  });
  return {
    id: bank.id,
    name: bank.name,
    description: bank.description,
    editable: canEdit(ctx, bank.createdById),
    questions: bank.questions.map(({ problemId, ...q }): BankQuestionRow => ({
      ...q,
      options: q.options as BankQuestionRow["options"],
      answer: q.answer as BankQuestionRow["answer"],
      problem: problems.find((p) => p.id === problemId) ?? null,
    })),
  };
}

/** A coding question must point at a published problem with tests. */
async function resolveProblem(slug: string): Promise<string> {
  const problem = await prisma.problem.findFirst({
    where: { slug, status: "PUBLISHED", testCases: { some: {} } },
    select: { id: true },
  });
  if (!problem) {
    throw new InstitutionError("invalid", "No published problem with that slug.");
  }
  return problem.id;
}

function questionData(input: BankQuestionInput, problemId: string | null) {
  return {
    kind: input.kind,
    type: input.type,
    category: input.category,
    prompt: input.prompt,
    code: input.code,
    options: input.options,
    answer: input.answer ?? undefined,
    explanation: input.explanation,
    problemId,
    points: input.points,
  };
}

export async function addQuestion(
  ctx: MemberContext,
  bankId: string,
  input: BankQuestionInput
): Promise<void> {
  assertCan(ctx, "banks.manage");
  const problemId = input.problemSlug ? await resolveProblem(input.problemSlug) : null;
  await withTenantScope(scopeOf(ctx), async (tx) => {
    await editableBank(tx, ctx, bankId);
    await tx.bankQuestion.create({
      data: {
        institutionId: ctx.institution.id,
        bankId,
        createdById: ctx.user.id,
        ...questionData(input, problemId),
      },
    });
  });
}

export async function updateQuestion(
  ctx: MemberContext,
  questionId: string,
  input: BankQuestionInput
): Promise<string> {
  assertCan(ctx, "banks.manage");
  const problemId = input.problemSlug ? await resolveProblem(input.problemSlug) : null;
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const q = await tx.bankQuestion.findFirst({
      where: { id: questionId, institutionId: ctx.institution.id, archivedAt: null },
      select: { bankId: true },
    });
    if (!q) throw new InstitutionError("not_found", "Question not found.");
    await editableBank(tx, ctx, q.bankId);
    await tx.bankQuestion.update({
      where: { id: questionId },
      data: { ...questionData(input, problemId), answer: input.answer ?? undefined },
    });
    return q.bankId;
  });
}

export async function archiveQuestion(
  ctx: MemberContext,
  questionId: string
): Promise<string> {
  assertCan(ctx, "banks.manage");
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const q = await tx.bankQuestion.findFirst({
      where: { id: questionId, institutionId: ctx.institution.id, archivedAt: null },
      select: { bankId: true },
    });
    if (!q) throw new InstitutionError("not_found", "Question not found.");
    await editableBank(tx, ctx, q.bankId);
    await tx.bankQuestion.update({
      where: { id: questionId },
      data: { archivedAt: new Date() },
    });
    return q.bankId;
  });
}

/** Every usable question across the institution's banks, for the picker. */
export async function listPickableQuestions(ctx: MemberContext) {
  assertCan(ctx, "banks.manage");
  return withTenantScope(scopeOf(ctx), (tx) =>
    tx.bankQuestion.findMany({
      where: {
        institutionId: ctx.institution.id,
        archivedAt: null,
        bank: { archivedAt: null },
      },
      orderBy: [{ bankId: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        kind: true,
        category: true,
        prompt: true,
        points: true,
        bank: { select: { name: true } },
      },
    })
  );
}
