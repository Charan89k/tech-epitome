import "server-only";

import type { EntityType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { chapterHref } from "@/lib/tracks";

/**
 * Bookmarks and notes.
 *
 * Both are polymorphic over (entityType, entityId), so resolving them to
 * something displayable means one query per entity type rather than a join.
 * That is the cost of the unified model, and it is paid here, once, instead
 * of by every page that wants to show a saved item.
 */

export type LibraryItem = {
  id: string;
  entityType: EntityType;
  entityId: string;
  title: string;
  subtitle: string | null;
  href: string;
  createdAt: Date;
  /** Null when the underlying content has since been unpublished. */
  resolved: boolean;
};

/**
 * Turns (entityType, entityId) pairs into titles and links.
 *
 * Unresolvable references are kept and marked rather than silently dropped:
 * a bookmark pointing at unpublished content should say so, not vanish and
 * leave the learner wondering where it went.
 */
export async function resolveEntities(
  refs: { entityType: EntityType; entityId: string }[]
): Promise<Map<string, { title: string; subtitle: string | null; href: string }>> {
  const byType = new Map<EntityType, string[]>();
  for (const ref of refs) {
    const list = byType.get(ref.entityType) ?? [];
    list.push(ref.entityId);
    byType.set(ref.entityType, list);
  }

  const resolved = new Map<
    string,
    { title: string; subtitle: string | null; href: string }
  >();
  const key = (type: EntityType, id: string) => `${type}:${id}`;

  const problemIds = byType.get("PROBLEM");
  if (problemIds?.length) {
    const rows = await prisma.problem.findMany({
      where: { id: { in: problemIds }, status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, number: true, difficulty: true },
    });
    for (const row of rows) {
      resolved.set(key("PROBLEM", row.id), {
        title: row.title,
        subtitle: `Problem #${row.number} · ${row.difficulty.toLowerCase()}`,
        href: `/problems/${row.slug}`,
      });
    }
  }

  const chapterIds = byType.get("CHAPTER");
  if (chapterIds?.length) {
    const rows = await prisma.chapter.findMany({
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
    });
    for (const row of rows) {
      resolved.set(key("CHAPTER", row.id), {
        title: row.title,
        subtitle: row.section.title,
        href: chapterHref(
          row.section.course.track,
          row.section.course.slug,
          row.section.slug,
          row.slug
        ),
      });
    }
  }

  const patternIds = byType.get("PATTERN");
  if (patternIds?.length) {
    const rows = await prisma.pattern.findMany({
      where: { id: { in: patternIds }, status: "PUBLISHED" },
      select: { id: true, slug: true, name: true, tagline: true },
    });
    for (const row of rows) {
      resolved.set(key("PATTERN", row.id), {
        title: row.name,
        subtitle: row.tagline,
        href: `/patterns/${row.slug}`,
      });
    }
  }

  return resolved;
}

export async function listBookmarks(userId: string): Promise<LibraryItem[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, entityType: true, entityId: true, createdAt: true },
  });

  const resolved = await resolveEntities(bookmarks);

  return bookmarks.map((bookmark) => {
    const info = resolved.get(`${bookmark.entityType}:${bookmark.entityId}`);
    return {
      id: bookmark.id,
      entityType: bookmark.entityType,
      entityId: bookmark.entityId,
      title: info?.title ?? "Unavailable",
      subtitle: info?.subtitle ?? "This content is no longer published",
      href: info?.href ?? "/dashboard/bookmarks",
      createdAt: bookmark.createdAt,
      resolved: Boolean(info),
    };
  });
}

export type NoteItem = LibraryItem & { body: string; updatedAt: Date };

export async function listNotes(
  userId: string,
  search?: string
): Promise<NoteItem[]> {
  const notes = await prisma.note.findMany({
    where: {
      userId,
      // Postgres full-text search is available via the tsvector column, but
      // a substring match is the right behaviour for a personal note list:
      // people search their notes for a fragment they remember typing, not
      // for a stemmed term.
      ...(search?.trim()
        ? { body: { contains: search.trim(), mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const resolved = await resolveEntities(notes);

  return notes.map((note) => {
    const info = resolved.get(`${note.entityType}:${note.entityId}`);
    return {
      id: note.id,
      entityType: note.entityType,
      entityId: note.entityId,
      title: info?.title ?? "Unavailable",
      subtitle: info?.subtitle ?? "This content is no longer published",
      href: info?.href ?? "/dashboard/notes",
      body: note.body,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      resolved: Boolean(info),
    };
  });
}
