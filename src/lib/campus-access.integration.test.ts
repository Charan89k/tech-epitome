import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// The session helpers reach Auth.js; these tests pass users in directly.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { prisma } from "@/lib/db";

import { hasCampusAccess } from "./campus-access";

/**
 * Mock interviews, interview prep and roadmaps are the Campus offering: an
 * individual learner without a college must be refused on the server, not
 * just shown fewer links.
 */
const S = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
const ids = { users: [] as string[], institutions: [] as string[] };

type TestUser = { id: string; role: "USER" | "ADMIN" };

async function user(tag: string, role: "USER" | "ADMIN" = "USER"): Promise<TestUser> {
  const row = await prisma.user.create({
    data: { email: `campus-access-${tag}-${S}@test.local`, role },
    select: { id: true, role: true },
  });
  ids.users.push(row.id);
  return row;
}

async function member(
  userId: string,
  opts: {
    status?: "ACTIVE" | "SUSPENDED" | "REVOKED";
    college?: "ACTIVE" | "SUSPENDED";
  } = {}
): Promise<void> {
  const inst = await prisma.institution.create({
    data: {
      slug: `campus-access-${userId}`,
      name: "Access College",
      status: opts.college ?? "ACTIVE",
    },
  });
  ids.institutions.push(inst.id);
  await prisma.institutionMembership.create({
    data: {
      institutionId: inst.id,
      userId,
      role: "STUDENT",
      source: "INVITATION",
      status: opts.status ?? "ACTIVE",
    },
  });
}

let none: TestUser;
let active: TestUser;
let suspended: TestUser;
let suspendedCollege: TestUser;
let admin: TestUser;

beforeAll(async () => {
  none = await user("none");
  active = await user("active");
  await member(active.id);
  suspended = await user("suspended");
  await member(suspended.id, { status: "SUSPENDED" });
  suspendedCollege = await user("college");
  await member(suspendedCollege.id, { college: "SUSPENDED" });
  admin = await user("admin", "ADMIN");
});

afterAll(async () => {
  await prisma.institutionMembership.deleteMany({
    where: { userId: { in: ids.users } },
  });
  await prisma.institution.deleteMany({ where: { id: { in: ids.institutions } } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
});

describe("hasCampusAccess", () => {
  it("refuses an individual learner with no college", async () => {
    expect(await hasCampusAccess(none)).toBe(false);
  });

  it("allows an active member of an active college", async () => {
    expect(await hasCampusAccess(active)).toBe(true);
  });

  it("refuses a suspended membership", async () => {
    expect(await hasCampusAccess(suspended)).toBe(false);
  });

  it("refuses a member of a suspended college", async () => {
    expect(await hasCampusAccess(suspendedCollege)).toBe(false);
  });

  it("allows a platform admin, who supports colleges", async () => {
    expect(await hasCampusAccess(admin)).toBe(true);
  });
});
