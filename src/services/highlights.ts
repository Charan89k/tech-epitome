import "server-only";

import { prisma } from "@/lib/db";
import {
  anchorsOverlap,
  HIGHLIGHT_LIMITS,
  validateAnchor,
  type HighlightAnchor,
  type HighlightColor,
  type Highlightable,
} from "@/lib/highlights/types";
import { chapterHref } from "@/lib/tracks";

/**
 * Highlights.
 *
 * Same ownership discipline as notes and bookmarks: every query and every
 * write carries the session's user id, none of them accepts one from the
 * client, and a write scoped to somebody else's row is a no-op returning
 * false rather than an error that would confirm the row exists.
 *
 * What is specific here is anchoring. A highlight points into rendered
 * text by offset, so it can be invalidated by an edit to the content
 * behind it. `quote` is stored for exactly that: the browser compares it
 * against the text at those offsets and shows a stale highlight as stale
 * rather than marking an unrelated sentence.
 */

export type HighlightRow = {
  id: string;
  entityType: Highlightable;
  entityId: string;
  blockIndex: number;
  startOffset: number;
  endOffset: number;
  quote: string;
  color: HighlightColor;
  createdAt: Date;
};

/** A highlight with enough context to show it outside its own page. */
export type HighlightItem = HighlightRow & {
  title: string;
  subtitle: string | null;
  href: string;
  /** False when the content behind it has been unpublished or removed. */
  resolved: boolean;
};

export type CreateResult =
  | { ok: true; highlight: HighlightRow; deduplicated: boolean }
  | {
      ok: false;
      reason:
        | "invalid-anchor"
        | "unknown-target"
        | "overlaps"
        | "limit-reached";
    };

/**
 * Confirms the target exists and is published.
 *
 * Shared shape with `annotatableExists` in services/library.ts but a
 * narrower set: only chapters and problems render the block document a
 * highlight anchors into. A pattern page is prose in a bespoke layout
 * with no block indices, so a highlight there would have nothing to
 * attach to.
 */
export async function highlightableExists(
  entityType: Highlightable,
  entityId: string
): Promise<boolean> {
  const where = { id: entityId, status: "PUBLISHED" as const };
  switch (entityType) {
    case "CHAPTER":
      return (await prisma.chapter.count({ where })) > 0;
    case "PROBLEM":
      return (await prisma.problem.count({ where })) > 0;
  }
}

function toRow(row: {
  id: string;
  entityType: string;
  entityId: string;
  blockIndex: number;
  startOffset: number;
  endOffset: number;
  quote: string;
  color: string;
  createdAt: Date;
}): HighlightRow {
  return {
    id: row.id,
    entityType: row.entityType as Highlightable,
    entityId: row.entityId,
    blockIndex: row.blockIndex,
    startOffset: row.startOffset,
    endOffset: row.endOffset,
    quote: row.quote,
    color: row.color as HighlightColor,
    createdAt: row.createdAt,
  };
}

const SELECT = {
  id: true,
  entityType: true,
  entityId: true,
  blockIndex: true,
  startOffset: true,
  endOffset: true,
  quote: true,
  color: true,
  createdAt: true,
} as const;

/** This learner's highlights on one piece of content, in reading order. */
export async function listHighlightsFor(params: {
  userId: string;
  entityType: Highlightable;
  entityId: string;
}): Promise<HighlightRow[]> {
  const rows = await prisma.highlight.findMany({
    where: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
    },
    orderBy: [{ blockIndex: "asc" }, { startOffset: "asc" }],
    select: SELECT,
  });
  return rows.map(toRow);
}

/**
 * Creates one, refusing anything incoherent.
 *
 * Duplicates are not an error: re-highlighting the exact same span
 * returns the existing row with `deduplicated: true`, because a double
 * click should be idempotent rather than a failure the learner has to
 * read. A *partial* overlap is refused, though — stacking marks produces
 * a colour nobody chose and an anchor nobody can reason about.
 */
export async function createHighlight(params: {
  userId: string;
  entityType: Highlightable;
  entityId: string;
  anchor: HighlightAnchor;
  color: HighlightColor;
}): Promise<CreateResult> {
  const valid = validateAnchor(params.anchor);
  if (!valid.ok) return { ok: false, reason: "invalid-anchor" };

  if (!(await highlightableExists(params.entityType, params.entityId))) {
    return { ok: false, reason: "unknown-target" };
  }

  const existing = await listHighlightsFor(params);

  if (existing.length >= HIGHLIGHT_LIMITS.maxPerEntity) {
    return { ok: false, reason: "limit-reached" };
  }

  for (const row of existing) {
    if (
      row.blockIndex === params.anchor.blockIndex &&
      row.startOffset === params.anchor.startOffset &&
      row.endOffset === params.anchor.endOffset
    ) {
      return { ok: true, highlight: row, deduplicated: true };
    }
    if (anchorsOverlap(row, params.anchor)) {
      return { ok: false, reason: "overlaps" };
    }
  }

  const created = await prisma.highlight.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      blockIndex: params.anchor.blockIndex,
      startOffset: params.anchor.startOffset,
      endOffset: params.anchor.endOffset,
      quote: params.anchor.quote,
      color: params.color,
    },
    select: SELECT,
  });

  return { ok: true, highlight: toRow(created), deduplicated: false };
}

/** Deletes one. Scoped, so another learner's id deletes nothing. */
export async function deleteHighlight(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await prisma.highlight.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

/** Recolours one. Scoped the same way. */
export async function recolourHighlight(params: {
  id: string;
  userId: string;
  color: HighlightColor;
}): Promise<boolean> {
  const result = await prisma.highlight.updateMany({
    where: { id: params.id, userId: params.userId },
    data: { color: params.color },
  });
  return result.count > 0;
}

/**
 * Every highlight this learner holds, with a title and a link back.
 *
 * Resolved in two batched queries rather than one per row. Anything whose
 * content has since been unpublished comes back `resolved: false` and is
 * rendered as unavailable — deleting it silently would throw away
 * something the learner wrote against content that might come back.
 */
export async function listHighlights(
  userId: string,
  query?: string
): Promise<HighlightItem[]> {
  const needle = query?.trim();

  const rows = await prisma.highlight.findMany({
    where: {
      userId,
      ...(needle
        ? { quote: { contains: needle, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: SELECT,
  });

  if (rows.length === 0) return [];

  const chapterIds = rows
    .filter((row) => row.entityType === "CHAPTER")
    .map((row) => row.entityId);
  const problemIds = rows
    .filter((row) => row.entityType === "PROBLEM")
    .map((row) => row.entityId);

  const chapters = chapterIds.length
    ? await prisma.chapter.findMany({
        where: { id: { in: chapterIds }, status: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          section: {
            select: {
              slug: true,
              title: true,
              course: { select: { slug: true, track: true } },
            },
          },
        },
      })
    : [];

  const problems = problemIds.length
    ? await prisma.problem.findMany({
        where: { id: { in: problemIds }, status: "PUBLISHED" },
        select: { id: true, slug: true, title: true, number: true },
      })
    : [];

  const resolved = new Map<
    string,
    { title: string; subtitle: string | null; href: string }
  >();

  for (const chapter of chapters) {
    resolved.set(`CHAPTER:${chapter.id}`, {
      title: chapter.title,
      subtitle: chapter.section.title,
      href: chapterHref(
        chapter.section.course.track,
        chapter.section.course.slug,
        chapter.section.slug,
        chapter.slug
      ),
    });
  }

  for (const problem of problems) {
    resolved.set(`PROBLEM:${problem.id}`, {
      title: problem.title,
      subtitle: `Problem #${problem.number}`,
      href: `/problems/${problem.slug}`,
    });
  }

  return rows.map((row) => {
    const context = resolved.get(`${row.entityType}:${row.entityId}`);
    return {
      ...toRow(row),
      title: context?.title ?? "Unavailable",
      subtitle:
        context?.subtitle ?? "This content is no longer published.",
      href: context?.href ?? "/dashboard/highlights",
      resolved: context !== undefined,
    };
  });
}

/** How many this learner holds. For the library's counts. */
export async function countHighlights(userId: string): Promise<number> {
  return prisma.highlight.count({ where: { userId } });
}
