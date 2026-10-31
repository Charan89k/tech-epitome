import "server-only";

import { cache } from "react";
import { forbidden, notFound, unauthorized } from "next/navigation";

import { getCurrentUser, requireUser, type CurrentUser } from "@/lib/auth/session";
import { can, type Actor, type InstitutionPermission } from "@/lib/tenancy/permissions";
import { withTenantScope, type TenantScope } from "@/lib/tenancy/scope";
import type { InstitutionRole } from "@/generated/prisma/enums";

/**
 * Who is acting inside which institution, resolved from the session and
 * the database only. Nothing here trusts an id, role or slug from the
 * client beyond using the slug to look the institution up, and that lookup
 * runs as `te_tenant`, so a non-member cannot even learn that the slug
 * exists: it resolves to "not found", exactly like a missing institution.
 */
export type MemberContext = Actor & {
  user: Pick<CurrentUser, "id" | "email" | "name">;
  institution: { id: string; slug: string; name: string };
  /** The caller's membership row here, if they have an active one. */
  membershipId: string | null;
};

/** A refusal from the institution layer, mapped to HTTP-ish outcomes. */
export class InstitutionError extends Error {
  constructor(
    readonly code: "not_found" | "forbidden" | "invalid" | "conflict",
    message: string
  ) {
    super(message);
    this.name = "InstitutionError";
  }
}

export function scopeOf(ctx: MemberContext): TenantScope {
  return {
    institutionId: ctx.institution.id,
    userId: ctx.user.id,
    platformAdmin: ctx.platformAdmin,
  };
}

export function assertCan(ctx: MemberContext, permission: InstitutionPermission): void {
  if (!can(ctx, permission)) {
    throw new InstitutionError("forbidden", `Not allowed: ${permission}`);
  }
}

/**
 * Builds the context, or null when the user may not act here at all: no
 * such institution, no ACTIVE membership, or the institution is suspended
 * (platform admins excepted in both of the last two cases).
 */
export async function resolveMemberContext(
  user: Pick<CurrentUser, "id" | "email" | "name" | "role">,
  slug: string
): Promise<MemberContext | null> {
  const platformAdmin = user.role === "ADMIN";

  return withTenantScope(
    { institutionId: null, userId: user.id, platformAdmin },
    async (tx) => {
      // RLS shows a non-admin only institutions they actively belong to.
      const institution = await tx.institution.findUnique({
        where: { slug },
        select: { id: true, slug: true, name: true, status: true },
      });
      if (!institution) return null;

      const membership = await tx.institutionMembership.findUnique({
        where: {
          institutionId_userId: { institutionId: institution.id, userId: user.id },
        },
        select: { id: true, role: true, status: true },
      });
      const active = membership?.status === "ACTIVE" ? membership : null;

      if (!platformAdmin) {
        if (!active || institution.status !== "ACTIVE") return null;
      }

      return {
        user: { id: user.id, email: user.email, name: user.name },
        institution: {
          id: institution.id,
          slug: institution.slug,
          name: institution.name,
        },
        role: (active?.role ?? null) as InstitutionRole | null,
        membershipId: active?.id ?? null,
        platformAdmin,
      };
    }
  );
}

const resolveForRequest = cache(async (slug: string) => {
  const user = await getCurrentUser();
  if (!user) return { user: null, ctx: null };
  return { user, ctx: await resolveMemberContext(user, slug) };
});

/** For pages: login redirect, 404 for outsiders, 403 for missing rights. */
export async function requireMember(
  slug: string,
  permission: InstitutionPermission = "institution.view"
): Promise<MemberContext> {
  await requireUser(`/campus/${slug}`);
  const { ctx } = await resolveForRequest(slug);
  if (!ctx) notFound();
  if (!can(ctx, permission)) forbidden();
  return ctx;
}

/**
 * For route handlers: the context, or the Response to return instead. A
 * plain status code rather than an auth interrupt, so the handler's
 * behaviour does not depend on how the framework surfaces those.
 */
export async function memberForRoute(
  slug: string,
  permission: InstitutionPermission
): Promise<MemberContext | Response> {
  const { user, ctx } = await resolveForRequest(slug);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!ctx) return new Response("Not found", { status: 404 });
  if (!can(ctx, permission)) return new Response("Forbidden", { status: 403 });
  return ctx;
}

/** For server actions: 401 / 404 / 403, never a redirect. */
export async function requireMemberOrThrow(
  slug: string,
  permission: InstitutionPermission = "institution.view"
): Promise<MemberContext> {
  const { user, ctx } = await resolveForRequest(slug);
  if (!user) unauthorized();
  if (!ctx) notFound();
  if (!can(ctx, permission)) forbidden();
  return ctx;
}
