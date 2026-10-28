import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";

import { withTenantScope } from "./scope";

/**
 * Database-level tenant isolation, asserted against real PostgreSQL.
 *
 * These tests deliberately write queries WITHOUT an institution filter: the
 * point is that the row-level security policies, not the application's
 * `where` clauses, keep one college's rows from another. They also pin the
 * property that makes this safe behind a transaction pooler: the role and
 * tenant set by `withTenantScope` do not survive the transaction.
 *
 * Institution audit rows are append-only, so the rows created here stay in
 * the development database; every name carries a unique suffix.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let instA = "";
let instB = "";
let userA = "";
let userB = "";
let memberB = "";

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.institution.create({ data: { name: "College A", slug: `rls-a-${SUFFIX}` } }),
    prisma.institution.create({ data: { name: "College B", slug: `rls-b-${SUFFIX}` } }),
  ]);
  instA = a.id;
  instB = b.id;
  const [ua, ub] = await Promise.all([
    prisma.user.create({
      data: { email: `rls-a-${SUFFIX}@college-a.test`, passwordHash: "secret-hash" },
    }),
    prisma.user.create({ data: { email: `rls-b-${SUFFIX}@college-b.test` } }),
  ]);
  userA = ua.id;
  userB = ub.id;
  await prisma.institutionMembership.create({
    data: { institutionId: instA, userId: userA, role: "STUDENT", source: "PLATFORM" },
  });
  memberB = (
    await prisma.institutionMembership.create({
      data: {
        institutionId: instB,
        userId: userB,
        role: "STUDENT",
        source: "PLATFORM",
      },
    })
  ).id;
  await prisma.institutionInvitation.create({
    data: {
      institutionId: instB,
      email: `invitee-${SUFFIX}@college-b.test`,
      role: "FACULTY",
      tokenHash: `hash-${SUFFIX}`,
      expiresAt: new Date(Date.now() + 60_000),
      invitedById: userB,
    },
  });
  await prisma.institutionAuditLog.create({
    data: {
      institutionId: instB,
      actorId: userB,
      actorEmail: "b@college-b.test",
      action: "test",
      targetType: "test",
      summary: "B only",
    },
  });
  await prisma.institutionDomain.createMany({
    data: [
      {
        institutionId: instB,
        domain: `verified-${SUFFIX}.test`,
        verificationToken: "t",
        verifiedAt: new Date(),
      },
      {
        institutionId: instB,
        domain: `pending-${SUFFIX}.test`,
        verificationToken: "t",
      },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } });
});

const inA = () => ({ institutionId: instA, userId: userA });

describe("tenant scope and connection pooling", () => {
  it("runs as te_tenant inside the scope and as the owner after it", async () => {
    const inside = await withTenantScope(
      inA(),
      (tx) =>
        tx.$queryRaw<{ who: string; inst: string }[]>`
        SELECT current_user AS who, current_setting('app.institution_id', true) AS inst
      `
    );
    expect(inside[0]).toEqual({ who: "te_tenant", inst: instA });

    // The suite pins one pooled connection, so this is the same connection.
    const after = await prisma.$queryRaw<
      { who: string; inst: string | null; usr: string | null }[]
    >`
      SELECT current_user AS who,
             nullif(current_setting('app.institution_id', true), '') AS inst,
             nullif(current_setting('app.user_id', true), '') AS usr
    `;
    expect(after[0]?.who).not.toBe("te_tenant");
    expect(after[0]?.inst).toBeNull();
    expect(after[0]?.usr).toBeNull();
  });

  it("does not leak the scope when the transaction fails", async () => {
    await expect(
      withTenantScope(inA(), async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    const after = await prisma.$queryRaw<{ who: string; inst: string | null }[]>`
      SELECT current_user AS who, nullif(current_setting('app.institution_id', true), '') AS inst
    `;
    expect(after[0]?.who).not.toBe("te_tenant");
    expect(after[0]?.inst).toBeNull();
  });

  it("gives te_tenant no superuser, no BYPASSRLS and no table ownership", async () => {
    const [role] = await prisma.$queryRaw<
      { rolsuper: boolean; rolbypassrls: boolean; rolcanlogin: boolean }[]
    >`
      SELECT rolsuper, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolname = 'te_tenant'
    `;
    expect(role).toEqual({ rolsuper: false, rolbypassrls: false, rolcanlogin: false });
    const owned = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM pg_tables WHERE tableowner = 'te_tenant'
    `;
    expect(Number(owned[0]?.n)).toBe(0);
  });
});

describe("row-level security on institution tables", () => {
  it("shows only the current institution's rows to an unfiltered query", async () => {
    const seen = await withTenantScope(inA(), async (tx) => ({
      institutions: await tx.institution.findMany({ select: { id: true } }),
      memberships: await tx.institutionMembership.findMany({
        select: { institutionId: true },
      }),
      invitations: await tx.institutionInvitation.count(),
      audit: await tx.institutionAuditLog.count({ where: { institutionId: instB } }),
      domains: await tx.institutionDomain.count({ where: { institutionId: instB } }),
    }));
    expect(seen.institutions.map((i) => i.id)).toEqual([instA]);
    expect(new Set(seen.memberships.map((m) => m.institutionId))).toEqual(
      new Set([instA])
    );
    expect(seen.invitations).toBe(0);
    expect(seen.audit).toBe(0);
    expect(seen.domains).toBe(0);
  });

  it("finds nothing by another institution's id", async () => {
    const row = await withTenantScope(inA(), (tx) =>
      tx.institutionMembership.findUnique({ where: { id: memberB } })
    );
    expect(row).toBeNull();
  });

  it("rejects writing a row into another institution", async () => {
    await expect(
      withTenantScope(inA(), (tx) =>
        tx.institutionMembership.create({
          data: {
            institutionId: instB,
            userId: userA,
            role: "INSTITUTION_ADMIN",
            source: "PLATFORM",
          },
        })
      )
    ).rejects.toThrow();
    await expect(
      withTenantScope(inA(), (tx) =>
        tx.institutionAuditLog.create({
          data: {
            institutionId: instB,
            actorId: userA,
            actorEmail: "a@college-a.test",
            action: "forged",
            targetType: "x",
            summary: "forged",
          },
        })
      )
    ).rejects.toThrow();
  });

  it("cannot update another institution's rows", async () => {
    const result = await withTenantScope(inA(), (tx) =>
      tx.institutionMembership.updateMany({
        where: { id: memberB },
        data: { role: "INSTITUTION_ADMIN" },
      })
    );
    expect(result.count).toBe(0);
    const unchanged = await prisma.institutionMembership.findUnique({
      where: { id: memberB },
    });
    expect(unchanged?.role).toBe("STUDENT");
  });

  it("cannot delete anything", async () => {
    await expect(
      withTenantScope(inA(), (tx) => tx.institutionMembership.deleteMany({}))
    ).rejects.toThrow(/permission denied/i);
  });

  it("sees no institution data at all without a context", async () => {
    const seen = await withTenantScope(
      { institutionId: null, userId: "nobody" },
      async (tx) => ({
        institutions: await tx.institution.count(),
        memberships: await tx.institutionMembership.count(),
        invitations: await tx.institutionInvitation.count(),
        audit: await tx.institutionAuditLog.count(),
      })
    );
    expect(seen).toEqual({ institutions: 0, memberships: 0, invitations: 0, audit: 0 });
  });
});

describe("what te_tenant can never read", () => {
  it("cannot read password hashes or any other private user column", async () => {
    await expect(
      withTenantScope(inA(), (tx) => tx.$queryRaw`SELECT "passwordHash" FROM users`)
    ).rejects.toThrow(/permission denied/i);
  });

  it("sees only users of the current institution", async () => {
    const ids = await withTenantScope(
      inA(),
      (tx) => tx.$queryRaw<{ id: string }[]>`SELECT id FROM users`
    );
    expect(ids.map((r) => r.id)).toEqual([userA]);
  });

  it.each([
    "notes",
    "submissions",
    "highlights",
    "ai_conversations",
    "interview_sessions",
  ])("has no grant on personal table %s", async (table) => {
    await expect(
      withTenantScope(inA(), (tx) =>
        tx.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`)
      )
    ).rejects.toThrow(/permission denied/i);
  });
});

describe("cross-tenant lookups", () => {
  it("resolves only verified domains of active institutions", async () => {
    const lookup = (domain: string) =>
      withTenantScope(
        { institutionId: null, userId: userA },
        (tx) =>
          tx.$queryRaw<
            { id: string | null }[]
          >`SELECT te_institution_for_domain(${domain}) AS id`
      );
    expect((await lookup(`verified-${SUFFIX}.test`))[0]?.id).toBe(instB);
    expect((await lookup(`VERIFIED-${SUFFIX}.TEST`))[0]?.id).toBe(instB);
    expect((await lookup(`pending-${SUFFIX}.test`))[0]?.id).toBeNull();

    await prisma.institution.update({
      where: { id: instB },
      data: { status: "SUSPENDED" },
    });
    try {
      expect((await lookup(`verified-${SUFFIX}.test`))[0]?.id).toBeNull();
    } finally {
      await prisma.institution.update({
        where: { id: instB },
        data: { status: "ACTIVE" },
      });
    }
  });
});

describe("institution audit log", () => {
  it("is append-only even for the table owner", async () => {
    const row = await prisma.institutionAuditLog.findFirst({
      where: { institutionId: instB },
    });
    expect(row).not.toBeNull();
    await expect(
      prisma.institutionAuditLog.update({
        where: { id: row!.id },
        data: { summary: "edited" },
      })
    ).rejects.toThrow(/append-only/);
    await expect(
      prisma.institutionAuditLog.delete({ where: { id: row!.id } })
    ).rejects.toThrow(/append-only/);
  });
});
