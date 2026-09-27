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

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * The entity types a learner may annotate.
 *
 * A closed subset of `EntityType`, because `resolveEntities` only knows
 * how to turn these three back into a title and a link. A bookmark on a
 * type it cannot resolve renders as "unavailable" forever, which is a
 * worse outcome than refusing to create it.
 */
export const ANNOTATABLE = ["PROBLEM", "CHAPTER", "PATTERN"] as const;
export type Annotatable = (typeof ANNOTATABLE)[number];

/**
 * Confirms the target exists and is published.
 *
 * Without this, a bookmark or note is a row keyed on an arbitrary string
 * the client supplied — which is not a security hole, since everything is
 * scoped to the owner, but it does let a client fill the table with
 * references to nothing.
 */
export async function annotatableExists(
  entityType: Annotatable,
  entityId: string
): Promise<boolean> {
  const where = { id: entityId, status: "PUBLISHED" as const };
  switch (entityType) {
    case "PROBLEM":
      return (await prisma.problem.count({ where })) > 0;
    case "CHAPTER":
      return (await prisma.chapter.count({ where })) > 0;
    case "PATTERN":
      return (await prisma.pattern.count({ where })) > 0;
  }
}

export async function isBookmarked(params: {
  userId: string;
  entityType: Annotatable;
  entityId: string;
}): Promise<boolean> {
  const row = await prisma.bookmark.findUnique({
    where: {
      userId_entityType_entityId: {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
      },
    },
    select: { id: true },
  });
  return row !== null;
}

/** The learner's note on one thing, if they have written one. */
export async function getNoteFor(params: {
  userId: string;
  entityType: Annotatable;
  entityId: string;
}): Promise<{ id: string; body: string; updatedAt: Date } | null> {
  return prisma.note.findFirst({
    where: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, body: true, updatedAt: true },
  });
}

/**
 * Creates, updates or deletes the learner's note on one thing.
 *
 * One note per learner per entity, which is the shape the reader UI
 * wants: a margin note, not a thread. An empty body deletes rather than
 * storing a blank row, so clearing the box and saving is the delete
 * gesture and there is no separate button for it.
 */
export async function upsertNote(params: {
  userId: string;
  entityType: Annotatable;
  entityId: string;
  body: string;
}): Promise<{ id: string; body: string; updatedAt: Date } | null> {
  const body = params.body.trim();
  const existing = await getNoteFor(params);

  if (body.length === 0) {
    if (existing) {
      await prisma.note.deleteMany({
        where: { id: existing.id, userId: params.userId },
      });
    }
    return null;
  }

  if (existing) {
    const row = await prisma.note.update({
      where: { id: existing.id },
      data: { body },
      select: { id: true, body: true, updatedAt: true },
    });
    return row;
  }

  return prisma.note.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      body,
    },
    select: { id: true, body: true, updatedAt: true },
  });
}

/** Deletes one note by id, scoped. Used by the notes list page. */
export async function deleteNote(id: string, userId: string): Promise<boolean> {
  const result = await prisma.note.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

/**
 * Adds or removes a bookmark, returning the state afterwards.
 *
 * The unique constraint is `(userId, entityType, entityId)`, so a double
 * click races to the same row rather than creating two.
 */
export async function toggleBookmark(params: {
  userId: string;
  entityType: Annotatable;
  entityId: string;
}): Promise<boolean> {
  const where = {
    userId_entityType_entityId: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
    },
  };

  const existing = await prisma.bookmark.findUnique({
    where,
    select: { id: true },
  });

  if (existing) {
    await prisma.bookmark.deleteMany({
      where: { id: existing.id, userId: params.userId },
    });
    return false;
  }

  await prisma.bookmark.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
    },
  });
  return true;
}
