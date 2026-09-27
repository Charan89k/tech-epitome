"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Language } from "@/generated/prisma/enums";
import { recordEvent } from "@/lib/analytics";
import { requireUserOrThrow } from "@/lib/auth/session";
import { classDiagramSchema } from "@/lib/class-diagram/schema";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { revealLLDHint, saveLLDDesign, submitLLDDesign } from "@/services/lld";

/**
 * LLD workspace mutations.
 *
 * Same contract as the system-design and problem actions: authenticate,
 * validate, rate limit, and never trust a shape that arrived from the
 * browser. The class diagram goes through the same schema that validates
 * a seeded reference design, so there is one definition of "a valid
 * class diagram" for both.
 *
 * Note what is absent from every input schema below: a user id. The
 * caller cannot name whose submission to write; that comes from the
 * session and nowhere else.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const saveSchema = z.object({
  slug: z.string().min(1).max(160),
  classDiagram: classDiagramSchema,
  // Bounded for the same reason a submission is: an implementation
  // sketch is a few classes, not a repository.
  code: z.string().max(60_000),
  language: z.nativeEnum(Language),
  rationale: z.string().max(10_000),
});

export async function saveLLDAction(raw: unknown): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "That design was not in the expected shape.",
    };
  }

  // Autosave fires on edit, so this is the highest-frequency write here.
  // Reusing the review-grade policy: generous enough that a working
  // session never notices, tight enough to stop a runaway loop.
  const limited = await rateLimit(`lld:${user.id}`, RATE_LIMITS.REVIEW_GRADE);
  if (!limited.success) {
    return { ok: false, error: "Saving too quickly. Pause for a moment." };
  }

  const saved = await saveLLDDesign({
    userId: user.id,
    problemSlug: parsed.data.slug,
    classDiagram: parsed.data.classDiagram,
    code: parsed.data.code,
    language: parsed.data.language,
    rationale: parsed.data.rationale,
  });

  if (!saved) return { ok: false, error: "That exercise is not available." };
  return { ok: true, data: undefined };
}

/**
 * Opens the next hint.
 *
 * The client asks for "the next one"; the server decides which that is
 * from the stored counter, so the ladder cannot be skipped by asking for
 * hint 4 directly.
 */
export async function revealLLDHintAction(
  slug: string
): Promise<ActionResult<{ index: number; body: string; remaining: number }>> {
  const user = await requireUserOrThrow();

  const limited = await rateLimit(`lld-hint:${user.id}`, RATE_LIMITS.REVIEW_GRADE);
  if (!limited.success) {
    return { ok: false, error: "Slow down a moment." };
  }

  const result = await revealLLDHint({ userId: user.id, problemSlug: slug });
  if (!result.ok) return { ok: false, error: result.reason };

  await recordEvent(user.id, "hint_opened", { slug, index: result.index });

  return {
    ok: true,
    data: { index: result.index, body: result.body, remaining: result.remaining },
  };
}

export async function submitLLDAction(
  slug: string
): Promise<ActionResult<{ submitted: true }>> {
  const user = await requireUserOrThrow();

  const result = await submitLLDDesign({ userId: user.id, problemSlug: slug });
  if (!result.ok) return { ok: false, error: result.reason };

  await recordEvent(user.id, "design_submitted", { slug, track: "LLD" });

  // The reference design becomes visible on submit, so the page must
  // re-render from the server rather than reuse a payload that still has
  // it withheld.
  revalidatePath(`/lld/${slug}`);
  revalidatePath("/lld");
  revalidatePath("/dashboard");

  return { ok: true, data: { submitted: true } };
}
