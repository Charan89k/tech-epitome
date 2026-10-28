import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// context.ts reaches Auth.js through the session helpers; these tests build
// contexts from known users and never decode a cookie.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { isSessionCurrent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { resetEmailProviderForTests, setEmailProvider } from "@/lib/email";
import type { EmailMessage, EmailProvider } from "@/lib/email/types";
import { resolveMemberContext, type MemberContext } from "@/lib/tenancy/context";

import {
  confirmEmailVerification,
  requestEmailVerification,
} from "./email-verification";
import {
  acceptInvitation,
  changeMemberRole,
  enrollByEmailDomain,
  exportMembersCsv,
  inviteMember,
  leaveInstitution,
  listInstitutionAudit,
  listMembers,
  revokeInvitation,
  setMembershipStatus,
} from "./institutions";
import {
  addDomain,
  createInstitution,
  setInstitutionStatus,
  setUserSuspended,
  verifyDomain,
} from "./institutions-platform";

/**
 * Institution tenancy at the service layer: every role, both directions
 * across a tenant boundary, and the onboarding paths.
 *
 * The cross-tenant cases use REAL ids from the other institution, which is
 * exactly what an IDOR attempt looks like: a valid id the caller has no
 * business touching. They must read as "not found" and change nothing.
 */

const S = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
const DOMAIN_A = `uni-a-${S}.test`;

const sent: EmailMessage[] = [];
const capture: EmailProvider = {
  name: "capture",
  isConfigured: () => true,
  async send(message) {
    sent.push(message);
    return { status: "accepted", id: String(sent.length), provider: "capture" };
  },
};
const lastLinkToken = (path: string): string => {
  const text = sent.at(-1)?.text ?? "";
  const match = text.match(new RegExp(`${path}/([A-Za-z0-9_-]+)`));
  if (!match?.[1]) throw new Error(`no ${path} link in the last email`);
  return decodeURIComponent(match[1]);
};

type U = { id: string; email: string; name: string | null; role: "USER" | "ADMIN" };
const users: Record<string, U> = {};
async function makeUser(
  key: string,
  email: string,
  extra: { role?: "ADMIN"; verified?: boolean } = {}
) {
  const row = await prisma.user.create({
    data: {
      email,
      name: key,
      role: extra.role ?? "USER",
      emailVerified: extra.verified ? new Date() : null,
    },
    select: { id: true, email: true, name: true, role: true },
  });
  users[key] = row;
  return row;
}

let instA = { id: "", slug: "" };
let instB = { id: "", slug: "" };
const membership: Record<string, string> = {};

async function join(
  key: string,
  institutionId: string,
  role: "STUDENT" | "FACULTY" | "INSTITUTION_ADMIN"
) {
  const row = await prisma.institutionMembership.create({
    data: { institutionId, userId: users[key]!.id, role, source: "PLATFORM" },
    select: { id: true },
  });
  membership[key] = row.id;
}

async function ctx(key: string, slug: string): Promise<MemberContext> {
  const c = await resolveMemberContext(users[key]!, slug);
  if (!c) throw new Error(`${key} has no context in ${slug}`);
  return c;
}

beforeAll(async () => {
  setEmailProvider(capture);
  await makeUser("platform", `platform-${S}@techepitome.test`, { role: "ADMIN" });
  await makeUser("adminA", `admin-a-${S}@${DOMAIN_A}`);
  await makeUser("adminA2", `admin-a2-${S}@${DOMAIN_A}`);
  await makeUser("facultyA", `faculty-a-${S}@${DOMAIN_A}`);
  await makeUser("studentA", `student-a-${S}@${DOMAIN_A}`);
  await makeUser("adminB", `admin-b-${S}@uni-b.test`);
  await makeUser("studentB", `student-b-${S}@uni-b.test`);
  await makeUser("outsider", `outsider-${S}@elsewhere.test`);

  instA = await createInstitution(users.platform!, {
    name: "University A",
    slug: `uni-a-${S}`,
  });
  instB = await createInstitution(users.platform!, {
    name: "University B",
    slug: `uni-b-${S}`,
  });

  await join("adminA", instA.id, "INSTITUTION_ADMIN");
  await join("adminA2", instA.id, "INSTITUTION_ADMIN");
  await join("facultyA", instA.id, "FACULTY");
  await join("studentA", instA.id, "STUDENT");
  await join("adminB", instB.id, "INSTITUTION_ADMIN");
  await join("studentB", instB.id, "STUDENT");
});

afterAll(async () => {
  resetEmailProviderForTests();
  await prisma.user.deleteMany({
    where: { id: { in: Object.values(users).map((u) => u.id) } },
  });
});

describe("resolving who may act where", () => {
  it("gives outsiders and other institutions' members no context", async () => {
    expect(await resolveMemberContext(users.outsider!, instA.slug)).toBeNull();
    expect(await resolveMemberContext(users.studentB!, instA.slug)).toBeNull();
    expect(await resolveMemberContext(users.adminB!, instA.slug)).toBeNull();
  });

  it("treats an unknown slug exactly like someone else's", async () => {
    expect(await resolveMemberContext(users.studentA!, `missing-${S}`)).toBeNull();
  });

  it("resolves members with their own role", async () => {
    expect((await ctx("facultyA", instA.slug)).role).toBe("FACULTY");
    expect((await ctx("studentA", instA.slug)).role).toBe("STUDENT");
  });

  it("lets a platform admin act in any institution without a membership", async () => {
    const c = await ctx("platform", instB.slug);
    expect(c.platformAdmin).toBe(true);
    expect(c.role).toBeNull();
  });
});

describe("role boundaries inside one institution", () => {
  it("hides the roster from students", async () => {
    await expect(listMembers(await ctx("studentA", instA.slug))).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("shows faculty the roster of their own institution only", async () => {
    const rows = await listMembers(await ctx("facultyA", instA.slug));
    const emails = rows.map((r) => r.user.email);
    expect(emails).toContain(users.studentA!.email);
    expect(emails).not.toContain(users.studentB!.email);
    expect(emails).not.toContain(users.adminB!.email);
  });

  it("lets faculty invite students but not faculty or admins", async () => {
    const faculty = await ctx("facultyA", instA.slug);
    await expect(
      inviteMember(faculty, { email: `new-${S}@${DOMAIN_A}`, role: "STUDENT" })
    ).resolves.toBeTruthy();
    await expect(
      inviteMember(faculty, { email: `x-${S}@${DOMAIN_A}`, role: "FACULTY" })
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      inviteMember(faculty, { email: `y-${S}@${DOMAIN_A}`, role: "INSTITUTION_ADMIN" })
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("lets students invite no one", async () => {
    await expect(
      inviteMember(await ctx("studentA", instA.slug), {
        email: `z-${S}@${DOMAIN_A}`,
        role: "STUDENT",
      })
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("keeps role changes, suspension, export and audit for institution admins", async () => {
    const faculty = await ctx("facultyA", instA.slug);
    await expect(
      changeMemberRole(faculty, membership.studentA!, "FACULTY")
    ).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(
      setMembershipStatus(faculty, membership.studentA!, "SUSPENDED")
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(exportMembersCsv(faculty)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(listInstitutionAudit(faculty)).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("refuses changes to your own membership", async () => {
    const admin = await ctx("adminA", instA.slug);
    await expect(
      changeMemberRole(admin, membership.adminA!, "STUDENT")
    ).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});

describe("cross-tenant requests (IDOR)", () => {
  it("cannot change a role in another institution by id", async () => {
    const adminA = await ctx("adminA", instA.slug);
    await expect(
      changeMemberRole(adminA, membership.studentB!, "INSTITUTION_ADMIN")
    ).rejects.toMatchObject({ code: "not_found" });
    const row = await prisma.institutionMembership.findUnique({
      where: { id: membership.studentB! },
    });
    expect(row?.role).toBe("STUDENT");
  });

  it("cannot suspend or revoke another institution's member", async () => {
    const adminA = await ctx("adminA", instA.slug);
    for (const status of ["SUSPENDED", "REVOKED"] as const) {
      await expect(
        setMembershipStatus(adminA, membership.adminB!, status)
      ).rejects.toMatchObject({ code: "not_found" });
    }
    const row = await prisma.institutionMembership.findUnique({
      where: { id: membership.adminB! },
    });
    expect(row?.status).toBe("ACTIVE");
  });

  it("cannot revoke another institution's invitation", async () => {
    const { invitationId } = await inviteMember(await ctx("adminB", instB.slug), {
      email: `b-invitee-${S}@uni-b.test`,
      role: "STUDENT",
    });
    await expect(
      revokeInvitation(await ctx("adminA", instA.slug), invitationId)
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("exports only its own institution", async () => {
    const csv = await exportMembersCsv(await ctx("adminA", instA.slug));
    expect(csv).toContain(users.studentA!.email);
    expect(csv).not.toContain(users.studentB!.email);
    expect(csv).not.toContain(users.adminB!.email);
  });

  it("keeps each institution's audit log to itself", async () => {
    const auditA = await listInstitutionAudit(await ctx("adminA", instA.slug));
    expect(auditA.some((r) => r.summary.includes(`b-invitee-${S}`))).toBe(false);
    expect(auditA.some((r) => r.action === "members.exported")).toBe(true);
  });
});

describe("invitations", () => {
  it("joins only the account the invitation was sent to, once", async () => {
    await makeUser("invitee", `invitee-${S}@${DOMAIN_A}`);
    await inviteMember(await ctx("adminA", instA.slug), {
      email: users.invitee!.email.toUpperCase(),
      role: "FACULTY",
    });
    const token = lastLinkToken("/campus/invite");

    await expect(acceptInvitation(users.outsider!, token)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(acceptInvitation(users.invitee!, token)).resolves.toEqual({
      slug: instA.slug,
    });
    expect((await ctx("invitee", instA.slug)).role).toBe("FACULTY");
    await expect(acceptInvitation(users.invitee!, token)).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("rejects a forged or revoked token", async () => {
    await expect(
      acceptInvitation(users.outsider!, "not-a-real-token")
    ).rejects.toMatchObject({
      code: "not_found",
    });

    await makeUser("late", `late-${S}@${DOMAIN_A}`);
    const admin = await ctx("adminA", instA.slug);
    const { invitationId } = await inviteMember(admin, {
      email: users.late!.email,
      role: "STUDENT",
    });
    const token = lastLinkToken("/campus/invite");
    await revokeInvitation(admin, invitationId);
    await expect(acceptInvitation(users.late!, token)).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("rejects an expired token", async () => {
    await makeUser("expired", `expired-${S}@${DOMAIN_A}`);
    const { invitationId } = await inviteMember(await ctx("adminA", instA.slug), {
      email: users.expired!.email,
      role: "STUDENT",
    });
    const token = lastLinkToken("/campus/invite");
    await prisma.institutionInvitation.update({
      where: { id: invitationId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await expect(acceptInvitation(users.expired!, token)).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("stores only a hash of the token", async () => {
    const token = lastLinkToken("/campus/invite");
    expect(
      await prisma.institutionInvitation.findFirst({ where: { tokenHash: token } })
    ).toBeNull();
  });
});

describe("invitations cannot undo or outrank an admin (review findings)", () => {
  it("refuses to invite someone who is already an active member", async () => {
    await expect(
      inviteMember(await ctx("adminA", instA.slug), {
        email: users.facultyA!.email,
        role: "INSTITUTION_ADMIN",
      })
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("does not let faculty cancel an admin's pending invitation", async () => {
    await makeUser("futureAdmin", `future-admin-${S}@${DOMAIN_A}`);
    const { invitationId } = await inviteMember(await ctx("adminA", instA.slug), {
      email: users.futureAdmin!.email,
      role: "INSTITUTION_ADMIN",
    });
    await expect(
      inviteMember(await ctx("facultyA", instA.slug), {
        email: users.futureAdmin!.email,
        role: "STUDENT",
      })
    ).rejects.toMatchObject({ code: "conflict" });
    const still = await prisma.institutionInvitation.findUnique({ where: { id: invitationId } });
    expect(still?.revokedAt).toBeNull();
  });

  it("does not let an invitation lift a suspension", async () => {
    await makeUser("benched", `benched-${S}@${DOMAIN_A}`);
    await join("benched", instA.id, "STUDENT");
    await setMembershipStatus(await ctx("adminA", instA.slug), membership.benched!, "SUSPENDED");

    // Faculty may not even send one...
    await expect(
      inviteMember(await ctx("facultyA", instA.slug), {
        email: users.benched!.email,
        role: "STUDENT",
      })
    ).rejects.toMatchObject({ code: "forbidden" });
    // ...and one from an admin still cannot be used to reactivate.
    await inviteMember(await ctx("adminA", instA.slug), {
      email: users.benched!.email,
      role: "STUDENT",
    });
    const token = lastLinkToken("/campus/invite");
    await expect(acceptInvitation(users.benched!, token)).rejects.toMatchObject({
      code: "forbidden",
    });
    expect(await resolveMemberContext(users.benched!, instA.slug)).toBeNull();
  });

  it("lets an admin bring back a revoked member by invitation", async () => {
    await makeUser("returning", `returning-${S}@${DOMAIN_A}`);
    await join("returning", instA.id, "STUDENT");
    await setMembershipStatus(await ctx("adminA", instA.slug), membership.returning!, "REVOKED");
    await inviteMember(await ctx("adminA", instA.slug), {
      email: users.returning!.email,
      role: "STUDENT",
    });
    await acceptInvitation(users.returning!, lastLinkToken("/campus/invite"));
    expect((await ctx("returning", instA.slug)).role).toBe("STUDENT");
  });
});

describe("verified email domain enrolment", () => {
  it("requires a verified account address", async () => {
    await makeUser("domainUser", `domain-user-${S}@${DOMAIN_A}`);
    await expect(enrollByEmailDomain(users.domainUser!)).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("verifies an address only for the account it was sent to", async () => {
    await requestEmailVerification(users.domainUser!);
    const token = lastLinkToken("/campus/verify-email");
    expect(await confirmEmailVerification(users.outsider!, token)).toBe(false);
    expect(await confirmEmailVerification(users.domainUser!, token)).toBe(true);
    expect(await confirmEmailVerification(users.domainUser!, token)).toBe(false);
  });

  it("ignores a domain until DNS proves it", async () => {
    const { id, value } = await addDomain(users.platform!, instA.id, DOMAIN_A);
    expect(await enrollByEmailDomain(users.domainUser!)).toBeNull();

    const wrong = await verifyDomain(users.platform!, instA.id, id, async () => [
      ["tech-epitome-verify=nope"],
    ]);
    expect(wrong.verified).toBe(false);
    const right = await verifyDomain(users.platform!, instA.id, id, async () => [
      [value],
    ]);
    expect(right.verified).toBe(true);
  });

  it("enrols as STUDENT, never as staff", async () => {
    expect(await enrollByEmailDomain(users.domainUser!)).toEqual({ slug: instA.slug });
    expect((await ctx("domainUser", instA.slug)).role).toBe("STUDENT");
  });

  it("cannot be used to undo an admin's suspension", async () => {
    await makeUser("suspendedStudent", `suspended-${S}@${DOMAIN_A}`, {
      verified: true,
    });
    await join("suspendedStudent", instA.id, "STUDENT");
    await setMembershipStatus(
      await ctx("adminA", instA.slug),
      membership.suspendedStudent!,
      "SUSPENDED"
    );
    await expect(enrollByEmailDomain(users.suspendedStudent!)).rejects.toMatchObject({
      code: "forbidden",
    });
    expect(await resolveMemberContext(users.suspendedStudent!, instA.slug)).toBeNull();
  });

  it("does not let a non-admin claim a domain", async () => {
    await expect(
      addDomain(users.adminA!, instA.id, `claim-${S}.test`)
    ).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});

describe("revocation takes effect on the next request", () => {
  it("drops a revoked member's access immediately", async () => {
    await makeUser("leaver", `leaver-${S}@${DOMAIN_A}`);
    await join("leaver", instA.id, "FACULTY");
    expect(await resolveMemberContext(users.leaver!, instA.slug)).not.toBeNull();
    await setMembershipStatus(
      await ctx("adminA", instA.slug),
      membership.leaver!,
      "REVOKED"
    );
    expect(await resolveMemberContext(users.leaver!, instA.slug)).toBeNull();
    // REVOKED is terminal; only a new invitation brings someone back.
    await expect(
      setMembershipStatus(await ctx("adminA", instA.slug), membership.leaver!, "ACTIVE")
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("closes a suspended institution to its members but not to the operator", async () => {
    await setInstitutionStatus(users.platform!, instB.id, "SUSPENDED");
    try {
      expect(await resolveMemberContext(users.adminB!, instB.slug)).toBeNull();
      expect(await resolveMemberContext(users.platform!, instB.slug)).not.toBeNull();
    } finally {
      await setInstitutionStatus(users.platform!, instB.id, "ACTIVE");
    }
  });

  it("invalidates every session of a suspended account", async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: users.studentB!.id },
    });
    expect(isSessionCurrent(before, before.sessionVersion)).toBe(true);

    await setUserSuspended(users.platform!, users.studentB!.id, true);
    const suspended = await prisma.user.findUniqueOrThrow({
      where: { id: users.studentB!.id },
    });
    expect(isSessionCurrent(suspended, before.sessionVersion)).toBe(false);

    await setUserSuspended(users.platform!, users.studentB!.id, false);
    const back = await prisma.user.findUniqueOrThrow({
      where: { id: users.studentB!.id },
    });
    // Reactivation does not resurrect tokens minted before the suspension.
    expect(isSessionCurrent(back, before.sessionVersion)).toBe(false);
    expect(isSessionCurrent(back, back.sessionVersion)).toBe(true);
  });

  it("keeps platform suspension for platform admins", async () => {
    await expect(
      setUserSuspended(users.adminA!, users.studentA!.id, true)
    ).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(
      setUserSuspended(users.platform!, users.platform!.id, true)
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("guards", () => {
  it("never leaves an institution without an active admin", async () => {
    const admin = await ctx("adminA", instA.slug);
    await changeMemberRole(admin, membership.adminA2!, "FACULTY");
    await expect(leaveInstitution(admin)).rejects.toMatchObject({ code: "conflict" });
    await changeMemberRole(admin, membership.adminA2!, "INSTITUTION_ADMIN");
  });

  it("neutralises spreadsheet formulas in the export, even behind whitespace", async () => {
    await prisma.user.update({
      where: { id: users.facultyA!.id },
      data: { name: "  @SUM(1)" },
    });
    expect(await exportMembersCsv(await ctx("adminA", instA.slug))).toContain(`"'  @SUM(1)"`);
  });

  it("neutralises spreadsheet formulas in the export", async () => {
    await prisma.user.update({
      where: { id: users.studentA!.id },
      data: { name: '=HYPERLINK("x")' },
    });
    const csv = await exportMembersCsv(await ctx("adminA", instA.slug));
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });

  it("records an audit row for every change", async () => {
    const actions = (await listInstitutionAudit(await ctx("adminA", instA.slug))).map(
      (r) => r.action
    );
    for (const action of [
      "institution.created",
      "invitation.created",
      "invitation.accepted",
      "invitation.revoked",
      "domain.added",
      "domain.verified",
      "membership.domain_enrolled",
      "membership.suspended",
      "membership.revoked",
      "membership.role_changed",
      "members.exported",
    ]) {
      expect(actions).toContain(action);
    }
  });
});
