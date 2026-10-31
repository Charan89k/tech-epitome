import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  issueResetLinkAsAdmin,
  requestPasswordReset,
  resetPassword,
} from "./password-reset";

const tag = `reset-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const email = `${tag}@techepitome.test`;
const admin = { id: "admin", email: "admin@techepitome.test", role: "ADMIN" };
let userId = "";

describe("password recovery", () => {
  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email, passwordHash: "old", profile: { create: {} } },
      select: { id: true },
    });
    userId = user.id;
    const actor = await prisma.user.create({
      data: { email: `${tag}-a@techepitome.test`, role: "ADMIN" },
      select: { id: true },
    });
    admin.id = actor.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { entityId: userId } });
    await prisma.verificationToken.deleteMany({
      where: { identifier: `password-reset:${userId}` },
    });
    await prisma.user.deleteMany({ where: { id: { in: [userId, admin.id] } } });
  });

  it("refuses a non-admin issuing a link", async () => {
    await expect(
      issueResetLinkAsAdmin({ ...admin, role: "USER" }, userId)
    ).rejects.toThrow();
  });

  it("stores only a hash of the token", async () => {
    const token = await issueResetLinkAsAdmin(admin, userId);
    const rows = await prisma.verificationToken.findMany({
      where: { identifier: `password-reset:${userId}` },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.token).not.toBe(token);
  });

  it("sets the password, ends sessions, audits, and works only once", async () => {
    const token = (await issueResetLinkAsAdmin(admin, userId))!;
    const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    expect(await resetPassword(token, "brand-new-password")).toBe(true);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword(after.passwordHash!, "brand-new-password")).toBe(true);
    expect(after.sessionVersion).toBe(before.sessionVersion + 1);
    expect(
      await prisma.auditLog.count({
        where: { entityId: userId, action: "account.password_reset" },
      })
    ).toBe(1);

    expect(await resetPassword(token, "another-new-password")).toBe(false);
  });

  it("invalidates an older link when a newer one is issued", async () => {
    const first = (await issueResetLinkAsAdmin(admin, userId))!;
    const second = (await issueResetLinkAsAdmin(admin, userId))!;
    expect(await resetPassword(first, "first-link-password")).toBe(false);
    expect(await resetPassword(second, "second-link-password")).toBe(true);
  });

  it("refuses an expired link", async () => {
    const token = (await issueResetLinkAsAdmin(admin, userId))!;
    await prisma.verificationToken.updateMany({
      where: { identifier: `password-reset:${userId}` },
      data: { expires: new Date(Date.now() - 1000) },
    });
    expect(await resetPassword(token, "too-late-password")).toBe(false);
  });

  it("refuses a token that belongs to email verification", async () => {
    expect(await resetPassword("not-a-real-token-at-all", "some-long-password")).toBe(
      false
    );
  });

  it("answers an unknown address exactly as it answers a known one", async () => {
    await expect(
      requestPasswordReset(`nobody-${tag}@techepitome.test`, "198.51.100.7")
    ).resolves.toBeUndefined();
    await expect(requestPasswordReset(email, "198.51.100.7")).resolves.toBeUndefined();
  });
});
