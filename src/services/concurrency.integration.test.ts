import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

/**
 * Races that only appear with real parallel connections. The suite's default
 * pool is 1, which serialises everything and hides them, so these use a larger
 * pool. Skipped on PGlite, which serves one connection.
 */
process.env.DATABASE_POOL_MAX = "8";

const { prisma } = await import("@/lib/db");
const { ensureReviewItem } = await import("./review");
const { getDailyChallenge, utcDay } = await import("./daily");
const { enterContest } = await import("./contests");
const { resetPassword, issueResetLinkAsAdmin } = await import("./password-reset");

const tag = `race-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let userId = "";
let realPostgres = false;
const FUTURE = new Date("2099-06-15T12:00:00Z");

describe("concurrent writes", () => {
  beforeAll(async () => {
    const [{ version }] = await prisma.$queryRaw<
      { version: string }[]
    >`select version()`;
    realPostgres =
      !/pglite/i.test(version) && !process.env.DATABASE_URL?.includes("template1");
    const user = await prisma.user.create({
      data: {
        email: `${tag}@techepitome.test`,
        passwordHash: "x",
        profile: { create: {} },
      },
      select: { id: true },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.dailyChallenge.deleteMany({ where: { date: utcDay(FUTURE) } });
    await prisma.contest.deleteMany({ where: { slug: tag } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("ensureReviewItem creates one item under parallel calls", async () => {
    if (!realPostgres) return;
    const entityId = `${tag}-entity`;
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () => ensureReviewItem(userId, "PATTERN", entityId))
    );
    expect(results.filter((r) => r.status === "rejected")).toEqual([]);
    expect(
      await prisma.reviewItem.count({
        where: { userId, entityType: "PATTERN", entityId },
      })
    ).toBe(1);
  });

  it("every parallel first request of a day gets the same challenge", async () => {
    if (!realPostgres) return;
    await prisma.dailyChallenge.deleteMany({ where: { date: utcDay(FUTURE) } });
    const results = await Promise.all(
      Array.from({ length: 12 }, () => getDailyChallenge(FUTURE))
    );
    expect(new Set(results.map((r) => r?.problemId)).size).toBe(1);
    expect(await prisma.dailyChallenge.count({ where: { date: utcDay(FUTURE) } })).toBe(
      1
    );
  });

  it("entering a contest many times at once leaves one entry", async () => {
    if (!realPostgres) return;
    await prisma.contest.create({
      data: {
        slug: tag,
        title: tag,
        description: "race",
        startsAt: new Date(),
        endsAt: FUTURE,
        createdById: userId,
      },
    });
    const results = await Promise.all(
      Array.from({ length: 12 }, () => enterContest(tag, userId))
    );
    expect(results.every(Boolean)).toBe(true);
    expect(
      await prisma.contestEntry.count({ where: { userId, contest: { slug: tag } } })
    ).toBe(1);
  });

  it("a reset link works exactly once under parallel use, and ends sessions once", async () => {
    if (!realPostgres) return;
    const token = await issueResetLinkAsAdmin(
      { id: userId, email: `${tag}@techepitome.test`, role: "ADMIN" },
      userId
    );
    expect(token).toBeTruthy();
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { sessionVersion: true },
    });
    const results = await Promise.all(
      Array.from({ length: 6 }, () => resetPassword(token!, "a-long-enough-password"))
    );
    expect(results.filter(Boolean)).toHaveLength(1);
    const after = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { sessionVersion: true },
    });
    expect(after.sessionVersion).toBe(before.sessionVersion + 1);
  });
});
