import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";

/**
 * Database guarantees.
 *
 * Not a test of any one feature: these pin the schema-level properties
 * everything else assumes. Delete behaviour in particular is easy to get
 * wrong in a way nothing notices until somebody deletes an account and
 * takes an unrelated table with it — or, worse, leaves orphans behind.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let userId = "";
let problemId = "";
let sdProblemId = "";

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `db-${SUFFIX}@codeforge.test`, profile: { create: {} } },
    select: { id: true },
  });
  userId = user.id;

  const [problem, sd] = await Promise.all([
    prisma.problem.findFirstOrThrow({
      where: { status: "PUBLISHED" },
      select: { id: true },
    }),
    prisma.systemDesignProblem.findFirstOrThrow({
      where: { status: "PUBLISHED" },
      select: { id: true },
    }),
  ]);
  problemId = problem.id;
  sdProblemId = sd.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: userId } });
});

describe("deleting an account", () => {
  it("removes every row that belongs to it, and nothing else", async () => {
    // A throwaway account with one row in each owned table.
    const victim = await prisma.user.create({
      data: {
        email: `db-victim-${SUFFIX}@codeforge.test`,
        profile: { create: {} },
        bookmarks: { create: { entityType: "PROBLEM", entityId: problemId } },
        notes: {
          create: { entityType: "PROBLEM", entityId: problemId, body: "note" },
        },
        problemProgress: {
          create: { problem: { connect: { id: problemId } }, status: "SOLVED" },
        },
        reviewItems: {
          create: {
            entityType: "PROBLEM",
            entityId: problemId,
            dueAt: new Date(),
          },
        },
        activity: { create: { name: "problem_solved" } },
        notifications: {
          create: { kind: "MILESTONE", title: "t", body: "b" },
        },
        interviews: {
          create: { type: "DSA", problem: { connect: { id: problemId } } },
        },
        systemDesigns: {
          create: { problem: { connect: { id: sdProblemId } } },
        },
      },
      select: { id: true },
    });

    const before = {
      problems: await prisma.problem.count(),
      sdProblems: await prisma.systemDesignProblem.count(),
    };

    await prisma.user.delete({ where: { id: victim.id } });

    // Everything owned is gone.
    for (const [table, count] of [
      ["profile", prisma.profile.count({ where: { userId: victim.id } })],
      ["bookmark", prisma.bookmark.count({ where: { userId: victim.id } })],
      ["note", prisma.note.count({ where: { userId: victim.id } })],
      [
        "progress",
        prisma.userProblemProgress.count({ where: { userId: victim.id } }),
      ],
      ["review", prisma.reviewItem.count({ where: { userId: victim.id } })],
      ["activity", prisma.activityEvent.count({ where: { userId: victim.id } })],
      [
        "notification",
        prisma.notification.count({ where: { userId: victim.id } }),
      ],
      [
        "interview",
        prisma.interviewSession.count({ where: { userId: victim.id } }),
      ],
      [
        "systemDesign",
        prisma.systemDesignSubmission.count({ where: { userId: victim.id } }),
      ],
    ] as const) {
      expect(await count, `${table} rows survived`).toBe(0);
    }

    // And the content they touched is untouched. A cascade that reached
    // the catalogue would delete a problem because somebody solved it.
    expect(await prisma.problem.count()).toBe(before.problems);
    expect(await prisma.systemDesignProblem.count()).toBe(before.sdProblems);
  });

  it("leaves the audit trail behind", async () => {
    // Deliberately no foreign key: deleting an admin must not erase the
    // record of what they did.
    const admin = await prisma.user.create({
      data: { email: `db-admin-${SUFFIX}@codeforge.test`, role: "ADMIN" },
      select: { id: true, email: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "test.action",
        entity: "Test",
        summary: "A change that must outlive its author",
      },
    });

    await prisma.user.delete({ where: { id: admin.id } });

    const surviving = await prisma.auditLog.findFirst({
      where: { actorId: admin.id },
      select: { summary: true, actorEmail: true },
    });
    expect(surviving?.actorEmail).toBe(admin.email);

    await prisma.auditLog.deleteMany({ where: { actorId: admin.id } });
  });
});

describe("retiring content", () => {
  it("nulls an interview's brief rather than deleting the interview", async () => {
    // SetNull, not Cascade: retiring a problem must not delete somebody's
    // interview history. The transcript stands on its own.
    const throwaway = await prisma.problem.create({
      data: {
        slug: `db-throwaway-${SUFFIX}`,
        number: 800_000 + Math.floor(Math.random() * 90_000),
        title: "Throwaway",
        statement: [],
        difficulty: "EASY",
        status: "DRAFT",
      },
      select: { id: true },
    });

    const session = await prisma.interviewSession.create({
      data: { userId, type: "DSA", problemId: throwaway.id },
      select: { id: true },
    });
    await prisma.interviewMessage.create({
      data: { sessionId: session.id, role: "USER", content: "my answer" },
    });

    await prisma.problem.delete({ where: { id: throwaway.id } });

    const after = await prisma.interviewSession.findUnique({
      where: { id: session.id },
      select: { problemId: true, messages: { select: { id: true } } },
    });
    expect(after).not.toBeNull();
    expect(after!.problemId).toBeNull();
    expect(after!.messages).toHaveLength(1);
  });

  it("cascades an interview's messages when the session goes", async () => {
    const session = await prisma.interviewSession.create({
      data: { userId, type: "DSA", problemId },
      select: { id: true },
    });
    await prisma.interviewMessage.create({
      data: { sessionId: session.id, role: "USER", content: "x" },
    });

    await prisma.interviewSession.delete({ where: { id: session.id } });
    expect(
      await prisma.interviewMessage.count({ where: { sessionId: session.id } })
    ).toBe(0);
  });
});

describe("uniqueness", () => {
  it("refuses a second bookmark on the same thing", async () => {
    await prisma.bookmark.create({
      data: { userId, entityType: "PROBLEM", entityId: problemId },
    });

    await expect(
      prisma.bookmark.create({
        data: { userId, entityType: "PROBLEM", entityId: problemId },
      })
    ).rejects.toThrow();

    await prisma.bookmark.deleteMany({ where: { userId } });
  });

  it("refuses a second account on the same email", async () => {
    const email = `db-dupe-${SUFFIX}@codeforge.test`;
    const first = await prisma.user.create({
      data: { email },
      select: { id: true },
    });

    await expect(prisma.user.create({ data: { email } })).rejects.toThrow();

    await prisma.user.delete({ where: { id: first.id } });
  });

  it("refuses two profiles for one account", async () => {
    await expect(
      prisma.profile.create({ data: { userId } })
    ).rejects.toThrow();
  });

  it("refuses a second evaluation for one interview", async () => {
    const session = await prisma.interviewSession.create({
      data: { userId, type: "DSA", problemId },
      select: { id: true },
    });
    const payload = {
      sessionId: session.id,
      dimensions: [],
      strengths: [],
      improvements: [],
      summary: "s",
    };
    await prisma.interviewEvaluation.create({ data: payload });
    await expect(
      prisma.interviewEvaluation.create({ data: payload })
    ).rejects.toThrow();

    await prisma.interviewSession.delete({ where: { id: session.id } });
  });
});

describe("referential integrity", () => {
  it("refuses a row pointing at a user that does not exist", async () => {
    await expect(
      prisma.notification.create({
        data: {
          userId: "no-such-user",
          kind: "ACCOUNT",
          title: "t",
          body: "b",
        },
      })
    ).rejects.toThrow();
  });

  it("refuses an interview pointing at a brief that does not exist", async () => {
    await expect(
      prisma.interviewSession.create({
        data: { userId, type: "LLD", lldProblemId: "no-such-brief" },
      })
    ).rejects.toThrow();
  });
});
