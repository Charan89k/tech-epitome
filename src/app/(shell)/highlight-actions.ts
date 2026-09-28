"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserOrThrow } from "@/lib/auth/session";
import {
  HIGHLIGHTABLE,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_LIMITS,
} from "@/lib/highlights/types";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import {
  createHighlight,
  deleteHighlight,
  recolourHighlight,
  repairHighlightAnchors,
  type HighlightRow,
} from "@/services/highlights";

/**
 * Highlight mutations.
 *
 * Every one authenticates first and takes the user id from the session,
 * never from the payload. The anchor is validated against the same
 * limits the browser uses — `src/lib/highlights/types.ts` is imported by
 * both, so the client cannot be lenient where the server is strict.
 *
 * Rate limited because a highlight is the cheapest row in the product to
 * create and the easiest to create in a loop.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const anchorSchema = z.object({
  entityType: z.enum(HIGHLIGHTABLE),
  entityId: z.string().min(1).max(64),
  blockIndex: z.number().int().min(0).max(HIGHLIGHT_LIMITS.maxBlockIndex),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(1),
  // Bounded before the service sees it, so an oversized payload is
  // rejected by the parser rather than after a database round trip.
  quote: z.string().min(1).max(HIGHLIGHT_LIMITS.maxLength),
  color: z.enum(HIGHLIGHT_COLORS),
});

const idSchema = z.string().min(1).max(64);

/** The reason, in the learner's words rather than the model's. */
const REASONS = {
  "invalid-anchor": "That selection could not be saved.",
  "unknown-target": "That content is no longer available.",
  overlaps: "That overlaps a highlight you already have.",
  "limit-reached": `You have reached ${HIGHLIGHT_LIMITS.maxPerEntity} highlights on this page.`,
} as const;

export async function createHighlightAction(
  raw: unknown
): Promise<ActionResult<{ highlight: HighlightRow }>> {
  const user = await requireUserOrThrow();

  const parsed = anchorSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That selection could not be saved." };
  }

  const limited = await rateLimit(`highlight:${user.id}`, RATE_LIMITS.CODE_SUBMIT);
  if (!limited.success) return { ok: false, error: "Slow down a moment." };

  const { entityType, entityId, color, ...anchor } = parsed.data;

  const result = await createHighlight({
    userId: user.id,
    entityType,
    entityId,
    anchor,
    color,
  });

  if (!result.ok) return { ok: false, error: REASONS[result.reason] };

  revalidatePath("/dashboard/highlights");
  return { ok: true, data: { highlight: result.highlight } };
}

export async function deleteHighlightAction(
  raw: unknown
): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  // Scoped delete: another learner's id removes nothing and reports the
  // same thing a missing row would.
  const deleted = await deleteHighlight(parsed.data, user.id);
  if (!deleted) return { ok: false, error: "That highlight no longer exists." };

  revalidatePath("/dashboard/highlights");
  return { ok: true, data: undefined };
}

const recolourSchema = z.object({
  id: idSchema,
  color: z.enum(HIGHLIGHT_COLORS),
});

export async function recolourHighlightAction(
  raw: unknown
): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  const parsed = recolourSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const changed = await recolourHighlight({
    id: parsed.data.id,
    userId: user.id,
    color: parsed.data.color,
  });
  if (!changed) return { ok: false, error: "That highlight no longer exists." };

  revalidatePath("/dashboard/highlights");
  return { ok: true, data: undefined };
}


/**
 * Persists anchors the reader repaired after content moved.
 *
 * The repair itself is decided in the browser, against the text actually
 * rendered — but it is only ever *stored* here, owner-scoped, with the same
 * bounds the create path enforces. The client cannot send a new quote, so
 * the worst a forged payload achieves is moving the caller's own highlight
 * within their own page, which they can already do by re-highlighting.
 *
 * Rate limited on the same bucket as creation: a page load repairs at most
 * a handful of rows, and anything beyond that is a loop.
 */
const repairSchema = z.object({
  repairs: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        blockIndex: z.number().int().min(0).max(HIGHLIGHT_LIMITS.maxBlockIndex),
        startOffset: z.number().int().min(0),
        endOffset: z.number().int().min(0),
      })
    )
    .min(1)
    .max(50),
});

export async function repairHighlightAnchorsAction(
  raw: unknown
): Promise<ActionResult<{ repaired: number }>> {
  const user = await requireUserOrThrow();

  const parsed = repairSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  // An anchor that ends before it starts is not a selection.
  if (parsed.data.repairs.some((r) => r.endOffset <= r.startOffset)) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const limited = await rateLimit(`highlight-repair:${user.id}`, RATE_LIMITS.CODE_SUBMIT);
  if (!limited.success) {
    return { ok: false, error: "Too many updates. Try again shortly." };
  }

  const repaired = await repairHighlightAnchors({
    userId: user.id,
    repairs: parsed.data.repairs,
  });

  return { ok: true, data: { repaired } };
}
