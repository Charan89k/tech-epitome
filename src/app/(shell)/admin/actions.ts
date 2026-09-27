"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Role, ContentStatus } from "@/generated/prisma/enums";
import { requireAdminOrThrow } from "@/lib/auth/session";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { setContentStatus, setUserRole, type ContentKind } from "@/services/admin";

/**
 * Admin mutations.
 *
 * Every one of them starts with `requireAdminOrThrow`. The layout already
 * guards the pages, but a server action is an endpoint: it can be invoked
 * by anyone who knows its id, with no page render in front of it. A layout
 * check is not an action check.
 *
 * `services/admin.ts` writes the audit row in the same transaction as the
 * change, so there is no ordering in which a mutation lands unrecorded.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const CONTENT_KINDS = [
  "problem",
  "chapter",
  "systemDesign",
  "lld",
  "behavioral",
  "prepTrack",
] as const satisfies readonly ContentKind[];

const roleSchema = z.object({
  userId: z.string().min(1).max(64),
  role: z.nativeEnum(Role),
});

export async function setUserRoleAction(raw: unknown): Promise<ActionResult> {
  const admin = await requireAdminOrThrow();

  const parsed = roleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const limited = await rateLimit(`admin-role:${admin.id}`, RATE_LIMITS.CODE_SUBMIT);
  if (!limited.success) {
    return { ok: false, error: "Too many changes at once. Try again shortly." };
  }

  const result = await setUserRole({
    actor: { id: admin.id, email: admin.email },
    userId: parsed.data.userId,
    role: parsed.data.role,
  });

  if (!result.ok) return { ok: false, error: result.reason };

  revalidatePath("/admin/users");
  revalidatePath("/admin/audit");
  return { ok: true };
}

const contentSchema = z.object({
  kind: z.enum(CONTENT_KINDS),
  id: z.string().min(1).max(64),
  status: z.nativeEnum(ContentStatus),
});

export async function setContentStatusAction(
  raw: unknown
): Promise<ActionResult> {
  const admin = await requireAdminOrThrow();

  const parsed = contentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const limited = await rateLimit(
    `admin-content:${admin.id}`,
    RATE_LIMITS.CODE_SUBMIT
  );
  if (!limited.success) {
    return { ok: false, error: "Too many changes at once. Try again shortly." };
  }

  const result = await setContentStatus({
    actor: { id: admin.id, email: admin.email },
    kind: parsed.data.kind,
    id: parsed.data.id,
    status: parsed.data.status,
  });

  if (!result.ok) return { ok: false, error: result.reason };

  revalidatePath("/admin/content");
  revalidatePath("/admin/audit");
  // The change is to what learners can see, so the learner-facing routes
  // have to drop their cache too.
  revalidatePath("/problems");
  revalidatePath("/system-design");
  revalidatePath("/lld");
  revalidatePath("/prepare");
  return { ok: true };
}
