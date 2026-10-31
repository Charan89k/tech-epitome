"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { InstitutionError, requireMemberOrThrow } from "@/lib/tenancy/context";
import {
  applyRoster,
  previewRoster,
  ROSTER_LIMITS,
  type RosterPreview,
} from "@/services/roster-import";

/**
 * Roster import. The institution comes from the slug resolved against the
 * session (never an id from the client), the text is size-checked here and
 * fully re-validated by the service, and apply never trusts a preview.
 */

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);
const textSchema = z.string().min(1).max(ROSTER_LIMITS.maxBytes);

export type RosterOutcome =
  { ok: true; result: RosterPreview } | { ok: false; error: string };

async function run(
  slug: string,
  text: string,
  work: typeof previewRoster
): Promise<RosterOutcome> {
  const safeSlug = slugSchema.parse(slug);
  const ctx = await requireMemberOrThrow(safeSlug, "members.invite");
  const parsed = textSchema.safeParse(text);
  if (!parsed.success)
    return { ok: false, error: "Paste or choose a CSV file under 100 KB." };
  try {
    return { ok: true, result: await work(ctx, parsed.data) };
  } catch (error) {
    if (error instanceof InstitutionError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function previewRosterAction(slug: string, text: string) {
  return run(slug, text, previewRoster);
}

export async function applyRosterAction(slug: string, text: string) {
  const outcome = await run(slug, text, applyRoster);
  revalidatePath(`/campus/${slug}`);
  return outcome;
}
