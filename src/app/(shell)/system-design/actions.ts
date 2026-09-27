"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordEvent } from "@/lib/analytics";
import { requireUserOrThrow } from "@/lib/auth/session";
import { diagramSchema } from "@/lib/diagram/schema";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { saveDesign, submitDesign } from "@/services/system-design";

/**
 * Design workspace mutations.
 *
 * Same contract as the problem workspace actions: re-authenticate,
 * re-validate, rate limit, and never trust a shape that arrived from the
 * browser. The diagram in particular is a user-writable Json column, so it
 * goes through the same schema that validates a seeded reference
 * architecture — one definition of "a valid diagram" for both.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const saveSchema = z.object({
  slug: z.string().min(1).max(160),
  diagram: diagramSchema,
  // Generous but bounded. Design rationale is a few paragraphs, not a book.
  notes: z.string().max(10_000),
});

export async function saveDesignAction(raw: unknown): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    // The message names the first problem rather than dumping the whole
    // issue list, which is unreadable and leaks schema internals.
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "That design was not in the expected shape.",
    };
  }

  // Autosave fires on edit, so this is the highest-frequency write in the
  // feature. Reusing the review-grade policy: generous enough that a brisk
  // editing session never notices, tight enough to stop a runaway loop.
  const limited = await rateLimit(`design:${user.id}`, RATE_LIMITS.REVIEW_GRADE);
  if (!limited.success) {
    return { ok: false, error: "Saving too quickly. Pause for a moment." };
  }

  const saved = await saveDesign({
    userId: user.id,
    problemSlug: parsed.data.slug,
    diagram: parsed.data.diagram,
    notes: parsed.data.notes,
  });

  if (!saved) return { ok: false, error: "That exercise is not available." };
  return { ok: true, data: undefined };
}

export async function submitDesignAction(
  slug: string
): Promise<ActionResult<{ submitted: true }>> {
  const user = await requireUserOrThrow();

  const result = await submitDesign({ userId: user.id, problemSlug: slug });
  if (!result.ok) return { ok: false, error: result.reason };

  await recordEvent(user.id, "design_submitted", { slug });

  // The reference architecture becomes visible on submit, so the page must
  // re-render from the server rather than reuse a cached payload that
  // still has it withheld.
  revalidatePath(`/system-design/${slug}`);
  revalidatePath("/system-design");
  revalidatePath("/dashboard");

  return { ok: true, data: { submitted: true } };
}
