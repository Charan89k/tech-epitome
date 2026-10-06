import "server-only";

import { cache } from "react";

import type {Difficulty,
  Language,
  ProblemStatus} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { Signature } from "@/lib/code-execution/signature";

/**
 * Problem catalogue reads.
 *
 * The list query is paginated and index-backed: the catalogue is expected to
 * reach thousands of rows, so nothing here loads the whole table and filters
 * in memory.
 */

export type ProblemFilters = {
  search?: string;
  difficulty?: Difficulty[];
  patternSlugs?: string[];
  topicSlugs?: string[];
  /** Narrows to the problems recommended by one preparation track. */
  prepTrackSlug?: string;
  /** Requires a signed-in user; ignored otherwise. */
  status?: ProblemStatus[];
  page?: number;
  perPage?: number;
  sort?: "number" | "difficulty" | "title";
};

export type ProblemListItem = {
  id: string;
  number: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  patterns: { slug: string; name: string }[];
  topics: { slug: string; name: string }[];
  status: ProblemStatus;
  bookmarked: boolean;
};

export type ProblemListResult = {
  items: ProblemListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export const DEFAULT_PER_PAGE = 25;

export async function listProblems(
  filters: ProblemFilters,
  userId?: string
): Promise<ProblemListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(100, Math.max(5, filters.perPage ?? DEFAULT_PER_PAGE));

  const where: Prisma.ProblemWhereInput = { status: "PUBLISHED" };

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    // Prefix search on the tsvector, plus a plain contains as a fallback for
    // partial words the dictionary would not stem into a match.
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { slug: { contains: term.toLowerCase().replaceAll(" ", "-") } },
    ];
  }

  if (filters.difficulty?.length) {
    where.difficulty = { in: filters.difficulty };
  }

  if (filters.patternSlugs?.length) {
    where.patterns = { some: { pattern: { slug: { in: filters.patternSlugs } } } };
  }

  if (filters.topicSlugs?.length) {
    where.topics = { some: { topic: { slug: { in: filters.topicSlugs } } } };
  }

  if (filters.prepTrackSlug) {
    where.prepTracks = { some: { track: { slug: filters.prepTrackSlug } } };
  }

  // Status is per-user, so it can only be applied when there is a user.
  if (userId && filters.status?.length) {
    const statuses = filters.status;
    const wantsNotStarted = statuses.includes("NOT_STARTED");
    const others = statuses.filter((s) => s !== "NOT_STARTED");

    const clauses: Prisma.ProblemWhereInput[] = [];
    if (others.length) {
      clauses.push({ progress: { some: { userId, status: { in: others } } } });
    }
    if (wantsNotStarted) {
      // "Not started" means either no progress row at all, or one explicitly
      // in that state - both must match or the filter silently drops rows.
      clauses.push({
        OR: [
          { progress: { none: { userId } } },
          { progress: { some: { userId, status: "NOT_STARTED" } } },
        ],
      });
    }
    if (clauses.length === 1) {
      Object.assign(where, clauses[0]);
    } else if (clauses.length > 1) {
      where.AND = [{ OR: clauses }];
    }
  }

  const orderBy: Prisma.ProblemOrderByWithRelationInput[] =
    filters.sort === "difficulty"
      ? [{ difficulty: "asc" }, { number: "asc" }]
      : filters.sort === "title"
        ? [{ title: "asc" }]
        : [{ number: "asc" }];

  const [total, rows] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        number: true,
        slug: true,
        title: true,
        difficulty: true,
        patterns: {
          select: { pattern: { select: { slug: true, name: true } } },
          orderBy: { patternId: "asc" },
        },
        topics: {
          select: { topic: { select: { slug: true, name: true } } },
        },
        progress: userId
          ? { where: { userId }, select: { status: true }, take: 1 }
          : false,
      },
    }),
  ]);

  // Bookmarks are polymorphic, so they cannot be joined in the query above.
  // One extra query for the page's ids, rather than N.
  const bookmarkedIds = userId
    ? new Set(
        (
          await prisma.bookmark.findMany({
            where: {
              userId,
              entityType: "PROBLEM",
              entityId: { in: rows.map((r) => r.id) },
            },
            select: { entityId: true },
          })
        ).map((b) => b.entityId)
      )
    : new Set<string>();

  return {
    items: rows.map((row) => ({
      id: row.id,
      number: row.number,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      patterns: row.patterns.map((p) => p.pattern),
      topics: row.topics.map((t) => t.topic),
      status:
        (Array.isArray(row.progress) ? row.progress[0]?.status : undefined) ??
        "NOT_STARTED",
      bookmarked: bookmarkedIds.has(row.id),
    })),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Filter options for the problems page, with live counts. */
export const getProblemFilterOptions = cache(async () => {
  const [patterns, topics, difficultyCounts] = await Promise.all([
    prisma.pattern.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: {
        slug: true,
        name: true,
        _count: { select: { problems: true } },
      },
    }),
    prisma.topic.findMany({
      orderBy: { order: "asc" },
      select: {
        slug: true,
        name: true,
        _count: { select: { problems: true } },
      },
    }),
    prisma.problem.groupBy({
      by: ["difficulty"],
      where: { status: "PUBLISHED" },
      _count: true,
    }),
  ]);

  return {
    patterns: patterns
      .filter((p) => p._count.problems > 0)
      .map((p) => ({ slug: p.slug, name: p.name, count: p._count.problems })),
    topics: topics
      .filter((t) => t._count.problems > 0)
      .map((t) => ({ slug: t.slug, name: t.name, count: t._count.problems })),
    difficulty: (["EASY", "MEDIUM", "HARD"] as const).map((level) => ({
      value: level,
      count: difficultyCounts.find((d) => d.difficulty === level)?._count ?? 0,
    })),
  };
});

export type ProblemDetail = {
  id: string;
  number: number;
  slug: string;
  title: string;
  statement: unknown;
  learningObjective: string | null;
  constraints: string[];
  difficulty: Difficulty;
  starterCode: Record<string, string>;
  /**
   * The entry point's shape. Not secret — the starter code already shows
   * it — and the live visualizer needs it to parse samples and call the
   * learner's function in the browser.
   */
  signature: Signature | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  expectedTime: string | null;
  expectedSpace: string | null;
  patterns: { slug: string; name: string; tagline: string }[];
  topics: { slug: string; name: string }[];
  /** Sample cases only. Hidden cases never leave the server. */
  sampleTests: { id: string; input: string; expected: string; explanation: string | null }[];
  hintCount: number;
  solutionCount: number;
  progress: {
    status: ProblemStatus;
    attempts: number;
    hintsRevealed: number;
    solutionViewed: boolean;
  };
  bookmarked: boolean;
};

export const getProblem = cache(
  async (slug: string, userId?: string): Promise<ProblemDetail | null> => {
    const problem = await prisma.problem.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        id: true,
        number: true,
        slug: true,
        title: true,
        statement: true,
        learningObjective: true,
        constraints: true,
        difficulty: true,
        starterCode: true,
        harnessCode: true,
        timeLimitMs: true,
        memoryLimitMb: true,
        expectedTime: true,
        expectedSpace: true,
        patterns: {
          select: {
            isPrimary: true,
            pattern: { select: { slug: true, name: true, tagline: true } },
          },
          orderBy: { isPrimary: "desc" },
        },
        topics: { select: { topic: { select: { slug: true, name: true } } } },
        testCases: {
          where: { isSample: true },
          orderBy: { order: "asc" },
          select: { id: true, input: true, expected: true, explanation: true },
        },
        _count: { select: { hints: true, solutions: true } },
      },
    });

    if (!problem) return null;

    const [progress, bookmark] = userId
      ? await Promise.all([
          prisma.userProblemProgress.findUnique({
            where: { userId_problemId: { userId, problemId: problem.id } },
            select: {
              status: true,
              attempts: true,
              hintsRevealed: true,
              solutionViewedAt: true,
            },
          }),
          prisma.bookmark.findUnique({
            where: {
              userId_entityType_entityId: {
                userId,
                entityType: "PROBLEM",
                entityId: problem.id,
              },
            },
            select: { id: true },
          }),
        ])
      : [null, null];

    return {
      id: problem.id,
      number: problem.number,
      slug: problem.slug,
      title: problem.title,
      statement: problem.statement,
      learningObjective: problem.learningObjective,
      constraints: problem.constraints,
      difficulty: problem.difficulty,
      starterCode: (problem.starterCode ?? {}) as Record<string, string>,
      signature: (problem.harnessCode as { signature?: Signature } | null)?.signature ?? null,
      timeLimitMs: problem.timeLimitMs,
      memoryLimitMb: problem.memoryLimitMb,
      expectedTime: problem.expectedTime,
      expectedSpace: problem.expectedSpace,
      patterns: problem.patterns.map((p) => p.pattern),
      topics: problem.topics.map((t) => t.topic),
      sampleTests: problem.testCases,
      hintCount: problem._count.hints,
      solutionCount: problem._count.solutions,
      progress: {
        status: progress?.status ?? "NOT_STARTED",
        attempts: progress?.attempts ?? 0,
        hintsRevealed: progress?.hintsRevealed ?? 0,
        solutionViewed: Boolean(progress?.solutionViewedAt),
      },
      bookmarked: Boolean(bookmark),
    };
  }
);

/** Languages a problem ships starter code for, in a stable display order. */
export const LANGUAGE_ORDER: Language[] = [
  "PYTHON",
  "JAVASCRIPT",
  "TYPESCRIPT",
  "JAVA",
  "CPP",
  "GO",
];

export const LANGUAGE_LABELS: Record<Language, string> = {
  PYTHON: "Python",
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  JAVA: "Java",
  CPP: "C++",
  GO: "Go",
};

/** What the live visualizer will draw for a problem, from its first input. */
export type InputShape = "array" | "string" | "linked list" | "grid" | "words" | "number";

const SHAPE_OF: Record<string, InputShape> = {
  "int[]": "array",
  string: "string",
  list: "linked list",
  "int[][]": "grid",
  "string[]": "words",
  int: "number",
};

export type PatternGroup = {
  pattern: { slug: string; name: string; tagline: string } | null;
  problems: (ProblemListItem & { inputShape: InputShape | null })[];
};

/**
 * The catalogue grouped by each problem's primary pattern, in curriculum
 * order — the default view of the problems page, where a learner drills one
 * pattern at a time and watches its progress bar fill.
 *
 * Unlike `listProblems` this reads every published problem. That is
 * deliberate and bounded: the grouped view is the whole catalogue by
 * definition, and `take` caps it so a much larger catalogue degrades to a
 * truncated page rather than an unbounded query. Filtering and search still
 * go through the paginated query.
 */
export async function listProblemsByPattern(userId?: string): Promise<PatternGroup[]> {
  const rows = await prisma.problem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { number: "asc" },
    take: 500,
    select: {
      id: true,
      number: true,
      slug: true,
      title: true,
      difficulty: true,
      harnessCode: true,
      patterns: {
        select: {
          isPrimary: true,
          pattern: { select: { slug: true, name: true, tagline: true, order: true } },
        },
        orderBy: { isPrimary: "desc" },
      },
      topics: { select: { topic: { select: { slug: true, name: true } } } },
      progress: userId ? { where: { userId }, select: { status: true }, take: 1 } : false,
    },
  });

  const bookmarkedIds = userId
    ? new Set(
        (
          await prisma.bookmark.findMany({
            where: { userId, entityType: "PROBLEM", entityId: { in: rows.map((r) => r.id) } },
            select: { entityId: true },
          })
        ).map((b) => b.entityId)
      )
    : new Set<string>();

  const groups = new Map<string, PatternGroup & { order: number }>();
  for (const row of rows) {
    const primary = row.patterns[0]?.pattern ?? null;
    const key = primary?.slug ?? "";
    if (!groups.has(key)) {
      groups.set(key, {
        pattern: primary ? { slug: primary.slug, name: primary.name, tagline: primary.tagline } : null,
        problems: [],
        order: primary?.order ?? Number.MAX_SAFE_INTEGER,
      });
    }
    const signature = (row.harnessCode as { signature?: Signature } | null)?.signature;
    const firstParam = signature?.params[0];
    groups.get(key)!.problems.push({
      id: row.id,
      number: row.number,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      patterns: row.patterns.map((p) => ({ slug: p.pattern.slug, name: p.pattern.name })),
      topics: row.topics.map((t) => t.topic),
      status:
        (Array.isArray(row.progress) ? row.progress[0]?.status : undefined) ?? "NOT_STARTED",
      bookmarked: bookmarkedIds.has(row.id),
      inputShape: firstParam ? (SHAPE_OF[firstParam] ?? null) : null,
    });
  }

  return [...groups.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ pattern, problems }) => ({ pattern, problems }));
}
