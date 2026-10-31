import { randomBytes } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { canAccess, FEATURES } from "@/lib/auth/access";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

import {
  ACCOUNTS,
  assertSafeTarget,
  provisionAccount,
  UnsafeTargetError,
} from "./provisioning";

/**
 * The provisioning command: refuses production unless named on purpose,
 * hashes with the application's Argon2 settings, and is safe to re-run.
 * Uses throwaway addresses so the real test accounts are never touched here.
 */
const S = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
const admin = {
  email: `prov-admin-${S}@test.local`,
  name: "Admin",
  role: "ADMIN" as const,
};
const student = {
  email: `prov-student-${S}@test.local`,
  name: "Student",
  role: "USER" as const,
};
const secret = () => randomBytes(18).toString("base64url");

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { in: [admin.email, student.email] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  await prisma.auditLog.deleteMany({ where: { entityId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

describe("assertSafeTarget", () => {
  const local = "postgresql://u:p@127.0.0.1:5432/techepitome";
  const remote = "postgresql://u:p@db:5432/techepitome";

  it("allows a local database", () => {
    expect(assertSafeTarget(local, { allowProduction: false }).production).toBe(false);
  });

  it("refuses a non-local database without the flag", () => {
    expect(() => assertSafeTarget(remote, { allowProduction: false })).toThrow(
      UnsafeTargetError
    );
  });

  it("refuses a local database when NODE_ENV is production", () => {
    expect(() =>
      assertSafeTarget(local, { allowProduction: false, nodeEnv: "production" })
    ).toThrow(UnsafeTargetError);
  });

  it("needs the database name confirmed, not just the flag", () => {
    expect(() => assertSafeTarget(remote, { allowProduction: true })).toThrow(
      /must equal/
    );
    expect(() =>
      assertSafeTarget(remote, { allowProduction: true, confirmDatabase: "other" })
    ).toThrow(/must equal/);
    expect(
      assertSafeTarget(remote, {
        allowProduction: true,
        confirmDatabase: "techepitome",
      }).production
    ).toBe(true);
  });

  it("refuses a missing or malformed URL", () => {
    expect(() => assertSafeTarget(undefined, { allowProduction: true })).toThrow(
      /not set/
    );
    expect(() => assertSafeTarget("not a url", { allowProduction: true })).toThrow(
      /valid URL/
    );
  });
});

describe("provisionAccount", () => {
  it("defines exactly the two accounts, with the application's own roles", () => {
    expect(ACCOUNTS.map((a) => [a.email, a.role])).toEqual([
      ["admin@cloude5.tech", "ADMIN"],
      ["student@cloude5.tech", "USER"],
    ]);
  });

  it("creates accounts whose passwords verify with the application's checker", async () => {
    const adminPassword = secret();
    const studentPassword = secret();
    expect(await provisionAccount(prisma, admin, adminPassword)).toMatchObject({
      status: "created",
      role: "ADMIN",
    });
    expect(await provisionAccount(prisma, student, studentPassword)).toMatchObject({
      status: "created",
      role: "USER",
    });

    const rows = await prisma.user.findMany({
      where: { email: { in: [admin.email, student.email] } },
      select: { email: true, role: true, passwordHash: true, emailVerified: true },
    });
    const a = rows.find((r) => r.email === admin.email)!;
    const s = rows.find((r) => r.email === student.email)!;
    expect(await verifyPassword(a.passwordHash, adminPassword)).toBe(true);
    expect(await verifyPassword(s.passwordHash, studentPassword)).toBe(true);
    expect(await verifyPassword(s.passwordHash, adminPassword)).toBe(false);
    expect(a.passwordHash).not.toContain(adminPassword);
    expect(a.emailVerified).not.toBeNull();

    // The roles mean what the application says they mean.
    expect(canAccess({ role: a.role }, FEATURES.ADMIN)).toBe(true);
    expect(canAccess({ role: s.role }, FEATURES.ADMIN)).toBe(false);
  });

  it("is idempotent: a re-run updates in place, ends sessions and is audited", async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { email: student.email },
      select: { id: true, sessionVersion: true },
    });
    const next = secret();
    expect(await provisionAccount(prisma, student, next)).toMatchObject({
      status: "updated",
      sessionsEnded: true,
    });
    const after = await prisma.user.findUniqueOrThrow({
      where: { email: student.email },
      select: { id: true, sessionVersion: true, passwordHash: true, role: true },
    });
    expect(after.id).toBe(before.id);
    expect(after.sessionVersion).toBe(before.sessionVersion + 1);
    expect(after.role).toBe("USER");
    expect(await verifyPassword(after.passwordHash, next)).toBe(true);
    expect(await prisma.user.count({ where: { email: student.email } })).toBe(1);

    const audit = await prisma.auditLog.findMany({
      where: { entityId: before.id },
      select: { action: true, summary: true },
    });
    expect(audit.map((r) => r.action).sort()).toEqual([
      "account.provisioned",
      "account.reprovisioned",
    ]);
    for (const row of audit) expect(row.summary).not.toContain(next);
  });

  it("rejects a short password without echoing it", async () => {
    const short = "short1";
    await expect(provisionAccount(prisma, student, short)).rejects.toThrow(
      /at least 10/
    );
    await expect(provisionAccount(prisma, student, short)).rejects.not.toThrow(short);
  });
});
