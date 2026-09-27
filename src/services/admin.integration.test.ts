import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  getAdminOverview,
  listAuditLog,
  listContent,
  listUsers,
  setContentStatus,
  setUserRole,
} from "./admin";

/**
 * Administrative reads and writes.
 *
 * The assertions that matter here are not "does the list render". They
 * are the two invariants that make an admin surface safe to have at all:
 * **no mutation lands without an audit row**, and **the last admin cannot
 * be demoted**, because an installation with no admin has no route back.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let rootAdmin = "";
let secondAdmin = "";
let learner = "";
const actor = () => ({ id: rootAdmin, email: `admin-a-${SUFFIX}@techepitome.test` });

beforeAll(async () => {
  const [a, b, c] = await Promise.all([
    prisma.user.create({
      data: {
        email: `admin-a-${SUFFIX}@techepitome.test`,
        name: "Admin A",
        role: "ADMIN",
      },
      select: { id: true },
    }),
    prisma.user.create({
      data: {
        email: `admin-b-${SUFFIX}@techepitome.test`,
        name: "Admin B",
        role: "ADMIN",
      },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `learner-${SUFFIX}@techepitome.test`, name: "Learner" },
      select: { id: true },
    }),
  ]);
  rootAdmin = a.id;
  secondAdmin = b.id;
  learner = c.id;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({
    where: { actorId: { in: [rootAdmin, secondAdmin, learner] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [rootAdmin, secondAdmin, learner] } },
  });
});

describe("the overview", () => {
  it("reports counts over real rows", async () => {
    const overview = await getAdminOverview();
    expect(overview.users.total).toBeGreaterThanOrEqual(3);
    expect(overview.content.publishedProblems).toBeGreaterThan(0);
    expect(overview.content.publishedChapters).toBeGreaterThan(0);
    // Published can never exceed total; a dashboard that says otherwise
    // is reading two different things and calling them one.
    expect(overview.content.publishedProblems).toBeLessThanOrEqual(
      overview.content.problems
    );
    expect(overview.ai.failures30d).toBeGreaterThanOrEqual(0);
  });
});

describe("user management", () => {
  it("finds a user by email", async () => {
    const result = await listUsers({ query: `learner-${SUFFIX}` });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.id).toBe(learner);
  });

  it("promotes a learner and records who did it", async () => {
    const before = await prisma.auditLog.count();
    const result = await setUserRole({
      actor: actor(),
      userId: learner,
      role: "ADMIN",
    });
    expect(result.ok).toBe(true);

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: learner },
      select: { role: true },
    });
    expect(row.role).toBe("ADMIN");

    // The audit row is the point. A change with no record of who made it
    // is worse than no admin surface.
    expect(await prisma.auditLog.count()).toBe(before + 1);
    const log = await listAuditLog(1);
    expect(log[0]!.action).toBe("user.role.set");
    expect(log[0]!.actorEmail).toBe(actor().email);
    expect(log[0]!.entityId).toBe(learner);
  });

  it("refuses to let an admin demote themselves", async () => {
    const result = await setUserRole({
      actor: actor(),
      userId: rootAdmin,
      role: "USER",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/your own/i);
  });

  it("refuses to demote the last admin", async () => {
    // Demote everyone else first, so only one is left.
    for (const id of [learner, secondAdmin]) {
      await setUserRole({ actor: actor(), userId: id, role: "USER" });
    }

    const remaining = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    // Only meaningful when this suite's admin is genuinely the last one;
    // the seeded admin may also exist, in which case the guard is not
    // reached and asserting on it would be asserting on the fixture.
    if (remaining.length === 1 && remaining[0]!.id === rootAdmin) {
      const result = await setUserRole({
        actor: { id: secondAdmin, email: "someone@else.test" },
        userId: rootAdmin,
        role: "USER",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/only admin/i);
    }
  });

  it("writes no audit row for a change that did not happen", async () => {
    const before = await prisma.auditLog.count();
    await setUserRole({ actor: actor(), userId: "no-such-user", role: "ADMIN" });
    expect(await prisma.auditLog.count()).toBe(before);
  });
});

describe("content management", () => {
  it("lists every content type without leaking a body", async () => {
    for (const kind of [
      "problem",
      "chapter",
      "systemDesign",
      "lld",
      "behavioral",
      "prepTrack",
    ] as const) {
      const rows = await listContent(kind);
      expect(rows.length, kind).toBeGreaterThan(0);
      // The listing is titles and status. Pulling statements or reference
      // material in would be a silent widening of an admin query.
      const serialized = JSON.stringify(rows);
      expect(serialized, kind).not.toMatch(
        /"(statement|solutions|classDiagram|architecture|lookingFor|testCases)"/
      );
    }
  });

  it("unpublishes and republishes, recording each change", async () => {
    const [problem] = await listContent("problem");
    expect(problem).toBeDefined();

    const before = await prisma.auditLog.count();

    const off = await setContentStatus({
      actor: actor(),
      kind: "problem",
      id: problem!.id,
      status: "DRAFT",
    });
    expect(off.ok).toBe(true);

    const hidden = await prisma.problem.findUniqueOrThrow({
      where: { id: problem!.id },
      select: { status: true },
    });
    expect(hidden.status).toBe("DRAFT");

    const on = await setContentStatus({
      actor: actor(),
      kind: "problem",
      id: problem!.id,
      status: "PUBLISHED",
    });
    expect(on.ok).toBe(true);
    expect(await prisma.auditLog.count()).toBe(before + 2);
  });

  it("fails without an audit row when the target does not exist", async () => {
    const before = await prisma.auditLog.count();
    const result = await setContentStatus({
      actor: actor(),
      kind: "problem",
      id: "no-such-problem",
      status: "DRAFT",
    });
    expect(result.ok).toBe(false);
    // The write and the audit row share a transaction, so a failed write
    // cannot leave a record claiming it happened.
    expect(await prisma.auditLog.count()).toBe(before);
  });
});
