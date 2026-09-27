import "server-only";

import type { ContentStatus, Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

/**
 * Administrative reads and writes.
 *
 * Every function here assumes the caller has already passed
 * `requireAdmin`. That is not a weakening: the boundary is checked in the
 * page or the server action, where a redirect is possible, and repeating
 * it here would mean two places to get it wrong. What this module does
 * guarantee is that **every mutation writes an audit row in the same
 * transaction as the change**, so there is no ordering in which a change
 * lands without a record of who made it.
 *
 * Nothing here is a paid capability. Admin is a role, and a role is a
 * permission boundary rather than a price.
 */

export type AdminOverview = {
  users: { total: number; admins: number; newThisWeek: number };
  content: {
    courses: number;
    chapters: number;
    publishedChapters: number;
    problems: number;
    publishedProblems: number;
    systemDesign: number;
    lld: number;
    behavioral: number;
    prepTracks: number;
  };
  activity: {
    submissions7d: number;
    interviews7d: number;
    tutorMessages7d: number;
  };
  ai: {
    calls30d: number;
    /// Integer milli-cents, summed. Rendered as currency by the caller.
    costMilliCents30d: number;
    failures30d: number;
  };
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * The admin dashboard's numbers.
 *
 * Every figure is a count over real rows. There is deliberately no
 * "engagement score" or projected figure: an admin dashboard whose
 * numbers cannot be traced to a query is worse than no dashboard.
 *
 * Batched through `$transaction` rather than `Promise.all`. Seventeen
 * concurrent queries is seventeen connections from the pool for one page
 * render, which starves every other request on a small deployment — and
 * on the PGlite stand-in used in development it desynchronises the wire
 * protocol outright. A transaction sends them on one connection and also
 * makes the figures consistent with each other, which a dashboard
 * comparing counts actually wants.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const week = daysAgo(7);
  const month = daysAgo(30);

  const [
    users,
    admins,
    newThisWeek,
    courses,
    chapters,
    publishedChapters,
    problems,
    publishedProblems,
    systemDesign,
    lld,
    behavioral,
    prepTracks,
    submissions7d,
    interviews7d,
    tutorMessages7d,
    aiAggregate,
    failures30d,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.course.count(),
    prisma.chapter.count(),
    prisma.chapter.count({ where: { status: "PUBLISHED" } }),
    prisma.problem.count(),
    prisma.problem.count({ where: { status: "PUBLISHED" } }),
    prisma.systemDesignProblem.count({ where: { status: "PUBLISHED" } }),
    prisma.lLDProblem.count({ where: { status: "PUBLISHED" } }),
    prisma.behavioralQuestion.count({ where: { status: "PUBLISHED" } }),
    prisma.prepTrack.count({ where: { status: "PUBLISHED" } }),
    prisma.submission.count({ where: { createdAt: { gte: week } } }),
    prisma.interviewSession.count({ where: { startedAt: { gte: week } } }),
    prisma.aIMessage.count({ where: { createdAt: { gte: week } } }),
    prisma.aIUsageRecord.aggregate({
      where: { createdAt: { gte: month } },
      _count: true,
      _sum: { costMilliCents: true },
    }),
    prisma.aIUsageRecord.count({
      where: { createdAt: { gte: month }, success: false },
    }),
  ]);

  return {
    users: { total: users, admins, newThisWeek },
    content: {
      courses,
      chapters,
      publishedChapters,
      problems,
      publishedProblems,
      systemDesign,
      lld,
      behavioral,
      prepTracks,
    },
    activity: { submissions7d, interviews7d, tutorMessages7d },
    ai: {
      calls30d: aiAggregate._count,
      costMilliCents30d: aiAggregate._sum?.costMilliCents ?? 0,
      failures30d,
    },
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  problemsSolved: number;
  interviews: number;
};

export async function listUsers(params: {
  query?: string;
  page?: number;
  perPage?: number;
}): Promise<{ rows: AdminUserRow[]; total: number; page: number; totalPages: number }> {
  const perPage = Math.min(Math.max(params.perPage ?? 25, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const query = params.query?.trim();

  // `contains` on an indexed column with a user-supplied needle is a
  // sequential scan, which is acceptable here: this is an admin screen
  // over a bounded table, and Prisma parameterises the value.
  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { interviews: true } },
        profile: { select: { problemsSolved: true } },
      },
    }),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.createdAt,
      problemsSolved: row.profile?.problemsSolved ?? 0,
      interviews: row._count.interviews,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Changes a user's role, and records who did it.
 *
 * Refuses to demote the last admin. An installation with no admin cannot
 * promote one back through the UI, so this is a lockout rather than a
 * policy decision, and the check belongs in the same transaction as the
 * write — two admins demoting each other concurrently would otherwise
 * both see a count of two.
 */
export async function setUserRole(params: {
  actor: { id: string; email: string };
  userId: string;
  role: Role;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (params.actor.id === params.userId && params.role !== "ADMIN") {
    return { ok: false, reason: "You cannot remove your own admin access." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: params.userId },
        select: { id: true, email: true, role: true },
      });
      if (!target) return { ok: false as const, reason: "That user no longer exists." };
      if (target.role === params.role) return { ok: true as const };

      if (target.role === "ADMIN" && params.role !== "ADMIN") {
        const admins = await tx.user.count({ where: { role: "ADMIN" } });
        if (admins <= 1) {
          return {
            ok: false as const,
            reason: "That is the only admin account. Promote another first.",
          };
        }
      }

      await tx.user.update({
        where: { id: params.userId },
        data: { role: params.role },
      });

      await tx.auditLog.create({
        data: {
          actorId: params.actor.id,
          actorEmail: params.actor.email,
          action: "user.role.set",
          entity: "User",
          entityId: params.userId,
          summary: `Changed ${target.email} from ${target.role} to ${params.role}`,
        },
      });

      return { ok: true as const };
    });
  } catch (error) {
    console.error("[admin] setUserRole failed", error);
    return { ok: false, reason: "That change could not be saved." };
  }
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type ContentKind =
  | "problem"
  | "chapter"
  | "systemDesign"
  | "lld"
  | "behavioral"
  | "prepTrack";

export type ContentRow = {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  subtitle: string | null;
};

/**
 * One listing for six content types.
 *
 * The delegate is chosen from a closed map rather than built from the
 * caller's string, so there is no path from a query parameter to an
 * arbitrary model.
 */
export async function listContent(
  kind: ContentKind,
  query?: string
): Promise<ContentRow[]> {
  const needle = query?.trim();
  const contains = needle
    ? { contains: needle, mode: "insensitive" as const }
    : undefined;

  switch (kind) {
    case "problem": {
      const rows = await prisma.problem.findMany({
        where: contains ? { title: contains } : {},
        orderBy: { number: "asc" },
        take: 200,
        select: { id: true, slug: true, title: true, status: true, difficulty: true },
      });
      return rows.map((r) => ({ ...r, subtitle: r.difficulty.toLowerCase() }));
    }
    case "chapter": {
      const rows = await prisma.chapter.findMany({
        where: contains ? { title: contains } : {},
        orderBy: [{ section: { course: { order: "asc" } } }, { order: "asc" }],
        take: 200,
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          section: { select: { title: true } },
        },
      });
      return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        status: r.status,
        subtitle: r.section.title,
      }));
    }
    case "systemDesign": {
      const rows = await prisma.systemDesignProblem.findMany({
        where: contains ? { title: contains } : {},
        orderBy: { order: "asc" },
        take: 200,
        select: { id: true, slug: true, title: true, status: true, tagline: true },
      });
      return rows.map((r) => ({ ...r, subtitle: r.tagline }));
    }
    case "lld": {
      const rows = await prisma.lLDProblem.findMany({
        where: contains ? { title: contains } : {},
        orderBy: { order: "asc" },
        take: 200,
        select: { id: true, slug: true, title: true, status: true, tagline: true },
      });
      return rows.map((r) => ({ ...r, subtitle: r.tagline }));
    }
    case "behavioral": {
      const rows = await prisma.behavioralQuestion.findMany({
        where: contains ? { prompt: contains } : {},
        orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
        take: 200,
        select: {
          id: true,
          slug: true,
          prompt: true,
          status: true,
          category: { select: { name: true } },
        },
      });
      return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.prompt,
        status: r.status,
        subtitle: r.category.name,
      }));
    }
    case "prepTrack": {
      const rows = await prisma.prepTrack.findMany({
        where: contains ? { name: contains } : {},
        orderBy: { order: "asc" },
        take: 200,
        select: { id: true, slug: true, name: true, status: true, blurb: true },
      });
      return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.name,
        status: r.status,
        subtitle: r.blurb.slice(0, 90),
      }));
    }
  }
}

/**
 * Publishes or unpublishes one piece of content.
 *
 * Publication state is the only content field the admin UI writes.
 * Editing bodies is deliberately out of scope: chapter content is a
 * validated block document authored in `src/data/`, and a textarea that
 * let an admin paste arbitrary JSON into it would be a worse tool than
 * the seed it replaced. Changing what is *visible* is the operation an
 * operator actually needs, and it is fully implemented.
 */
export async function setContentStatus(params: {
  actor: { id: string; email: string };
  kind: ContentKind;
  id: string;
  status: ContentStatus;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { actor, kind, id, status } = params;

  try {
    return await prisma.$transaction(async (tx) => {
      // A closed map, so `kind` can never select an arbitrary delegate.
      const updated = await (async () => {
        switch (kind) {
          case "problem":
            return tx.problem.update({
              where: { id },
              data: { status },
              select: { title: true },
            });
          case "chapter":
            return tx.chapter.update({
              where: { id },
              data: { status },
              select: { title: true },
            });
          case "systemDesign":
            return tx.systemDesignProblem.update({
              where: { id },
              data: { status },
              select: { title: true },
            });
          case "lld":
            return tx.lLDProblem.update({
              where: { id },
              data: { status },
              select: { title: true },
            });
          case "behavioral": {
            const row = await tx.behavioralQuestion.update({
              where: { id },
              data: { status },
              select: { prompt: true },
            });
            return { title: row.prompt };
          }
          case "prepTrack": {
            const row = await tx.prepTrack.update({
              where: { id },
              data: { status },
              select: { name: true },
            });
            return { title: row.name };
          }
        }
      })();

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          action: "content.status.set",
          entity: kind,
          entityId: id,
          summary: `Set ${kind} "${updated.title.slice(0, 80)}" to ${status}`,
        },
      });

      return { ok: true as const };
    });
  } catch (error) {
    console.error("[admin] setContentStatus failed", error);
    return { ok: false, reason: "That change could not be saved." };
  }
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export type AuditRow = {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  createdAt: Date;
};

export async function listAuditLog(limit = 100): Promise<AuditRow[]> {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
    select: {
      id: true,
      actorEmail: true,
      action: true,
      entity: true,
      entityId: true,
      summary: true,
      createdAt: true,
    },
  });
}

// ---------------------------------------------------------------------------
// AI usage
// ---------------------------------------------------------------------------

export type AIUsageRow = {
  feature: string;
  calls: number;
  costMilliCents: number;
  failures: number;
};

/**
 * AI spend by feature, over a window.
 *
 * Aggregated, never per-user: an admin needs to know what the free AI
 * features cost to run and whether anything is failing. Reading an
 * individual learner's conversations is not an operational need, so this
 * module has no way to do it.
 */
export async function getAIUsage(days = 30): Promise<AIUsageRow[]> {
  const since = daysAgo(days);

  const [grouped, failures] = await Promise.all([
    prisma.aIUsageRecord.groupBy({
      by: ["feature"],
      where: { createdAt: { gte: since } },
      _count: true,
      _sum: { costMilliCents: true },
    }),
    prisma.aIUsageRecord.groupBy({
      by: ["feature"],
      where: { createdAt: { gte: since }, success: false },
      _count: true,
    }),
  ]);

  const failureByFeature = new Map(
    failures.map((row) => [row.feature, row._count])
  );

  return grouped
    .map((row) => ({
      feature: row.feature,
      calls: row._count,
      costMilliCents: row._sum?.costMilliCents ?? 0,
      failures: failureByFeature.get(row.feature) ?? 0,
    }))
    .sort((a, b) => b.calls - a.calls);
}
