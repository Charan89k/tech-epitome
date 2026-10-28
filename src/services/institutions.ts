import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { CurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";
import { institutionInvitationEmail } from "@/lib/email/templates";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import {
  assertCan,
  InstitutionError,
  scopeOf,
  type MemberContext,
} from "@/lib/tenancy/context";
import { can, canInviteRole } from "@/lib/tenancy/permissions";
import { setScope, withTenantScope, type TenantTx } from "@/lib/tenancy/scope";
import type { InstitutionRole, MembershipStatus } from "@/generated/prisma/enums";

/**
 * Institution membership: invitations, domain enrolment, role and status
 * changes, the roster and its export, and the audit trail.
 *
 * Every function either takes a `MemberContext` (built from the session by
 * `requireMember*`) and re-asserts the permission it needs, or takes the
 * signed-in user and acts only on that user. Every query runs inside
 * `withTenantScope`, so row-level security confines it to one institution
 * even where the code's own `where` would not. Ids arriving from a client
 * are always looked up *within* the institution: another institution's id
 * reads as "not found", never as "forbidden", so it confirms nothing.
 */

const INVITATION_TTL_MS = 7 * 24 * 60 * 60_000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

type AuditEntry = {
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
};

/** Written inside the caller's transaction: no change lands without it. */
export async function writeAudit(
  tx: TenantTx,
  institutionId: string,
  actor: { id: string; email: string },
  entry: AuditEntry
): Promise<void> {
  await tx.institutionAuditLog.create({
    data: {
      institutionId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      summary: entry.summary,
      metadata: entry.metadata ?? undefined,
    },
  });
}

/**
 * Counts active admins with their rows locked (FOR UPDATE), so two admins
 * demoting each other at the same moment cannot both see "2" and leave
 * zero: the second transaction waits, re-reads, and sees 1.
 */
async function activeAdminCount(tx: TenantTx, institutionId: string): Promise<number> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM institution_memberships
    WHERE "institutionId" = ${institutionId}
      AND role = 'INSTITUTION_ADMIN' AND status = 'ACTIVE'
    FOR UPDATE
  `;
  return rows.length;
}

/** The membership, if any, of the account registered with `email`. */
async function membershipForEmail(tx: TenantTx, institutionId: string, email: string) {
  return tx.institutionMembership.findFirst({
    where: { institutionId, user: { email } },
    select: { id: true, status: true },
  });
}

/**
 * Pending invitations for an address, revoked when its member is suspended
 * or revoked, so an invitation sent earlier cannot undo that decision.
 */
async function revokePendingInvitations(
  tx: TenantTx,
  institutionId: string,
  email: string
): Promise<void> {
  await tx.institutionInvitation.updateMany({
    where: { institutionId, email, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function joinLimit(userId: string): Promise<void> {
  const limited = await rateLimit(
    `institution-join:${userId}`,
    RATE_LIMITS.INSTITUTION_JOIN
  );
  if (!limited.success)
    throw new InstitutionError("conflict", "Too many attempts. Try again later.");
}

// ---------------------------------------------------------------------------
// The signed-in user's own memberships
// ---------------------------------------------------------------------------

export type MyMembership = {
  institution: { slug: string; name: string };
  role: InstitutionRole;
};

/** Active memberships only: a suspended one grants nothing to show. */
export async function listMyMemberships(
  user: Pick<CurrentUser, "id">
): Promise<MyMembership[]> {
  return withTenantScope({ institutionId: null, userId: user.id }, async (tx) => {
    const rows = await tx.institutionMembership.findMany({
      where: { userId: user.id, status: "ACTIVE", institution: { status: "ACTIVE" } },
      select: { role: true, institution: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return rows;
  });
}

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

export type MemberRow = {
  id: string;
  role: InstitutionRole;
  status: MembershipStatus;
  source: string;
  joinedAt: Date;
  user: { id: string; name: string | null; email: string };
};

export async function listMembers(ctx: MemberContext): Promise<MemberRow[]> {
  assertCan(ctx, "members.list");
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const rows = await tx.institutionMembership.findMany({
      where: { institutionId: ctx.institution.id },
      select: {
        id: true,
        role: true,
        status: true,
        source: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(({ createdAt, ...row }) => ({ ...row, joinedAt: createdAt }));
  });
}

/** A cell a spreadsheet would execute as a formula is neutralised. */
export function csvCell(value: string): string {
  const safe = /^\s*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function exportMembersCsv(ctx: MemberContext): Promise<string> {
  assertCan(ctx, "members.export");
  return withTenantScope(scopeOf(ctx), async (tx) => {
    const rows = await tx.institutionMembership.findMany({
      where: { institutionId: ctx.institution.id },
      select: {
        role: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "members.exported",
      targetType: "institution",
      targetId: ctx.institution.id,
      summary: `Exported ${rows.length} memberships as CSV`,
      metadata: { rows: rows.length },
    });
    const lines = [
      ["name", "email", "role", "status", "joined"].map(csvCell).join(","),
      ...rows.map((r) =>
        [r.user.name ?? "", r.user.email, r.role, r.status, r.createdAt.toISOString()]
          .map(csvCell)
          .join(",")
      ),
    ];
    return `${lines.join("\r\n")}\r\n`;
  });
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export async function inviteMember(
  ctx: MemberContext,
  input: { email: string; role: InstitutionRole }
): Promise<{ invitationId: string }> {
  assertCan(ctx, "members.invite");
  if (!canInviteRole(ctx, input.role)) {
    throw new InstitutionError("forbidden", "You cannot invite someone to that role.");
  }
  const email = normaliseEmail(input.email);

  const limited = await rateLimit(
    `institution-invite:${ctx.user.id}`,
    RATE_LIMITS.INSTITUTION_INVITE
  );
  const institutionLimited = await rateLimit(
    `institution-invite-org:${ctx.institution.id}`,
    RATE_LIMITS.INSTITUTION_INVITE_ORG
  );
  if (!limited.success || !institutionLimited.success) {
    throw new InstitutionError("conflict", "Too many invitations. Try again later.");
  }

  const { token, hash } = newToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  const invitationId = await withTenantScope(scopeOf(ctx), async (tx) => {
    // An existing member changes role through changeMemberRole, and only
    // someone who may manage members can bring back a suspended or
    // revoked one.
    const existing = await membershipForEmail(tx, ctx.institution.id, email);
    if (existing?.status === "ACTIVE") {
      throw new InstitutionError("conflict", "That person is already a member.");
    }
    if (existing && !can(ctx, "members.manage")) {
      throw new InstitutionError("forbidden", "Only an admin can re-invite that person.");
    }
    // Re-inviting replaces the old link, but never one for a role this
    // inviter could not have granted (faculty cannot cancel an admin invite).
    const pending = await tx.institutionInvitation.findMany({
      where: { institutionId: ctx.institution.id, email, acceptedAt: null, revokedAt: null },
      select: { role: true },
    });
    if (pending.some((p) => !canInviteRole(ctx, p.role))) {
      throw new InstitutionError("conflict", "A pending invitation for that address outranks yours.");
    }
    // One live invitation per address.
    await tx.institutionInvitation.updateMany({
      where: {
        institutionId: ctx.institution.id,
        email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    const invitation = await tx.institutionInvitation.create({
      data: {
        institutionId: ctx.institution.id,
        email,
        role: input.role,
        tokenHash: hash,
        expiresAt,
        invitedById: ctx.user.id,
      },
      select: { id: true },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "invitation.created",
      targetType: "invitation",
      targetId: invitation.id,
      summary: `Invited ${email} as ${input.role}`,
      metadata: { email, role: input.role },
    });
    return invitation.id;
  });

  await getEmailProvider().send(
    institutionInvitationEmail(
      { email },
      { institutionName: ctx.institution.name, role: input.role, token, expiresAt }
    )
  );
  return { invitationId };
}

export async function revokeInvitation(
  ctx: MemberContext,
  invitationId: string
): Promise<void> {
  assertCan(ctx, "members.invite");
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const invitation = await tx.institutionInvitation.findFirst({
      where: {
        id: invitationId,
        institutionId: ctx.institution.id,
        acceptedAt: null,
        revokedAt: null,
      },
      select: { id: true, email: true, role: true },
    });
    if (!invitation)
      throw new InstitutionError("not_found", "No such pending invitation.");
    if (!canInviteRole(ctx, invitation.role)) {
      throw new InstitutionError("forbidden", "You cannot revoke that invitation.");
    }
    await tx.institutionInvitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "invitation.revoked",
      targetType: "invitation",
      targetId: invitation.id,
      summary: `Revoked the invitation for ${invitation.email}`,
    });
  });
}

async function invitationInstitution(
  tx: TenantTx,
  hash: string
): Promise<string | null> {
  const [row] = await tx.$queryRaw<{ id: string | null }[]>`
    SELECT te_invitation_institution(${hash}) AS id
  `;
  return row?.id ?? null;
}

/** What an invitation link shows before the user accepts it. */
export async function describeInvitation(
  user: Pick<CurrentUser, "id">,
  token: string
): Promise<{
  institutionName: string;
  role: InstitutionRole;
  email: string;
  usable: boolean;
} | null> {
  const hash = hashToken(token);
  return withTenantScope({ institutionId: null, userId: user.id }, async (tx) => {
    const institutionId = await invitationInstitution(tx, hash);
    if (!institutionId) return null;
    await setScope(tx, { institutionId, userId: user.id });
    const invitation = await tx.institutionInvitation.findUnique({
      where: { tokenHash: hash },
      select: {
        email: true,
        role: true,
        acceptedAt: true,
        revokedAt: true,
        expiresAt: true,
        institution: { select: { name: true, status: true } },
      },
    });
    if (!invitation) return null;
    return {
      institutionName: invitation.institution.name,
      role: invitation.role,
      email: invitation.email,
      usable:
        !invitation.acceptedAt &&
        !invitation.revokedAt &&
        invitation.expiresAt > new Date() &&
        invitation.institution.status === "ACTIVE",
    };
  });
}

/**
 * Accepts an invitation for the signed-in user. The token proves the
 * invitee received the email; the address check proves it is being used by
 * the account it was sent to, so a forwarded link is useless.
 */
export async function acceptInvitation(
  user: Pick<CurrentUser, "id" | "email">,
  token: string
): Promise<{ slug: string }> {
  await joinLimit(user.id);
  const hash = hashToken(token);

  return withTenantScope({ institutionId: null, userId: user.id }, async (tx) => {
    const institutionId = await invitationInstitution(tx, hash);
    if (!institutionId)
      throw new InstitutionError("not_found", "This invitation is not valid.");
    await setScope(tx, { institutionId, userId: user.id });

    const invitation = await tx.institutionInvitation.findUnique({
      where: { tokenHash: hash },
      select: {
        id: true,
        email: true,
        role: true,
        acceptedAt: true,
        revokedAt: true,
        expiresAt: true,
        institution: { select: { slug: true, status: true } },
      },
    });
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt <= new Date() ||
      invitation.institution.status !== "ACTIVE"
    ) {
      throw new InstitutionError("not_found", "This invitation is no longer valid.");
    }
    if (normaliseEmail(user.email) !== invitation.email) {
      throw new InstitutionError(
        "forbidden",
        "This invitation was sent to a different email address."
      );
    }

    const claimed = await tx.institutionInvitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, revokedAt: null },
      data: { acceptedAt: new Date(), acceptedById: user.id },
    });
    // A concurrent accept of the same link won the race.
    if (claimed.count !== 1) {
      throw new InstitutionError("not_found", "This invitation was already used.");
    }

    const existing = await tx.institutionMembership.findUnique({
      where: { institutionId_userId: { institutionId, userId: user.id } },
      select: { status: true },
    });
    // An invitation never changes a current member's role (that would
    // bypass the last-admin guard) and never lifts a suspension.
    if (existing?.status === "ACTIVE") {
      throw new InstitutionError("conflict", "You are already a member here.");
    }
    if (existing?.status === "SUSPENDED") {
      throw new InstitutionError("forbidden", "Your membership is suspended. Ask an administrator.");
    }

    const membership = await tx.institutionMembership.upsert({
      where: { institutionId_userId: { institutionId, userId: user.id } },
      create: {
        institutionId,
        userId: user.id,
        role: invitation.role,
        source: "INVITATION",
      },
      update: {
        role: invitation.role,
        status: "ACTIVE",
        revokedAt: null,
        source: "INVITATION",
      },
      select: { id: true },
    });
    await writeAudit(tx, institutionId, user, {
      action: "invitation.accepted",
      targetType: "membership",
      targetId: membership.id,
      summary: `${user.email} joined as ${invitation.role}`,
      metadata: { role: invitation.role },
    });
    return { slug: invitation.institution.slug };
  });
}

// ---------------------------------------------------------------------------
// Verified email domain enrolment
// ---------------------------------------------------------------------------

/**
 * Joins the institution that owns the user's verified email domain, as a
 * STUDENT and nothing else. Requires both a verified account address and a
 * DNS-verified domain. An existing membership is never changed, so a member
 * an admin suspended or revoked cannot rejoin this way.
 */
export async function enrollByEmailDomain(
  user: Pick<CurrentUser, "id">
): Promise<{ slug: string } | null> {
  await joinLimit(user.id);

  // The account itself is personal data: read as the owner, outside any
  // tenant scope, and only to learn the address and whether it is verified.
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, emailVerified: true, status: true },
  });
  if (!account || account.status !== "ACTIVE") {
    throw new InstitutionError("forbidden", "Account unavailable.");
  }
  if (!account.emailVerified) {
    throw new InstitutionError("forbidden", "Verify your email address first.");
  }
  const email = normaliseEmail(account.email);
  const domain = email.split("@")[1] ?? "";

  return withTenantScope({ institutionId: null, userId: user.id }, async (tx) => {
    const [row] = await tx.$queryRaw<{ id: string | null }[]>`
      SELECT te_institution_for_domain(${domain}) AS id
    `;
    const institutionId = row?.id ?? null;
    if (!institutionId) return null;
    await setScope(tx, { institutionId, userId: user.id });

    const existing = await tx.institutionMembership.findUnique({
      where: { institutionId_userId: { institutionId, userId: user.id } },
      select: { status: true },
    });
    if (existing && existing.status !== "ACTIVE") {
      throw new InstitutionError(
        "forbidden",
        "Your membership here was suspended or revoked. Ask an administrator."
      );
    }
    if (!existing) {
      const membership = await tx.institutionMembership.create({
        data: {
          institutionId,
          userId: user.id,
          role: "STUDENT",
          source: "EMAIL_DOMAIN",
        },
        select: { id: true },
      });
      await writeAudit(
        tx,
        institutionId,
        { id: user.id, email },
        {
          action: "membership.domain_enrolled",
          targetType: "membership",
          targetId: membership.id,
          summary: `${email} joined as STUDENT by verified domain ${domain}`,
          metadata: { domain },
        }
      );
    }
    const institution = await tx.institution.findUnique({
      where: { id: institutionId },
      select: { slug: true },
    });
    return institution ? { slug: institution.slug } : null;
  });
}

// ---------------------------------------------------------------------------
// Role and status changes
// ---------------------------------------------------------------------------

async function loadTarget(tx: TenantTx, ctx: MemberContext, membershipId: string) {
  const target = await tx.institutionMembership.findFirst({
    where: { id: membershipId, institutionId: ctx.institution.id },
    select: {
      id: true,
      userId: true,
      role: true,
      status: true,
      user: { select: { email: true } },
    },
  });
  if (!target) throw new InstitutionError("not_found", "No such member.");
  if (target.userId === ctx.user.id) {
    throw new InstitutionError(
      "forbidden",
      "You cannot change your own membership here."
    );
  }
  return target;
}

async function guardLastAdmin(
  tx: TenantTx,
  institutionId: string,
  target: { role: InstitutionRole; status: MembershipStatus }
): Promise<void> {
  if (target.role !== "INSTITUTION_ADMIN" || target.status !== "ACTIVE") return;
  if ((await activeAdminCount(tx, institutionId)) <= 1) {
    throw new InstitutionError(
      "conflict",
      "An institution needs at least one active admin."
    );
  }
}

export async function changeMemberRole(
  ctx: MemberContext,
  membershipId: string,
  role: InstitutionRole
): Promise<void> {
  assertCan(ctx, "members.manage");
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const target = await loadTarget(tx, ctx, membershipId);
    if (target.role === role) return;
    await guardLastAdmin(tx, ctx.institution.id, target);
    await tx.institutionMembership.update({ where: { id: target.id }, data: { role } });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "membership.role_changed",
      targetType: "membership",
      targetId: target.id,
      summary: `Changed ${target.user.email} from ${target.role} to ${role}`,
      metadata: { from: target.role, to: role },
    });
  });
}

const ALLOWED_TRANSITIONS: Record<MembershipStatus, MembershipStatus[]> = {
  ACTIVE: ["SUSPENDED", "REVOKED"],
  SUSPENDED: ["ACTIVE", "REVOKED"],
  // Terminal: only a new invitation brings a revoked member back.
  REVOKED: [],
};

export async function setMembershipStatus(
  ctx: MemberContext,
  membershipId: string,
  status: MembershipStatus
): Promise<void> {
  assertCan(ctx, "members.manage");
  await withTenantScope(scopeOf(ctx), async (tx) => {
    const target = await loadTarget(tx, ctx, membershipId);
    if (!ALLOWED_TRANSITIONS[target.status].includes(status)) {
      throw new InstitutionError(
        "invalid",
        `Cannot go from ${target.status} to ${status}.`
      );
    }
    await guardLastAdmin(tx, ctx.institution.id, target);
    await tx.institutionMembership.update({
      where: { id: target.id },
      data: { status, revokedAt: status === "REVOKED" ? new Date() : null },
    });
    if (status !== "ACTIVE") await revokePendingInvitations(tx, ctx.institution.id, target.user.email);
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: `membership.${status.toLowerCase()}`,
      targetType: "membership",
      targetId: target.id,
      summary: `Set ${target.user.email} to ${status}`,
      metadata: { from: target.status, to: status },
    });
  });
}

/** Leaving is always allowed, except for the last active admin. */
export async function leaveInstitution(ctx: MemberContext): Promise<void> {
  const membershipId = ctx.membershipId;
  if (!membershipId)
    throw new InstitutionError("not_found", "You are not a member here.");
  await withTenantScope(scopeOf(ctx), async (tx) => {
    if (
      ctx.role === "INSTITUTION_ADMIN" &&
      (await activeAdminCount(tx, ctx.institution.id)) <= 1
    ) {
      throw new InstitutionError("conflict", "Appoint another admin before you leave.");
    }
    await tx.institutionMembership.update({
      where: { id: membershipId },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    await writeAudit(tx, ctx.institution.id, ctx.user, {
      action: "membership.left",
      targetType: "membership",
      targetId: membershipId,
      summary: `${ctx.user.email} left the institution`,
    });
  });
}

// ---------------------------------------------------------------------------
// Audit and pending invitations
// ---------------------------------------------------------------------------

export async function listInstitutionAudit(ctx: MemberContext, limit = 200) {
  assertCan(ctx, "audit.view");
  return withTenantScope(scopeOf(ctx), (tx) =>
    tx.institutionAuditLog.findMany({
      where: { institutionId: ctx.institution.id },
      select: {
        id: true,
        actorEmail: true,
        action: true,
        targetType: true,
        summary: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 500),
    })
  );
}

export async function listPendingInvitations(ctx: MemberContext) {
  assertCan(ctx, "members.invite");
  return withTenantScope(scopeOf(ctx), (tx) =>
    tx.institutionInvitation.findMany({
      where: {
        institutionId: ctx.institution.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, email: true, role: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    })
  );
}
