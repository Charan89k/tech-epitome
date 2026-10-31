import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { prisma } from "@/lib/db";
import { resetEmailProviderForTests, setEmailProvider } from "@/lib/email";
import type { EmailMessage, EmailProvider, SendResult } from "@/lib/email/types";
import { resolveMemberContext, type MemberContext } from "@/lib/tenancy/context";

import { exportClassCsv, getAnalytics } from "./campus-analytics";
import { addClassMember, createClass } from "./campus-classes";
import { sendReviewReminder } from "./email-notifications";
import { createInstitution } from "./institutions-platform";
import { runJob } from "./jobs";
import { applyRoster, previewRoster } from "./roster-import";

/**
 * Phase 7 against the real database: roster import (CSV edge cases, role
 * limits, retries), analytics accuracy and visibility, the audited export,
 * the single-run job guard, and email retries. Every refusal uses a real
 * id or name from the wrong side of the boundary.
 */

const S = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
type U = { id: string; email: string; name: string | null; role: "USER" | "ADMIN" };
const users: Record<string, U> = {};
let instA = { id: "", slug: "" };
let instB = { id: "", slug: "" };

/** A provider that answers from a script, recording what it was sent. */
const outbox: EmailMessage[] = [];
let script: SendResult["status"][] = [];
let retryable = true;
const scripted: EmailProvider = {
  name: "scripted",
  isConfigured: () => true,
  async send(message) {
    outbox.push(message);
    const status = script.shift() ?? "accepted";
    if (status === "accepted") {
      return { status, id: `m${outbox.length}`, provider: "scripted" };
    }
    if (status === "rejected") {
      return { status, provider: "scripted", reason: "HTTP 503", retryable };
    }
    return { status, provider: "scripted", reason: "not configured" };
  },
};

async function makeUser(key: string, role: "USER" | "ADMIN" = "USER") {
  users[key] = await prisma.user.create({
    data: { email: `${key.toLowerCase()}-${S}@ops.test`, name: key, role },
    select: { id: true, email: true, name: true, role: true },
  });
}

function join(
  key: string,
  institutionId: string,
  role: "STUDENT" | "FACULTY" | "INSTITUTION_ADMIN",
  status: "ACTIVE" | "SUSPENDED" = "ACTIVE"
) {
  return prisma.institutionMembership.create({
    data: { institutionId, userId: users[key]!.id, role, status, source: "PLATFORM" },
  });
}

async function ctx(key: string, slug = instA.slug): Promise<MemberContext> {
  const c = await resolveMemberContext(users[key]!, slug);
  if (!c) throw new Error(`${key} has no context in ${slug}`);
  return c;
}

const csv = (...lines: string[]) => lines.join("\n");
const ALL_TIME = () => ({ from: new Date(0), to: new Date() });

beforeAll(async () => {
  process.env.RATE_LIMIT_DISABLED = "true";
  setEmailProvider(scripted);
  await makeUser("platform", "ADMIN");
  for (const k of [
    "admin",
    "faculty",
    "faculty2",
    "s1",
    "s2",
    "s3",
    "suspended",
    "adminB",
  ]) {
    await makeUser(k);
  }
  // A display name a spreadsheet would execute.
  await prisma.user.update({
    where: { id: users.s1!.id },
    data: { name: '=HYPERLINK("x")' },
  });
  instA = await createInstitution(users.platform!, {
    name: "Ops A",
    slug: `ops-a-${S}`,
  });
  instB = await createInstitution(users.platform!, {
    name: "Ops B",
    slug: `ops-b-${S}`,
  });
  await join("admin", instA.id, "INSTITUTION_ADMIN");
  await join("faculty", instA.id, "FACULTY");
  await join("faculty2", instA.id, "FACULTY");
  for (const s of ["s1", "s2", "s3"]) await join(s, instA.id, "STUDENT");
  await join("suspended", instA.id, "STUDENT", "SUSPENDED");
  await join("adminB", instB.id, "INSTITUTION_ADMIN");
});

afterAll(async () => {
  resetEmailProviderForTests();
  await prisma.user.deleteMany({
    where: { id: { in: Object.values(users).map((u) => u.id) } },
  });
});

beforeEach(() => {
  script = [];
  retryable = true;
});

let classId = "";

describe("roster import", () => {
  it("refuses bad files as a whole", async () => {
    const a = await ctx("admin");
    const invalid = { code: "invalid" };
    await expect(previewRoster(a, "name\nx")).rejects.toMatchObject(invalid);
    await expect(previewRoster(a, "email,phone\na@x.test,1")).rejects.toMatchObject(
      invalid
    );
    await expect(previewRoster(a, 'email\n"unclosed')).rejects.toMatchObject(invalid);
    const big = ["email", ...Array.from({ length: 201 }, (_, i) => `u${i}@x.test`)];
    await expect(previewRoster(a, big.join("\n"))).rejects.toMatchObject(invalid);
    await expect(
      previewRoster(a, `email\n${"a".repeat(100_001)}`)
    ).rejects.toMatchObject(invalid);
  });

  it("explains every row and never trusts a class it cannot manage", async () => {
    ({ id: classId } = await createClass(await ctx("faculty"), {
      name: "Ops101",
      description: null,
    }));
    const f = await ctx("faculty");
    await addClassMember(f, classId, { email: users.s1!.email, role: "STUDENT" });
    await addClassMember(f, classId, { email: users.s2!.email, role: "STUDENT" });

    const preview = await previewRoster(
      await ctx("admin"),
      csv(
        "Email,Role,Class",
        `new1-${S}@ops.test,,`,
        "not-an-email,,",
        `NEW1-${S}@OPS.TEST,student,`,
        `new2-${S}@ops.test,boss,`,
        `${users.s1!.email},,`,
        `${users.s3!.email},,ops101`,
        `${users.suspended!.email},,`,
        `new3-${S}@ops.test,,No Such Class`,
        `new4-${S}@ops.test,faculty,`
      )
    );
    const by = (line: number) => preview.rows.find((r) => r.line === line)!;
    expect(by(2).action).toBe("invite");
    expect(by(3)).toMatchObject({
      action: "error",
      message: expect.stringMatching(/valid email/),
    });
    expect(by(4)).toMatchObject({ action: "error", message: "Duplicate of line 2." });
    expect(by(5)).toMatchObject({
      action: "error",
      message: expect.stringMatching(/Role must be/),
    });
    expect(by(6)).toMatchObject({ action: "skip", message: "Already a member." });
    expect(by(7).action).toBe("enrol");
    expect(by(8)).toMatchObject({
      action: "error",
      message: expect.stringMatching(/suspended/),
    });
    expect(by(9)).toMatchObject({
      action: "error",
      message: expect.stringMatching(/No class named/),
    });
    expect(by(10).action).toBe("invite");
    expect(preview.counts).toEqual({ invite: 2, enrol: 1, skip: 1, error: 5 });

    // Faculty may invite students only, and only into classes they teach.
    const other = await previewRoster(
      await ctx("faculty2"),
      csv("email,role,class", `x-${S}@ops.test,FACULTY,`, `${users.s3!.email},,Ops101`)
    );
    expect(other.rows.map((r) => r.message)).toEqual([
      "You cannot grant that role.",
      'You do not manage the class "Ops101".',
    ]);
  });

  it("imports, records email failures, audits, and is safe to rerun", async () => {
    const a = await ctx("admin");
    const file = csv(
      "email,class",
      `fresh1-${S}@ops.test,`,
      `fresh2-${S}@ops.test,`,
      `${users.s3!.email},Ops101`
    );
    script = ["accepted", "rejected"];
    const first = await applyRoster(a, file);
    expect(first.counts).toMatchObject({ invite: 2, enrol: 1, error: 0 });
    expect(first.rows[1]!.message).toMatch(/not delivered/);
    const invitation = await prisma.institutionInvitation.findFirstOrThrow({
      where: { institutionId: instA.id, email: `fresh2-${S}@ops.test` },
    });
    expect(invitation).toMatchObject({
      emailStatus: "rejected",
      emailReason: "HTTP 503",
    });
    expect(
      await prisma.cohortMember.count({
        where: { cohortId: classId, userId: users.s3!.id, removedAt: null },
      })
    ).toBe(1);

    const sent = outbox.length;
    const again = await applyRoster(a, file);
    expect(again.counts).toMatchObject({ invite: 0, skip: 2 });
    expect(outbox.length).toBe(sent);
    expect(
      await prisma.institutionInvitation.count({
        where: {
          institutionId: instA.id,
          email: { startsWith: "fresh" },
          revokedAt: null,
        },
      })
    ).toBe(2);
    expect(
      await prisma.institutionAuditLog.count({
        where: { institutionId: instA.id, action: "members.imported" },
      })
    ).toBe(2);
  });

  it("is refused to students and scoped to the caller's institution", async () => {
    await expect(
      previewRoster(await ctx("s1"), "email\nx@y.test")
    ).rejects.toMatchObject({
      code: "forbidden",
    });
    const b = await previewRoster(
      await ctx("adminB", instB.slug),
      csv("email,class", `${users.s1!.email},Ops101`)
    );
    expect(b.rows[0]).toMatchObject({
      action: "error",
      message: expect.stringMatching(/No class named/),
    });
  });
});

describe("analytics", () => {
  let assessmentId = "";

  beforeAll(async () => {
    // s1, s2 were added directly and s3 by the import: three active students.
    const a = await prisma.assessment.create({
      data: {
        institutionId: instA.id,
        cohortId: classId,
        title: "Unit test",
        instructions: "",
        status: "CLOSED",
        closesAt: new Date(Date.now() - 86_400_000),
        createdById: users.faculty!.id,
      },
    });
    assessmentId = a.id;
    const version = await prisma.assessmentVersion.create({
      data: {
        institutionId: instA.id,
        cohortId: classId,
        assessmentId,
        version: 1,
        questions: [],
        maxScore: 10,
        publishedById: users.faculty!.id,
      },
    });
    const attempt = (key: string, score: number, needsGrading = false) =>
      prisma.assessmentAttempt.create({
        data: {
          institutionId: instA.id,
          cohortId: classId,
          assessmentId,
          versionId: version.id,
          userId: users[key]!.id,
          number: 1,
          status: "SUBMITTED",
          deadlineAt: new Date(),
          submittedAt: new Date(),
          score,
          maxScore: 10,
          needsGrading,
        },
      });
    await attempt("s1", 8);
    await attempt("s2", 4, true);
  });

  it("reports participation and the median from stored attempts only", async () => {
    const data = await getAnalytics(await ctx("faculty"), {
      from: new Date(Date.now() - 30 * 86_400_000),
      to: new Date(),
    });
    const cls = data.classes.find((c) => c.id === classId)!;
    expect(cls.students).toBe(3);
    expect(cls.assessments.find((x) => x.id === assessmentId)).toMatchObject({
      participated: 2,
      participation: 66.7,
      graded: 1,
      pendingGrading: 1,
      medianScore: 80,
    });
    // Faculty see no institution enrolment; admins do.
    expect(data.enrolment).toBeNull();
    const admin = await getAnalytics(await ctx("admin"), ALL_TIME());
    expect(admin.enrolment!.byRole.find((r) => r.role === "STUDENT")).toMatchObject({
      active: 3,
      suspended: 1,
    });
  });

  it("shows no data as null, not zero, and respects the date range", async () => {
    const { id: empty } = await createClass(await ctx("faculty"), {
      name: "Empty",
      description: null,
    });
    await prisma.assessment.create({
      data: {
        institutionId: instA.id,
        cohortId: empty,
        title: "Nobody",
        instructions: "",
        status: "CLOSED",
        closesAt: new Date(Date.now() - 86_400_000),
        createdById: users.faculty!.id,
      },
    });
    const data = await getAnalytics(await ctx("faculty"), {
      ...ALL_TIME(),
      classId: empty,
    });
    expect(data.classes[0]!.assessments[0]).toMatchObject({
      participation: null,
      medianScore: null,
    });
    const future = await getAnalytics(await ctx("faculty"), {
      from: new Date(Date.now() + 86_400_000),
      to: new Date(Date.now() + 2 * 86_400_000),
      classId,
    });
    expect(future.classes[0]!.assessments).toEqual([]);
  });

  it("limits what each role and tenant can see", async () => {
    const other = await getAnalytics(await ctx("faculty2"), ALL_TIME());
    expect(other.classes.map((c) => c.id)).not.toContain(classId);
    await expect(
      getAnalytics(await ctx("faculty2"), { ...ALL_TIME(), classId })
    ).rejects.toMatchObject({ code: "not_found" });
    await expect(getAnalytics(await ctx("s1"), ALL_TIME())).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(
      getAnalytics(await ctx("adminB", instB.slug), { ...ALL_TIME(), classId })
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("exports one class for its teachers only, formula-safe and audited", async () => {
    const { csv: out } = await exportClassCsv(
      await ctx("faculty"),
      classId,
      ALL_TIME()
    );
    expect(out).toContain(`"'=HYPERLINK(""x"")"`);
    expect(out).toContain('"80"');
    expect(out).toContain('"awaiting grading"');
    expect(out).toContain('"not attempted"');
    expect(
      await prisma.institutionAuditLog.count({
        where: { action: "analytics.exported", targetId: classId },
      })
    ).toBe(1);

    await expect(
      exportClassCsv(await ctx("faculty2"), classId, ALL_TIME())
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      exportClassCsv(await ctx("adminB", instB.slug), classId, ALL_TIME())
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("operations", () => {
  it("runs a job once even when two calls race, and records failures", async () => {
    const job = `test-job-${S}`;
    let calls = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const first = runJob(job, async () => {
      calls += 1;
      await gate;
      return { ok: true };
    });
    await new Promise((r) => setTimeout(r, 100));
    const second = await runJob(job, async () => {
      calls += 1;
      return { ok: true };
    });
    release();
    expect(second.status).toBe("already-running");
    expect((await first).status).toBe("succeeded");
    expect(calls).toBe(1);

    const failed = await runJob(job, async () => {
      throw new Error("boom");
    });
    expect(failed).toMatchObject({ status: "failed", error: "Error: boom" });
  });

  it("takes over a run that never finished", async () => {
    const job = `stale-job-${S}`;
    await prisma.jobRun.create({
      data: { job, status: "RUNNING", startedAt: new Date(Date.now() - 2 * 3_600_000) },
    });
    expect((await runJob(job, async () => ({}))).status).toBe("succeeded");
    expect(await prisma.jobRun.count({ where: { job, status: "STALE" } })).toBe(1);
  });

  async function dueReminder(key: string) {
    const user = users[key]!;
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, emailReviewReminders: true },
      update: { emailReviewReminders: true },
    });
    await prisma.reviewItem.create({
      data: {
        userId: user.id,
        entityType: "PROBLEM",
        entityId: `p-${key}-${S}`,
        dueAt: new Date(0),
      },
    });
    return user.id;
  }

  it("retries a retryable rejection, and two racing runs send only once", async () => {
    const userId = await dueReminder("s2");
    const now = new Date();
    script = ["rejected"];
    expect(await sendReviewReminder({ userId, now })).toBe("rejected");

    script = ["accepted", "accepted"];
    const both = await Promise.all([
      sendReviewReminder({ userId, now }),
      sendReviewReminder({ userId, now }),
    ]);
    expect(both.sort()).toEqual(["already-sent", "sent"]);
    const row = await prisma.emailDelivery.findFirstOrThrow({
      where: { userId, kind: "review-reminder" },
    });
    expect(row).toMatchObject({ status: "accepted", attempts: 2 });
    expect(await sendReviewReminder({ userId, now })).toBe("already-sent");
  });

  it("does not retry a non-retryable rejection", async () => {
    const userId = await dueReminder("s3");
    const now = new Date();
    retryable = false;
    script = ["rejected"];
    expect(await sendReviewReminder({ userId, now })).toBe("rejected");
    expect(await sendReviewReminder({ userId, now })).toBe("already-sent");
  });
});
