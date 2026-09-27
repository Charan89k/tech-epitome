import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { Track } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { chapterHref, courseHref } from "@/lib/tracks";
import { toPrefixQuery } from "./query";

/**
 * Global search.
 *
 * Backed by the Postgres `tsvector` columns and their GIN indexes, with the
 * weighting set up in the search-triggers migration: a hit in a title
 * outranks one buried in a lesson body.
 *
 * This is deliberately an interface with a Postgres implementation rather
 * than a direct query. Full-text search in the primary database is the right
 * call at this size — one datastore, no sync lag, no extra operational
 * surface — but it will stop being the right call, and when that day comes
 * the swap should be one class, not a grep.
 */

export type SearchResultType =
  | "course"
  | "chapter"
  | "pattern"
  | "problem";

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  description: string;
  href: string;
  /** Postgres ts_rank, used only for ordering. */
  rank: number;
};

export { toPrefixQuery };

export interface SearchService {
  search(query: string, limit?: number): Promise<SearchResult[]>;
}

class PostgresSearchService implements SearchService {
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const tsquery = toPrefixQuery(query);
    if (!tsquery) return [];

    const perType = Math.max(3, Math.ceil(limit / 3));

    // One round trip per entity type, in parallel. A single UNION would be
    // one query but would have to erase the per-type columns; four small
    // index-backed queries are simpler to read and just as fast.
    const [chapters, patterns, problems, courses] = await Promise.all([
      prisma.$queryRaw<
        { id: string; title: string; summary: string | null; slug: string; section_slug: string; course_slug: string; track: Track; rank: number }[]
      >(Prisma.sql`
        SELECT c.id, c.title, c.summary, c.slug,
               s.slug AS section_slug, co.slug AS course_slug, co.track AS track,
               ts_rank(c."searchVector", to_tsquery('english', ${tsquery})) AS rank
        FROM chapters c
        JOIN course_sections s ON s.id = c."sectionId"
        JOIN courses co ON co.id = s."courseId"
        WHERE c."searchVector" @@ to_tsquery('english', ${tsquery})
          AND c.status = 'PUBLISHED'
          AND s.status = 'PUBLISHED'
          AND co.status = 'PUBLISHED'
        ORDER BY rank DESC
        LIMIT ${perType}
      `),

      prisma.$queryRaw<
        { id: string; name: string; tagline: string; slug: string; rank: number }[]
      >(Prisma.sql`
        SELECT id, name, tagline, slug,
               ts_rank("searchVector", to_tsquery('english', ${tsquery})) AS rank
        FROM patterns
        WHERE "searchVector" @@ to_tsquery('english', ${tsquery})
          AND status = 'PUBLISHED'
        ORDER BY rank DESC
        LIMIT ${perType}
      `),

      prisma.$queryRaw<
        { id: string; title: string; slug: string; number: number; difficulty: string; rank: number }[]
      >(Prisma.sql`
        SELECT id, title, slug, number, difficulty,
               ts_rank("searchVector", to_tsquery('english', ${tsquery})) AS rank
        FROM problems
        WHERE "searchVector" @@ to_tsquery('english', ${tsquery})
          AND status = 'PUBLISHED'
        ORDER BY rank DESC
        LIMIT ${perType}
      `),

      // Courses have no tsvector column - there are only a handful, so a
      // plain case-insensitive match is both sufficient and cheaper than
      // maintaining another index.
      prisma.course.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { subtitle: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 3,
        select: { id: true, slug: true, title: true, subtitle: true, track: true },
      }),
    ]);

    const results: SearchResult[] = [
      ...courses.map((course) => ({
        type: "course" as const,
        id: course.id,
        title: course.title,
        description: course.subtitle ?? "Course",
        href: courseHref(course.track, course.slug),
        // Courses are few and exact-matched, so they are ranked just above
        // a typical text hit rather than competing on ts_rank.
        rank: 0.5,
      })),
      ...chapters.map((chapter) => ({
        type: "chapter" as const,
        id: chapter.id,
        title: chapter.title,
        description: chapter.summary ?? "Chapter",
        href: chapterHref(
          chapter.track,
          chapter.course_slug,
          chapter.section_slug,
          chapter.slug
        ),
        rank: Number(chapter.rank),
      })),
      ...patterns.map((pattern) => ({
        type: "pattern" as const,
        id: pattern.id,
        title: pattern.name,
        description: pattern.tagline,
        href: `/patterns/${pattern.slug}`,
        rank: Number(pattern.rank),
      })),
      ...problems.map((problem) => ({
        type: "problem" as const,
        id: problem.id,
        title: problem.title,
        description: `Problem #${problem.number} · ${problem.difficulty.toLowerCase()}`,
        href: `/problems/${problem.slug}`,
        rank: Number(problem.rank),
      })),
    ];

    return results.sort((a, b) => b.rank - a.rank).slice(0, limit);
  }
}

let service: SearchService = new PostgresSearchService();

export function getSearchService(): SearchService {
  return service;
}

/** Test seam, and the swap point for a dedicated search engine later. */
export function setSearchService(next: SearchService): void {
  service = next;
}
