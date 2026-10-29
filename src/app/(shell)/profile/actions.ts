"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserOrThrow } from "@/lib/auth/session";
import { createShareLink, revokeShareLinks, ShareLimitError } from "@/services/sharing";

/**
 * Share-link mutations. The token comes back exactly once, to the learner
 * who made it; only its hash is stored.
 */

const nameSchema = z
  .string()
  .trim()
  .max(60)
  .regex(/^[\p{L}\p{N} .'-]*$/u)
  .transform((v) => (v ? v : null));

export async function createShareLinkAction(
  displayName: string
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const user = await requireUserOrThrow();
  const parsed = nameSchema.safeParse(displayName);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Use letters, numbers, spaces and . ' - only (60 at most).",
    };
  }
  try {
    const token = await createShareLink(user.id, parsed.data);
    revalidatePath("/profile");
    return { ok: true, token };
  } catch (error) {
    if (error instanceof ShareLimitError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function revokeShareLinkAction(): Promise<void> {
  const user = await requireUserOrThrow();
  await revokeShareLinks(user.id);
  revalidatePath("/profile");
}
