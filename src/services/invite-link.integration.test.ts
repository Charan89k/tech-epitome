import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { prisma } from "@/lib/db";
import { resetEmailProviderForTests, setEmailProvider } from "@/lib/email";
import type { EmailProvider } from "@/lib/email/types";

import { acceptInvitation, hashToken, inviteMember } from "./institutions";
import { createInstitution, platformContext } from "./institutions-platform";

const tag = `link-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const address = (who: string) => `${tag}-${who}@techepitome.test`;

const noEmail: EmailProvider = {
  name: "none",
  isConfigured: () => false,
  send: async () => ({ status: "skipped", provider: "none", reason: "not configured" }),
};

describe("an invitation when no email can be sent", () => {
  let admin: { id: string; email: string; name: string | null; role: "ADMIN" };
  let teacher: { id: string; email: string };
  let stranger: { id: string; email: string };
  let institutionId = "";

  const user = (who: string, role: "ADMIN" | "USER" = "USER") =>
    prisma.user.create({
      data: { email: address(who), role, profile: { create: {} } },
      select: { id: true, email: true, name: true },
    });

  beforeAll(async () => {
    setEmailProvider(noEmail);
    admin = { ...(await user("admin", "ADMIN")), role: "ADMIN" };
    teacher = await user("teacher");
    stranger = await user("stranger");
    ({ id: institutionId } = await createInstitution(admin, {
      name: `Test ${tag}`,
      slug: tag.toLowerCase(),
    }));
  });

  afterAll(async () => {
    resetEmailProviderForTests();
    await prisma.institution.deleteMany({ where: { id: institutionId } });
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } });
  });

  it("gives the inviter a one-time link, stores only its hash, and audits it", async () => {
    const ctx = await platformContext(admin, institutionId);
    const { undeliveredToken, emailStatus } = await inviteMember(ctx, {
      email: teacher.email,
      role: "FACULTY",
    });
    expect(emailStatus).toBe("skipped");
    expect(undeliveredToken).toBeTruthy();

    const row = await prisma.institutionInvitation.findFirstOrThrow({
      where: { institutionId, email: teacher.email },
    });
    expect(row.tokenHash).toBe(hashToken(undeliveredToken!));
    expect(row.tokenHash).not.toBe(undeliveredToken);

    expect(
      await prisma.institutionAuditLog.count({
        where: { institutionId, action: "invitation.link_issued" },
      })
    ).toBe(1);

    await expect(acceptInvitation(stranger, undeliveredToken!)).rejects.toMatchObject({
      code: "forbidden",
    });

    await acceptInvitation(teacher, undeliveredToken!);
    const membership = await prisma.institutionMembership.findUniqueOrThrow({
      where: { institutionId_userId: { institutionId, userId: teacher.id } },
    });
    expect(membership.role).toBe("FACULTY");

    await expect(acceptInvitation(teacher, undeliveredToken!)).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("returns no token once email is accepted", async () => {
    setEmailProvider({
      name: "ok",
      isConfigured: () => true,
      send: async () => ({ status: "accepted", id: "1", provider: "ok" }),
    });
    const ctx = await platformContext(admin, institutionId);
    const result = await inviteMember(ctx, { email: stranger.email, role: "STUDENT" });
    expect(result.emailStatus).toBe("accepted");
    expect(result.undeliveredToken).toBeUndefined();
    setEmailProvider(noEmail);
  });
});
