import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { awardAchievements, listAchievements } from "./achievements";

/**
 * Achievements.
 *
 * The property that matters is idempotence. Counters are recomputed from
 * the learner's own rows rather than incremented, so running the award
 * pass twice must award nothing twice — otherwise every resubmission of
 * an already-solved problem would mint another badge.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
let problemIds: string[] = [];

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `ach-alice-${SUFFIX}@techepitome.test`, profile: { create: {} } },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `ach-bob-${SUFFIX}@techepitome.test`, profile: { create: {} } },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;

  const problems = await prisma.problem.findMany({
    where: { status: "PUBLISHED" },
    take: 12,
    select: { id: true },
  });
  problemIds = problems.map((row) => row.id);
  expect(problemIds.length).toBeGreaterThanOrEqual(10);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

async function solve(userId: string, count: number) {
  for (const problemId of problemIds.slice(0, count)) {
    await prisma.userProblemProgress.upsert({
      where: { userId_problemId: { userId, problemId } },
      create: { userId, problemId, status: "SOLVED", firstSolvedAt: new Date() },
      update: { status: "SOLVED" },
    });
  }
}

describe("awarding", () => {
  it("awards nothing to a learner who has done nothing", async () => {
    expect(await awardAchievements(alice)).toHaveLength(0);
  });

  it("awards the first-problem milestone on the first solve", async () => {
    await solve(alice, 1);

    const earned = await awardAchievements(alice);
    expect(earned.map((a) => a.slug)).toContain("first-problem");
  });

  it("is idempotent — a second pass awards nothing", async () => {
    // Counters are recomputed, not incremented, so this is the property
    // that stops a resubmission minting a duplicate badge.
    expect(await awardAchievements(alice)).toHaveLength(0);

    const rows = await prisma.userAchievement.count({ where: { userId: alice } });
    await awardAchievements(alice);
    await awardAchievements(alice);
    expect(await prisma.userAchievement.count({ where: { userId: alice } })).toBe(
      rows
    );
  });

  it("awards a later threshold once it is crossed, and not before", async () => {
    await solve(alice, 9);
    expect((await awardAchievements(alice)).map((a) => a.slug)).not.toContain(
      "ten-problems"
    );

    await solve(alice, 10);
    expect((await awardAchievements(alice)).map((a) => a.slug)).toContain(
      "ten-problems"
    );
  });

  it("writes a notification for each new achievement", async () => {
    const notifications = await prisma.notification.findMany({
      where: { userId: alice, kind: "MILESTONE" },
      select: { title: true },
    });
    expect(notifications.length).toBeGreaterThan(0);
  });

  it("awards nothing to a different learner", async () => {
    expect(await prisma.userAchievement.count({ where: { userId: bob } })).toBe(0);
  });
});

describe("listing", () => {
  it("shows progress towards the locked ones", async () => {
    const all = await listAchievements(alice);
    expect(all.length).toBeGreaterThan(0);

    const unlocked = all.filter((a) => a.unlockedAt !== null);
    const locked = all.filter((a) => a.unlockedAt === null);
    expect(unlocked.length).toBeGreaterThan(0);
    expect(locked.length).toBeGreaterThan(0);

    for (const item of all) {
      // Never over-report: a locked badge showing 60/50 is nonsense.
      expect(item.current).toBeLessThanOrEqual(item.threshold);
      expect(item.threshold).toBeGreaterThan(0);
    }

    const fifty = all.find((a) => a.slug === "fifty-problems");
    expect(fifty?.unlockedAt).toBeNull();
    expect(fifty?.current).toBe(10);
  });

  it("reports nothing unlocked for a learner who has done nothing", async () => {
    const all = await listAchievements(bob);
    expect(all.every((a) => a.unlockedAt === null)).toBe(true);
    expect(all.every((a) => a.current === 0)).toBe(true);
  });
});
