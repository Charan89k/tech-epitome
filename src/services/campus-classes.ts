import "server-only";

import type { CohortRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { segmentForTrack } from "@/lib/tracks";
import {
  assertCan,
  InstitutionError,
  scopeOf,
  type MemberContext,
} from "@/lib/tenancy/context";
import { withTenantScope, type TenantTx } from "@/lib/tenancy/scope";
import type { z } from "zod";

import type {
  assignmentSchema,
  classSchema,
  classMemberSchema,
} from "@/lib/campus/schemas";
import { writeAudit } from "./institutions";

/**
 * Classes (cohorts), their rosters and the platform content assigned to
 * them.
 *
 * Same contract as services/institutions.ts: every function takes a
 * MemberContext from the session, re-checks what it needs, and runs inside
 * withTenantScope so row-level security confines it to the institution and
 * to what this user may see in it. A class id from another institution, or
 * one a student is not enrolled in, reads as "not found".
 *
 * Managing a class (roster, assignments, assessments, grades) needs
 * `teaches`: an institution admin, or active faculty who is one of the
 * class's instructors. Merely being faculty in the institution is not
 * enough.
 */

const notFound = () => new InstitutionError("not_found", "Class not found.");

/** The te_teaches() check the policies use, so both layers agree. */
export async function teaches(tx: TenantTx, cohortId: string): Promise<boolean> {
  const [row] = await tx.$queryRaw<
    { ok: boolean }[]
  >`SELECT te_teaches(${cohortId}) AS ok`;
  return row?.ok === true;
}

/** Throws not_found if invisible, forbidden if visible but not taught. */
export async function assertTeaches(tx: TenantTx, cohortId: string): Promise<void> {
  const cohort = await tx.cohort.findUnique({
    where: { id: cohortId },
    select: { id: true },
  });
  if (!cohort) throw notFound();
  if (!(await teaches(tx, cohortId))) {
    throw new InstitutionError(
      "forbidden",
      "Only this class's instructors can do that."
    );
  }
}

export type ClassSummary = {
  id: string;
  name: string;
  description: string | null;
  teaching: boolean;
  students: number;
};

/** Staff see every class; a student sees the classes they are in. */
export async function listClasses(ctx: MemberContext): Promise<ClassSummary[]> {
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const rows = await tx.cohort.findMany({
      where: { institutionId: ctx.institution.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, description: true },
    });
    // Sequential: one transaction runs one query at a time.
    const out: ClassSummary[] = [];
    for (const row of rows) {
      const teaching = await teaches(tx, row.id);
      out.push({
        ...row,
        teaching,
        // RLS shows a student only their own row, so count for teachers only.
        students: teaching
          ? await tx.cohortMember.count({
              where: { cohortId: row.id, role: "STUDENT", removedAt: null },
            })
          : 0,
      });
    }
    return out;
  });
}

export async function createClass(
  ctx: MemberContext,
  input: z.output<typeof classSchema>
): Promise<{ id: string }> {
  assertCan(ctx, "classes.create");
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const cohort = await tx.cohort.create({
      data: {
        institutionId: ctx.institution.id,
        name: input.name,
        description: input.description,
        createdById: ctx.user.id,
      },
      select: { id: true },
    });
    // A platform operator with no membership manages it without joining it.
    if (ctx.membershipId) {
      await tx.cohortMember.create({
        data: {
          institutionId: ctx.institution.id,
          cohortId: cohort.id,
          userId: ctx.user.id,
          role: "INSTRUCTOR",
        },
      });
    }
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "class.create",
      targetType: "cohort",
      targetId: cohort.id,
      summary: `Created class "${input.name}"`,
    });
    return cohort;
  });
}

export async function archiveClass(
  ctx: MemberContext,
  cohortId: string
): Promise<void> {
  await withTenantScope(scopeOf(ctx), async (tx) => {
    await assertTeaches(tx, cohortId);
    const cohort = await tx.cohort.update({
      where: { id: cohortId },
      data: { archivedAt: new Date() },
      select: { name: true },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "class.archive",
      targetType: "cohort",
      targetId: cohortId,
      summary: `Archived class "${cohort.name}"`,
    });
  });
}

/**
 * Adds an active member of the institution to the class. Instructors must
 * hold a faculty or admin membership; students a student membership.
 */
export async function addClassMember(
  ctx: MemberContext,
  cohortId: string,
  input: z.output<typeof classMemberSchema>
): Promise<void> {
  await withTenantScope(scopeOf(ctx), async (tx) => {
    await assertTeaches(tx, cohortId);
    const membership = await tx.institutionMembership.findFirst({
      where: {
        institutionId: ctx.institution.id,
        status: "ACTIVE",
        user: { email: input.email },
      },
      select: { userId: true, role: true },
    });
    const allowed =
      input.role === "INSTRUCTOR"
        ? membership?.role === "FACULTY" || membership?.role === "INSTITUTION_ADMIN"
        : membership?.role === "STUDENT";
    if (!membership || !allowed) {
      throw new InstitutionError(
        "invalid",
        input.role === "INSTRUCTOR"
          ? "Instructors must be active faculty of this institution."
          : "Students must be active student members of this institution."
      );
    }
    await tx.cohortMember.upsert({
      where: { cohortId_userId: { cohortId, userId: membership.userId } },
      create: {
        institutionId: ctx.institution.id,
        cohortId,
        userId: membership.userId,
        role: input.role,
      },
      update: { role: input.role, removedAt: null },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "class.member_add",
      targetType: "cohort",
      targetId: cohortId,
      summary: `Added ${input.email} to a class as ${input.role.toLowerCase()}`,
      metadata: { userId: membership.userId, role: input.role },
    });
  });
}

export async function removeClassMember(
  ctx: MemberContext,
  cohortId: string,
  memberId: string
): Promise<void> {
  await withTenantScope(scopeOf(ctx), async (tx) => {
    await assertTeaches(tx, cohortId);
    const member = await tx.cohortMember.findFirst({
      where: { id: memberId, cohortId, removedAt: null },
      select: { id: true, userId: true, role: true },
    });
    if (!member) throw new InstitutionError("not_found", "Not in this class.");
    if (member.userId === ctx.user.id) {
      throw new InstitutionError("invalid", "You cannot remove yourself.");
    }
    await tx.cohortMember.update({
      where: { id: member.id },
      data: { removedAt: new Date() },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "class.member_remove",
      targetType: "cohort",
      targetId: cohortId,
      summary: `Removed a ${member.role.toLowerCase()} from a class`,
      metadata: { userId: member.userId },
    });
  });
}

export type ClassMemberRow = {
  id: string;
  role: CohortRole;
  user: { id: string; name: string | null; email: string };
};

export type AssignmentRow = {
  id: string;
  kind: "COURSE" | "CHAPTER" | "PROBLEM";
  title: string;
  instructions: string | null;
  dueAt: Date | null;
  href: string | null;
};

export type ClassDetail = {
  id: string;
  name: string;
  description: string | null;
  teaching: boolean;
  members: ClassMemberRow[] | null;
  assignments: AssignmentRow[];
  assessments: {
    id: string;
    title: string;
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
    opensAt: Date | null;
    closesAt: Date;
    lateUntil: Date | null;
    durationMinutes: number | null;
  }[];
};

export async function getClass(
  ctx: MemberContext,
  cohortId: string
): Promise<ClassDetail> {
  const detail = await withTenantScope(scopeOf(ctx), async (tx) => {
    const cohort = await tx.cohort.findFirst({
      where: { id: cohortId, institutionId: ctx.institution.id, archivedAt: null },
      select: { id: true, name: true, description: true },
    });
    if (!cohort) throw notFound();
    const teaching = await teaches(tx, cohortId);

    // Staff who do not teach this class may see that it exists, not inside it.
    if (!teaching) {
      const enrolled = await tx.cohortMember.findFirst({
        where: { cohortId, userId: ctx.user.id, removedAt: null },
        select: { id: true },
      });
      if (!enrolled)
        throw new InstitutionError("forbidden", "You are not in this class.");
    }

    const members = teaching
      ? await tx.cohortMember.findMany({
          where: { cohortId, removedAt: null },
          orderBy: [{ role: "desc" }, { createdAt: "asc" }],
          select: {
            id: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        })
      : null;
    const assignments = await tx.cohortAssignment.findMany({
      where: { cohortId, archivedAt: null },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
      select: {
        id: true,
        kind: true,
        title: true,
        instructions: true,
        dueAt: true,
        courseId: true,
        chapterId: true,
        problemId: true,
      },
    });
    const assessments = await tx.assessment.findMany({
      where: { cohortId, status: { not: "ARCHIVED" } },
      orderBy: { closesAt: "asc" },
      select: {
        id: true,
        title: true,
        status: true,
        opensAt: true,
        closesAt: true,
        lateUntil: true,
        durationMinutes: true,
      },
    });

    return { ...cohort, teaching, members, assignments, assessments };
  });
  // Catalogue reads use the owner connection, so they run after the
  // tenant transaction has finished rather than alongside it.
  return { ...detail, assignments: await withHrefs(detail.assignments) };
}

/** Catalogue links, read as the owner: published content is public. */
async function withHrefs(
  rows: {
    id: string;
    kind: "COURSE" | "CHAPTER" | "PROBLEM";
    title: string;
    instructions: string | null;
    dueAt: Date | null;
    courseId: string | null;
    chapterId: string | null;
    problemId: string | null;
  }[]
): Promise<AssignmentRow[]> {
  const ids = (key: "courseId" | "chapterId" | "problemId") =>
    rows.map((r) => r[key]).filter((v): v is string => Boolean(v));
  const [courses, chapters, problems] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: ids("courseId") } },
      select: { id: true, slug: true, track: true },
    }),
    prisma.chapter.findMany({
      where: { id: { in: ids("chapterId") } },
      select: {
        id: true,
        slug: true,
        section: {
          select: { slug: true, course: { select: { slug: true, track: true } } },
        },
      },
    }),
    prisma.problem.findMany({
      where: { id: { in: ids("problemId") } },
      select: { id: true, slug: true },
    }),
  ]);
  return rows.map(({ courseId, chapterId, problemId, ...row }) => {
    let href: string | null = null;
    if (courseId) {
      const c = courses.find((x) => x.id === courseId);
      href = c ? `/learn/${segmentForTrack(c.track)}/${c.slug}` : null;
    } else if (chapterId) {
      const c = chapters.find((x) => x.id === chapterId);
      const course = c?.section.course;
      href =
        c && course
          ? `/learn/${segmentForTrack(course.track)}/${course.slug}/${c.section.slug}/${c.slug}`
          : null;
    } else if (problemId) {
      const p = problems.find((x) => x.id === problemId);
      href = p ? `/problems/${p.slug}` : null;
    }
    return { ...row, href };
  });
}

export type AssignableContent = {
  courses: { id: string; title: string; chapters: { id: string; title: string }[] }[];
  problems: { id: string; number: number; title: string }[];
};

/** Published catalogue only: drafts can never be assigned. */
export async function listAssignableContent(): Promise<AssignableContent> {
  const [courses, problems] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        sections: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: {
            chapters: {
              where: { status: "PUBLISHED" },
              orderBy: { order: "asc" },
              select: { id: true, title: true },
            },
          },
        },
      },
    }),
    prisma.problem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { number: "asc" },
      select: { id: true, number: true, title: true },
    }),
  ]);
  return {
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      chapters: c.sections.flatMap((s) => s.chapters),
    })),
    problems,
  };
}

export async function assignContent(
  ctx: MemberContext,
  cohortId: string,
  input: z.output<typeof assignmentSchema>
): Promise<void> {
  const [kind, targetId] = input.target.split(":") as [
    "course" | "chapter" | "problem",
    string,
  ];
  const title = await publishedTitle(kind, targetId);
  if (!title) throw new InstitutionError("invalid", "That content is not published.");

  await withTenantScope(scopeOf(ctx), async (tx) => {
    await assertTeaches(tx, cohortId);
    const row = await tx.cohortAssignment.create({
      data: {
        institutionId: ctx.institution.id,
        cohortId,
        kind: kind.toUpperCase() as "COURSE" | "CHAPTER" | "PROBLEM",
        courseId: kind === "course" ? targetId : null,
        chapterId: kind === "chapter" ? targetId : null,
        problemId: kind === "problem" ? targetId : null,
        title,
        instructions: input.instructions,
        dueAt: input.dueAt ?? null,
        createdById: ctx.user.id,
      },
      select: { id: true },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "class.assign",
      targetType: "cohort_assignment",
      targetId: row.id,
      summary: `Assigned ${kind} "${title}"`,
      metadata: { cohortId },
    });
  });
}

async function publishedTitle(
  kind: "course" | "chapter" | "problem",
  id: string
): Promise<string | null> {
  const where = { id, status: "PUBLISHED" as const };
  const row =
    kind === "course"
      ? await prisma.course.findFirst({ where, select: { title: true } })
      : kind === "chapter"
        ? await prisma.chapter.findFirst({ where, select: { title: true } })
        : await prisma.problem.findFirst({ where, select: { title: true } });
  return row?.title ?? null;
}

export async function archiveAssignment(
  ctx: MemberContext,
  assignmentId: string
): Promise<string> {
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const row = await tx.cohortAssignment.findFirst({
      where: { id: assignmentId, institutionId: ctx.institution.id, archivedAt: null },
      select: { id: true, cohortId: true, title: true },
    });
    if (!row) throw new InstitutionError("not_found", "Assignment not found.");
    await assertTeaches(tx, row.cohortId);
    await tx.cohortAssignment.update({
      where: { id: row.id },
      data: { archivedAt: new Date() },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "class.unassign",
      targetType: "cohort_assignment",
      targetId: row.id,
      summary: `Removed assignment "${row.title}"`,
      metadata: { cohortId: row.cohortId },
    });
    return row.cohortId;
  });
}

export type ProgressGrid = {
  students: { id: string; name: string | null; email: string }[];
  cells: Record<string, Record<string, { done: number; total: number }>>;
};

/**
 * Per student, per assignment, done/total, from the te_cohort_progress
 * definer function: the institution reads personal learning data only for
 * content this class was assigned, and only for teachers of the class.
 */
export async function classProgress(
  ctx: MemberContext,
  cohortId: string
): Promise<ProgressGrid> {
  return withTenantScope(scopeOf(ctx), async (tx) => {
    await assertTeaches(tx, cohortId);
    const rows = await tx.$queryRaw<
      { user_id: string; assignment_id: string; done: number; total: number }[]
    >`SELECT * FROM te_cohort_progress(${cohortId})`;
    const students = await tx.cohortMember.findMany({
      where: { cohortId, role: "STUDENT", removedAt: null },
      orderBy: { createdAt: "asc" },
      select: { user: { select: { id: true, name: true, email: true } } },
    });
    const cells: ProgressGrid["cells"] = {};
    for (const r of rows) {
      cells[r.user_id] ??= {};
      cells[r.user_id]![r.assignment_id] = { done: r.done, total: r.total };
    }
    return { students: students.map((s) => s.user), cells };
  });
}

/**
 * The signed-in student's own progress on a class's assignments. Their
 * own data, read directly; nothing about anyone else.
 */
export async function myAssignmentProgress(
  ctx: MemberContext,
  cohortId: string,
  assignments: { id: string }[]
): Promise<Record<string, { done: number; total: number }>> {
  const userId = ctx.user.id;
  if (assignments.length === 0) return {};
  const rows = await withTenantScope(scopeOf(ctx), (tx) =>
    tx.cohortAssignment.findMany({
      where: { cohortId, id: { in: assignments.map((a) => a.id) } },
      select: {
        id: true,
        kind: true,
        courseId: true,
        chapterId: true,
        problemId: true,
      },
    })
  );
  const out: Record<string, { done: number; total: number }> = {};
  for (const a of rows) {
    if (a.problemId) {
      const p = await prisma.userProblemProgress.findUnique({
        where: { userId_problemId: { userId, problemId: a.problemId } },
        select: { status: true },
      });
      out[a.id] = { done: p?.status === "SOLVED" ? 1 : 0, total: 1 };
    } else if (a.chapterId) {
      const p = await prisma.userChapterProgress.findUnique({
        where: { userId_chapterId: { userId, chapterId: a.chapterId } },
        select: { status: true },
      });
      out[a.id] = { done: p?.status === "COMPLETED" ? 1 : 0, total: 1 };
    } else if (a.courseId) {
      const chapterWhere = {
        status: "PUBLISHED" as const,
        section: { courseId: a.courseId },
      };
      const [total, done] = await Promise.all([
        prisma.chapter.count({ where: chapterWhere }),
        prisma.userChapterProgress.count({
          where: { userId, status: "COMPLETED", chapter: chapterWhere },
        }),
      ]);
      out[a.id] = { done, total };
    }
  }
  return out;
}
