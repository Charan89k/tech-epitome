"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { OneTimeLinkState } from "@/components/campus/invite-form";
import { InstitutionRole, MembershipStatus } from "@/generated/prisma/enums";
import { requireUserOrThrow } from "@/lib/auth/session";
import { site } from "@/lib/site";
import { InstitutionError, requireMemberOrThrow } from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import {
  confirmEmailVerification,
  requestEmailVerification,
} from "@/services/email-verification";
import {
  acceptInvitation,
  changeMemberRole,
  enrollByEmailDomain,
  inviteMember,
  leaveInstitution,
  revokeInvitation,
  setMembershipStatus,
} from "@/services/institutions";

/**
 * Campus mutations. Each one is a public endpoint, so each starts from the
 * session (`requireUserOrThrow` / `requireMemberOrThrow`), validates its
 * input, and leaves the permission decision to the service, which checks
 * again. Outcomes come back as a fixed message code in the URL, never as
 * text taken from the request.
 */

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/);
const idSchema = z.string().min(1).max(64);
const tokenSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

function codeFor(error: unknown): string {
  if (error instanceof InstitutionError) return error.code;
  throw error;
}

function back(path: string, msg: string): never {
  redirect(route(`${path}?msg=${encodeURIComponent(msg)}`));
}

export async function requestVerificationAction(): Promise<void> {
  const user = await requireUserOrThrow();
  const result = await requestEmailVerification(user);
  back("/campus", `verify_${result.status}`);
}

export async function confirmVerificationAction(token: string): Promise<void> {
  const user = await requireUserOrThrow();
  const parsed = tokenSchema.safeParse(token);
  const ok = parsed.success && (await confirmEmailVerification(user, parsed.data));
  back("/campus", ok ? "verified" : "verify_failed");
}

export async function joinByDomainAction(): Promise<void> {
  const user = await requireUserOrThrow();
  let joined: { slug: string } | null = null;
  try {
    joined = await enrollByEmailDomain(user);
  } catch (error) {
    back("/campus", `join_${codeFor(error)}`);
  }
  if (!joined) back("/campus", "join_no_match");
  back(`/campus/${joined.slug}`, "joined");
}

export async function acceptInvitationAction(token: string): Promise<void> {
  const user = await requireUserOrThrow();
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) back("/campus", "invite_not_found");
  let slug = "";
  try {
    ({ slug } = await acceptInvitation(user, parsed.data));
  } catch (error) {
    back("/campus", `invite_${codeFor(error)}`);
  }
  back(`/campus/${slug}`, "joined");
}

const inviteSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.nativeEnum(InstitutionRole),
});

export async function inviteAction(
  slug: string,
  _state: OneTimeLinkState,
  form: FormData
): Promise<OneTimeLinkState> {
  const safeSlug = slugSchema.parse(slug);
  const ctx = await requireMemberOrThrow(safeSlug, "members.invite");
  const parsed = inviteSchema.safeParse({
    email: form.get("email"),
    role: form.get("role"),
  });
  if (!parsed.success) back(`/campus/${safeSlug}`, "invalid");
  let undelivered: string | undefined;
  try {
    ({ undeliveredToken: undelivered } = await inviteMember(ctx, parsed.data));
  } catch (error) {
    back(`/campus/${safeSlug}`, codeFor(error));
  }
  revalidatePath(`/campus/${safeSlug}`);
  if (!undelivered) back(`/campus/${safeSlug}`, "invited");
  return {
    link: new URL(`/campus/invite/${undelivered}`, site.url).toString(),
    label: `Invitation for ${parsed.data.email}. It works only for that address.`,
  };
}

export async function revokeInvitationAction(
  slug: string,
  invitationId: string
): Promise<void> {
  const safeSlug = slugSchema.parse(slug);
  const ctx = await requireMemberOrThrow(safeSlug, "members.invite");
  try {
    await revokeInvitation(ctx, idSchema.parse(invitationId));
  } catch (error) {
    back(`/campus/${safeSlug}`, codeFor(error));
  }
  revalidatePath(`/campus/${safeSlug}`);
  back(`/campus/${safeSlug}`, "saved");
}

export async function changeRoleAction(
  slug: string,
  membershipId: string,
  form: FormData
): Promise<void> {
  const safeSlug = slugSchema.parse(slug);
  const ctx = await requireMemberOrThrow(safeSlug, "members.manage");
  const role = z.nativeEnum(InstitutionRole).safeParse(form.get("role"));
  if (!role.success) back(`/campus/${safeSlug}`, "invalid");
  try {
    await changeMemberRole(ctx, idSchema.parse(membershipId), role.data);
  } catch (error) {
    back(`/campus/${safeSlug}`, codeFor(error));
  }
  revalidatePath(`/campus/${safeSlug}`);
  back(`/campus/${safeSlug}`, "saved");
}

export async function setStatusAction(
  slug: string,
  membershipId: string,
  status: string
): Promise<void> {
  const safeSlug = slugSchema.parse(slug);
  const ctx = await requireMemberOrThrow(safeSlug, "members.manage");
  const parsed = z.nativeEnum(MembershipStatus).safeParse(status);
  if (!parsed.success) back(`/campus/${safeSlug}`, "invalid");
  try {
    await setMembershipStatus(ctx, idSchema.parse(membershipId), parsed.data);
  } catch (error) {
    back(`/campus/${safeSlug}`, codeFor(error));
  }
  revalidatePath(`/campus/${safeSlug}`);
  back(`/campus/${safeSlug}`, "saved");
}

export async function leaveAction(slug: string): Promise<void> {
  const safeSlug = slugSchema.parse(slug);
  const ctx = await requireMemberOrThrow(safeSlug);
  try {
    await leaveInstitution(ctx);
  } catch (error) {
    back(`/campus/${safeSlug}`, codeFor(error));
  }
  back("/campus", "left");
}
