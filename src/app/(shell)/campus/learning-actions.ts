"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { codeForMessage } from "@/lib/campus/messages";
import {
  assessmentSettingsSchema,
  assignmentSchema,
  bankQuestionSchema,
  bankSchema,
  classMemberSchema,
  classSchema,
  gradeSchema,
  itemSchema,
  saveAnswerSchema,
} from "@/lib/campus/schemas";
import {
  InstitutionError,
  requireMemberOrThrow,
  type MemberContext,
} from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import {
  addItem,
  archiveAssessment,
  closeAssessment,
  createAssessment,
  gradeAnswer,
  publishAssessment,
  releaseResults,
  removeItem,
  unpublishAssessment,
  updateAssessment,
} from "@/services/campus-assessments";
import {
  saveAnswer,
  startAttempt,
  submitAttempt,
  type SaveResult,
} from "@/services/campus-attempts";
import { addQuestion, archiveQuestion, createBank } from "@/services/campus-banks";
import {
  addClassMember,
  archiveAssignment,
  archiveClass,
  assignContent,
  createClass,
  removeClassMember,
} from "@/services/campus-classes";
import { autoGradeCoding } from "@/services/campus-grading";

/**
 * Campus learning mutations: classes, assignments, question banks,
 * assessments, attempts and grading.
 *
 * Same contract as ./actions.ts: each starts from the session
 * (requireMemberOrThrow), validates every input with zod, and leaves the
 * permission decision to the service, which checks again inside a tenant
 * transaction. Outcomes travel as a code in the URL, never as free text.
 */

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);
const idSchema = z.string().min(1).max(64);

const invalid = () => new InstitutionError("invalid", "invalid");

function codeFor(error: unknown): string {
  if (error instanceof InstitutionError)
    return codeForMessage(error.message) ?? error.code;
  throw error;
}

function back(path: string, msg: string): never {
  redirect(route(`${path}?msg=${encodeURIComponent(msg)}`));
}

/** Non-empty string fields only, so optional inputs arrive as undefined. */
function fields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && value !== "") out[key] = value;
  }
  return out;
}

/**
 * Resolves the member, runs `work`, and redirects with an outcome code:
 * to the path `work` returns, or to `fallback` on failure.
 */
async function act(
  slug: string,
  fallback: (safeSlug: string) => string,
  work: (ctx: MemberContext) => Promise<string | void>,
  success = "saved"
): Promise<never> {
  const safeSlug = slugSchema.parse(slug);
  const ctx = await requireMemberOrThrow(safeSlug);
  let target = fallback(safeSlug);
  try {
    const next = await work(ctx);
    if (next) target = next;
  } catch (error) {
    back(target, codeFor(error));
  }
  revalidatePath(target);
  back(target, success);
}

const classPath = (slug: string, id: string) => `/campus/${slug}/classes/${id}`;
const examPath = (slug: string, id: string) => `/campus/${slug}/assessments/${id}`;

// ---------------------------------------------------------------------------
// Classes and assignments
// ---------------------------------------------------------------------------

export async function createClassAction(slug: string, form: FormData) {
  return act(
    slug,
    (s) => `/campus/${s}`,
    async (ctx) => {
      const parsed = classSchema.safeParse(fields(form));
      if (!parsed.success) throw invalid();
      const { id } = await createClass(ctx, parsed.data);
      return classPath(ctx.institution.slug, id);
    },
    "class_created"
  );
}

export async function archiveClassAction(slug: string, classId: string) {
  const id = idSchema.parse(classId);
  return act(
    slug,
    (s) => classPath(s, id),
    async (ctx) => {
      await archiveClass(ctx, id);
      return `/campus/${ctx.institution.slug}`;
    }
  );
}

export async function addClassMemberAction(
  slug: string,
  classId: string,
  form: FormData
) {
  const id = idSchema.parse(classId);
  return act(
    slug,
    (s) => classPath(s, id),
    async (ctx) => {
      const parsed = classMemberSchema.safeParse(fields(form));
      if (!parsed.success) throw invalid();
      await addClassMember(ctx, id, parsed.data);
    }
  );
}

export async function removeClassMemberAction(
  slug: string,
  classId: string,
  memberId: string
) {
  const id = idSchema.parse(classId);
  return act(
    slug,
    (s) => classPath(s, id),
    (ctx) => removeClassMember(ctx, id, idSchema.parse(memberId))
  );
}

export async function assignContentAction(
  slug: string,
  classId: string,
  form: FormData
) {
  const id = idSchema.parse(classId);
  return act(
    slug,
    (s) => classPath(s, id),
    async (ctx) => {
      const parsed = assignmentSchema.safeParse(fields(form));
      if (!parsed.success) throw invalid();
      await assignContent(ctx, id, parsed.data);
    },
    "assigned"
  );
}

export async function archiveAssignmentAction(slug: string, assignmentId: string) {
  return act(
    slug,
    (s) => `/campus/${s}`,
    async (ctx) => {
      const classId = await archiveAssignment(ctx, idSchema.parse(assignmentId));
      return classPath(ctx.institution.slug, classId);
    }
  );
}

// ---------------------------------------------------------------------------
// Question banks
// ---------------------------------------------------------------------------

export async function createBankAction(slug: string, form: FormData) {
  return act(
    slug,
    (s) => `/campus/${s}/banks`,
    async (ctx) => {
      const parsed = bankSchema.safeParse(fields(form));
      if (!parsed.success) throw invalid();
      const { id } = await createBank(ctx, parsed.data);
      return `/campus/${ctx.institution.slug}/banks/${id}`;
    }
  );
}

export async function addQuestionAction(slug: string, bankId: string, form: FormData) {
  const id = idSchema.parse(bankId);
  return act(
    slug,
    (s) => `/campus/${s}/banks/${id}`,
    async (ctx) => {
      const parsed = bankQuestionSchema.safeParse(fields(form));
      if (!parsed.success) throw invalid();
      await addQuestion(ctx, id, parsed.data);
    }
  );
}

export async function archiveQuestionAction(slug: string, questionId: string) {
  return act(
    slug,
    (s) => `/campus/${s}/banks`,
    async (ctx) => {
      const bankId = await archiveQuestion(ctx, idSchema.parse(questionId));
      return `/campus/${ctx.institution.slug}/banks/${bankId}`;
    }
  );
}

// ---------------------------------------------------------------------------
// Assessments (staff)
// ---------------------------------------------------------------------------

function settingsFrom(form: FormData) {
  const raw = fields(form);
  return assessmentSettingsSchema.safeParse({
    ...raw,
    showScoreOnSubmit: raw.showScoreOnSubmit === "on",
  });
}

export async function createAssessmentAction(
  slug: string,
  classId: string,
  form: FormData
) {
  const id = idSchema.parse(classId);
  return act(
    slug,
    (s) => classPath(s, id),
    async (ctx) => {
      const parsed = settingsFrom(form);
      if (!parsed.success) throw invalid();
      const created = await createAssessment(ctx, id, parsed.data);
      return examPath(ctx.institution.slug, created.id);
    }
  );
}

export async function updateAssessmentAction(
  slug: string,
  assessmentId: string,
  form: FormData
) {
  const id = idSchema.parse(assessmentId);
  return act(
    slug,
    (s) => examPath(s, id),
    async (ctx) => {
      const parsed = settingsFrom(form);
      if (!parsed.success) throw invalid();
      await updateAssessment(ctx, id, parsed.data);
    }
  );
}

export async function addItemAction(
  slug: string,
  assessmentId: string,
  form: FormData
) {
  const id = idSchema.parse(assessmentId);
  return act(
    slug,
    (s) => examPath(s, id),
    async (ctx) => {
      const parsed = itemSchema.safeParse(fields(form));
      if (!parsed.success) throw invalid();
      await addItem(ctx, id, parsed.data);
    }
  );
}

export async function removeItemAction(
  slug: string,
  assessmentId: string,
  index: number
) {
  const id = idSchema.parse(assessmentId);
  const at = z.number().int().min(0).max(99).parse(index);
  return act(
    slug,
    (s) => examPath(s, id),
    (ctx) => removeItem(ctx, id, at)
  );
}

const LIFECYCLE = {
  publish: publishAssessment,
  unpublish: unpublishAssessment,
  close: closeAssessment,
  release: releaseResults,
} as const;

export async function lifecycleAction(
  slug: string,
  assessmentId: string,
  step: keyof typeof LIFECYCLE
) {
  const id = idSchema.parse(assessmentId);
  const safeStep = z.enum(["publish", "unpublish", "close", "release"]).parse(step);
  return act(
    slug,
    (s) => examPath(s, id),
    (ctx) => LIFECYCLE[safeStep](ctx, id),
    safeStep === "publish" ? "published" : "saved"
  );
}

export async function archiveAssessmentAction(slug: string, assessmentId: string) {
  const id = idSchema.parse(assessmentId);
  return act(
    slug,
    (s) => examPath(s, id),
    async (ctx) => classPath(ctx.institution.slug, await archiveAssessment(ctx, id))
  );
}

export async function gradeAnswerAction(
  slug: string,
  attemptId: string,
  questionKey: string,
  form: FormData
) {
  const id = idSchema.parse(attemptId);
  const key = z
    .string()
    .regex(/^q\d{1,3}$/)
    .parse(questionKey);
  return act(
    slug,
    (s) => `/campus/${s}/attempts/${id}`,
    async (ctx) => {
      const parsed = gradeSchema.safeParse(fields(form));
      if (!parsed.success) throw invalid();
      await gradeAnswer(ctx, id, key, parsed.data);
    },
    "graded"
  );
}

// ---------------------------------------------------------------------------
// Attempts (students)
// ---------------------------------------------------------------------------

export async function startAttemptAction(slug: string, assessmentId: string) {
  const id = idSchema.parse(assessmentId);
  return act(
    slug,
    (s) => examPath(s, id),
    async (ctx) =>
      `/campus/${ctx.institution.slug}/attempts/${await startAttempt(ctx, id)}`
  );
}

/**
 * Autosave, called from the exam page. Returns a result instead of
 * redirecting so the page keeps the student's place; failures come back
 * as codes, never as error text.
 */
export async function saveAnswerAction(
  slug: string,
  input: unknown
): Promise<SaveResult | { status: "error"; code: string }> {
  const ctx = await requireMemberOrThrow(slugSchema.parse(slug));
  const parsed = saveAnswerSchema.safeParse(input);
  if (!parsed.success) return { status: "error", code: "invalid" };
  try {
    return await saveAnswer(ctx, parsed.data);
  } catch (error) {
    return { status: "error", code: codeFor(error) };
  }
}

export async function submitAttemptAction(slug: string, attemptId: string) {
  const id = idSchema.parse(attemptId);
  return act(
    slug,
    (s) => `/campus/${s}/attempts/${id}`,
    async (ctx) => {
      const { assessmentId } = await submitAttempt(ctx, id);
      // Coding answers run against hidden tests after the response is sent.
      after(() => autoGradeCoding(id));
      return examPath(ctx.institution.slug, assessmentId);
    },
    "submitted"
  );
}
