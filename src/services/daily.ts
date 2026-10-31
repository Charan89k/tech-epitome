import "server-only";

import { prisma } from "@/lib/db";

/** Midnight UTC of the given instant: every learner shares one calendar. */
export function utcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Today's problem. The first request of the day fixes it; `skipDuplicates`
 * makes concurrent first requests agree, because the loser re-reads the row
 * the winner wrote rather than trusting its own pick.
 */
export async function getDailyChallenge(now = new Date()) {
  const date = utcDay(now);
  const include = {
    problem: { select: { slug: true, title: true, number: true, difficulty: true } },
  } as const;

  const existing = await prisma.dailyChallenge.findUnique({ where: { date }, include });
  if (existing) return existing;

  const published = await prisma.problem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { number: "asc" },
    select: { id: true },
  });
  if (published.length === 0) return null;

  // Walk the catalogue by day number, so no problem repeats until all have run.
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  const problem = published[dayNumber % published.length]!;
  await prisma.dailyChallenge.createMany({
    data: [{ date, problemId: problem.id }],
    skipDuplicates: true,
  });
  return prisma.dailyChallenge.findUnique({ where: { date }, include });
}

/** Consecutive days, ending today or yesterday, whose challenge the learner solved that day. */
export function dailyStreak(solvedDays: readonly Date[], now = new Date()): number {
  const days = new Set(solvedDays.map((d) => utcDay(d).getTime()));
  const today = utcDay(now).getTime();
  let cursor = days.has(today) ? today : today - 86_400_000;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 86_400_000;
  }
  return streak;
}

export async function getDailyProgress(userId: string, now = new Date()) {
  const since = new Date(utcDay(now).getTime() - 90 * 86_400_000);
  const challenges = await prisma.dailyChallenge.findMany({
    where: { date: { gte: since } },
    select: { date: true, problemId: true },
  });
  const accepted = await prisma.submission.findMany({
    where: {
      userId,
      isRun: false,
      status: "ACCEPTED",
      createdAt: { gte: since },
      problemId: { in: challenges.map((c) => c.problemId) },
    },
    select: { problemId: true, createdAt: true },
  });
  const solvedDays = challenges
    .filter((c) =>
      accepted.some(
        (s) =>
          s.problemId === c.problemId &&
          utcDay(s.createdAt).getTime() === c.date.getTime()
      )
    )
    .map((c) => c.date);
  return {
    streak: dailyStreak(solvedDays, now),
    solvedToday: solvedDays.some((d) => d.getTime() === utcDay(now).getTime()),
  };
}
