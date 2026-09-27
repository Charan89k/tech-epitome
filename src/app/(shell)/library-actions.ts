"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserOrThrow } from "@/lib/auth/session";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import {
  ANNOTATABLE,
  annotatableExists,
  deleteNote,
  toggleBookmark,
  upsertNote,
} from "@/services/library";

/**
 * Bookmarks and notes.
 *
 * Both are per-learner rows with no sharing, so the whole security story
 * is "scoped to the caller" — every query and every write here carries
 * the session's user id, and none of them accepts one from the client.
 *
 * The target is validated for existence as well as for shape. A note
 * keyed on a string the client invented is not a leak, but it is a row
 * pointing at nothing that the library page can only render as broken.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const targetSchema = z.object({
  entityType: z.enum(ANNOTATABLE),
  entityId: z.string().min(1).max(64),
});

const noteSchema = targetSchema.extend({
  // Long enough for a real margin note, short enough that the column is
  // never a place to paste a book.
  body: z.string().max(10_000),
});

export async function toggleBookmarkAction(
  raw: unknown
): Promise<ActionResult<{ bookmarked: boolean }>> {
  const user = await requireUserOrThrow();

  const parsed = targetSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const limited = await rateLimit(`bookmark:${user.id}`, RATE_LIMITS.CODE_SUBMIT);
  if (!limited.success) {
    return { ok: false, error: "Slow down a moment." };
  }

  if (!(await annotatableExists(parsed.data.entityType, parsed.data.entityId))) {
    return { ok: false, error: "That is no longer available." };
  }

  const bookmarked = await toggleBookmark({
    userId: user.id,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
  });

  revalidatePath("/dashboard/bookmarks");
  return { ok: true, data: { bookmarked } };
}

export async function saveNoteAction(
  raw: unknown
): Promise<ActionResult<{ saved: boolean; updatedAt: string | null }>> {
  const user = await requireUserOrThrow();

  const parsed = noteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That note could not be saved." };
  }

  const limited = await rateLimit(`note:${user.id}`, RATE_LIMITS.CODE_SUBMIT);
  if (!limited.success) {
    return { ok: false, error: "Slow down a moment." };
  }

  if (!(await annotatableExists(parsed.data.entityType, parsed.data.entityId))) {
    return { ok: false, error: "That is no longer available." };
  }

  const note = await upsertNote({
    userId: user.id,
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    body: parsed.data.body,
  });

  revalidatePath("/dashboard/notes");
  return {
    ok: true,
    data: {
      // A cleared note is a delete, not a failure.
      saved: note !== null,
      updatedAt: note?.updatedAt.toISOString() ?? null,
    },
  };
}

export async function deleteNoteAction(raw: unknown): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  const parsed = z.string().min(1).max(64).safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const deleted = await deleteNote(parsed.data, user.id);
  if (!deleted) return { ok: false, error: "That note no longer exists." };

  revalidatePath("/dashboard/notes");
  return { ok: true, data: undefined };
}
