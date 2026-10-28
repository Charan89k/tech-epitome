import "server-only";

import { randomBytes } from "node:crypto";
import { resolveTxt } from "node:dns/promises";

import type { CurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { InstitutionError, type MemberContext } from "@/lib/tenancy/context";
import { setScope, withTenantScope } from "@/lib/tenancy/scope";
import type { InstitutionStatus } from "@/generated/prisma/enums";

import { writeAudit } from "./institutions";

/**
 * Platform-operator actions. Callers must already have passed
 * `requireAdmin*`; each function re-checks the role it is handed, because a
 * service reachable from two routes is only as safe as its weakest caller.
 *
 * Institution writes run as `te_tenant` with the platform flag, and each
 * one lands in that institution's own audit log; account suspension is a
 * platform matter and lands in the platform `AuditLog`.
 */

type PlatformAdmin = Pick<CurrentUser, "id" | "email" | "name" | "role">;

function assertPlatformAdmin(actor: PlatformAdmin): void {
  if (actor.role !== "ADMIN")
    throw new InstitutionError("forbidden", "Platform admins only.");
}

const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;
// A registrable hostname: labels of letters, digits and hyphens.
const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
/** Where the institution publishes its proof of control. */
export const DNS_RECORD_PREFIX = "_tech-epitome";
export const DNS_VALUE_PREFIX = "tech-epitome-verify=";

/** A context that lets a platform admin act inside one institution. */
export async function platformContext(
  actor: PlatformAdmin,
  institutionId: string
): Promise<MemberContext> {
  assertPlatformAdmin(actor);
  const institution = await withTenantScope(
    { institutionId: null, userId: actor.id, platformAdmin: true },
    (tx) =>
      tx.institution.findUnique({
        where: { id: institutionId },
        select: { id: true, slug: true, name: true },
      })
  );
  if (!institution) throw new InstitutionError("not_found", "No such institution.");
  return {
    user: { id: actor.id, email: actor.email, name: actor.name },
    institution,
    role: null,
    membershipId: null,
    platformAdmin: true,
  };
}

export async function listInstitutions(actor: PlatformAdmin) {
  assertPlatformAdmin(actor);
  return withTenantScope(
    { institutionId: null, userId: actor.id, platformAdmin: true },
    (tx) =>
      tx.institution.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          createdAt: true,
          _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
        },
        orderBy: { createdAt: "desc" },
      })
  );
}

export async function createInstitution(
  actor: PlatformAdmin,
  input: { name: string; slug: string }
): Promise<{ id: string; slug: string }> {
  assertPlatformAdmin(actor);
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (name.length < 2 || name.length > 120)
    throw new InstitutionError("invalid", "Name must be 2-120 characters.");
  if (!SLUG.test(slug))
    throw new InstitutionError(
      "invalid",
      "Slug: 3-48 lowercase letters, digits and hyphens."
    );

  return withTenantScope(
    { institutionId: null, userId: actor.id, platformAdmin: true },
    async (tx) => {
      const taken = await tx.institution.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (taken) throw new InstitutionError("conflict", "That slug is taken.");
      const institution = await tx.institution.create({
        data: { name, slug },
        select: { id: true, slug: true },
      });
      await setScope(tx, {
        institutionId: institution.id,
        userId: actor.id,
        platformAdmin: true,
      });
      await writeAudit(tx, institution.id, actor, {
        action: "institution.created",
        targetType: "institution",
        targetId: institution.id,
        summary: `Created ${name} (${slug})`,
      });
      return institution;
    }
  );
}

export async function setInstitutionStatus(
  actor: PlatformAdmin,
  institutionId: string,
  status: InstitutionStatus
): Promise<void> {
  const ctx = await platformContext(actor, institutionId);
  await withTenantScope(
    { institutionId, userId: actor.id, platformAdmin: true },
    async (tx) => {
      await tx.institution.update({ where: { id: institutionId }, data: { status } });
      await writeAudit(tx, institutionId, actor, {
        action: `institution.${status.toLowerCase()}`,
        targetType: "institution",
        targetId: institutionId,
        summary: `Set ${ctx.institution.name} to ${status}`,
      });
    }
  );
}

export async function listDomains(actor: PlatformAdmin, institutionId: string) {
  assertPlatformAdmin(actor);
  return withTenantScope(
    { institutionId, userId: actor.id, platformAdmin: true },
    (tx) =>
      tx.institutionDomain.findMany({
        where: { institutionId },
        select: { id: true, domain: true, verificationToken: true, verifiedAt: true },
        orderBy: { createdAt: "asc" },
      })
  );
}

/** Registers a domain as pending; it grants nothing until verified. */
export async function addDomain(
  actor: PlatformAdmin,
  institutionId: string,
  rawDomain: string
): Promise<{ id: string; record: string; value: string }> {
  await platformContext(actor, institutionId);
  const domain = rawDomain.trim().toLowerCase().replace(/^@/, "");
  if (!DOMAIN.test(domain))
    throw new InstitutionError("invalid", "Enter a domain like college.edu.");

  const token = randomBytes(16).toString("hex");
  // The uniqueness check must see every institution's domains, which
  // te_tenant cannot; the unique index is the real guard either way.
  const taken = await prisma.institutionDomain.findUnique({
    where: { domain },
    select: { id: true },
  });
  if (taken)
    throw new InstitutionError(
      "conflict",
      "That domain already belongs to an institution."
    );

  const created = await withTenantScope(
    { institutionId, userId: actor.id, platformAdmin: true },
    async (tx) => {
      const row = await tx.institutionDomain.create({
        data: { institutionId, domain, verificationToken: token },
        select: { id: true },
      });
      await writeAudit(tx, institutionId, actor, {
        action: "domain.added",
        targetType: "domain",
        targetId: row.id,
        summary: `Added pending domain ${domain}`,
      });
      return row;
    }
  );
  return {
    id: created.id,
    record: `${DNS_RECORD_PREFIX}.${domain}`,
    value: `${DNS_VALUE_PREFIX}${token}`,
  };
}

export type TxtResolver = (hostname: string) => Promise<string[][]>;

/**
 * Marks a domain verified only if its DNS publishes the token. Only the
 * people who run the college's DNS can do that, which is what makes an
 * address at the domain evidence of belonging to the college.
 */
export async function verifyDomain(
  actor: PlatformAdmin,
  institutionId: string,
  domainId: string,
  resolver: TxtResolver = resolveTxt
): Promise<{ verified: boolean }> {
  await platformContext(actor, institutionId);
  return withTenantScope(
    { institutionId, userId: actor.id, platformAdmin: true },
    async (tx) => {
      const row = await tx.institutionDomain.findFirst({
        where: { id: domainId, institutionId },
        select: { id: true, domain: true, verificationToken: true, verifiedAt: true },
      });
      if (!row) throw new InstitutionError("not_found", "No such domain.");
      if (row.verifiedAt) return { verified: true };

      let records: string[][] = [];
      try {
        records = await resolver(`${DNS_RECORD_PREFIX}.${row.domain}`);
      } catch {
        return { verified: false };
      }
      const expected = `${DNS_VALUE_PREFIX}${row.verificationToken}`;
      if (!records.some((chunks) => chunks.join("") === expected))
        return { verified: false };

      await tx.institutionDomain.update({
        where: { id: row.id },
        data: { verifiedAt: new Date() },
      });
      await writeAudit(tx, institutionId, actor, {
        action: "domain.verified",
        targetType: "domain",
        targetId: row.id,
        summary: `Verified ${row.domain} by DNS TXT`,
      });
      return { verified: true };
    }
  );
}

/**
 * Suspends or reactivates an account platform-wide. Suspension also bumps
 * sessionVersion, so every token already issued stops working on its next
 * request; reactivation does not restore those tokens.
 */
export async function setUserSuspended(
  actor: PlatformAdmin,
  userId: string,
  suspended: boolean
): Promise<void> {
  assertPlatformAdmin(actor);
  if (actor.id === userId)
    throw new InstitutionError("forbidden", "You cannot suspend yourself.");

  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, status: true },
    });
    if (!target) throw new InstitutionError("not_found", "No such user.");
    const next = suspended ? "SUSPENDED" : "ACTIVE";
    if (target.status === next) return;
    await tx.user.update({
      where: { id: userId },
      data: suspended
        ? {
            status: "SUSPENDED",
            suspendedAt: new Date(),
            sessionVersion: { increment: 1 },
          }
        : { status: "ACTIVE", suspendedAt: null },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action: suspended ? "user.suspended" : "user.reactivated",
        entity: "user",
        entityId: userId,
        summary: `${suspended ? "Suspended" : "Reactivated"} ${target.email}`,
      },
    });
  });
}
