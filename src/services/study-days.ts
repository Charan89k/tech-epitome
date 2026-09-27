import "server-only";

import { prisma } from "@/lib/db";
import { daysBetweenUtc, utcDayStart } from "@/lib/dates";

/**
 * Per-day activity counters, which streaks and the dashboard read from.
 *
 * **Deliberately not a server action.** This lived in
 * `app/(shell)/learn/actions.ts`, a `"use server"` module — and every
 * export of such a module is a callable endpoint with a public id. Since
 * it takes a `userId` and checks nothing, anyone who learned that id
 * could have written study-day rows, XP and streak counters against any
 * account. Nothing in the product called it that way, so nothing looked
 * wrong.
 *
 * It is a service now, so it is unreachable from a browser at all. The
 * callers are server actions that have already authenticated and pass
 * their own `user.id`; the `userId` parameter is safe here precisely
 * because this module cannot be invoked from outside the server.
 */
export async function touchStudyDay(
  userId: string,
  delta: { seconds: number; chapters: number; xp: number; solved?: number }
): Promise<void> {
  const now = new Date();
  const today = utcDayStart(now);

  await prisma.studyDay.upsert({
    where: { userId_day: { userId, day: today } },
    create: {
      userId,
      day: today,
      seconds: delta.seconds,
      chapters: delta.chapters,
      solved: delta.solved ?? 0,
      xp: delta.xp,
    },
    update: {
      seconds: { increment: delta.seconds },
      chapters: { increment: delta.chapters },
      solved: { increment: delta.solved ?? 0 },
      xp: { increment: delta.xp },
    },
  });

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { currentStreak: true, longestStreak: true, lastActiveOn: true },
  });

  const previous = profile?.lastActiveOn ?? null;
  const gap = previous ? daysBetweenUtc(previous, now) : null;

  const currentStreak =
    gap === 0
      ? (profile?.currentStreak ?? 1) // already counted today
      : gap === 1
        ? (profile?.currentStreak ?? 0) + 1 // consecutive day
        : 1; // first day, or the streak was broken

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      currentStreak,
      longestStreak: currentStreak,
      studySeconds: delta.seconds,
      totalXp: delta.xp,
      lastActiveOn: now,
    },
    update: {
      currentStreak,
      longestStreak: Math.max(profile?.longestStreak ?? 0, currentStreak),
      studySeconds: { increment: delta.seconds },
      totalXp: { increment: delta.xp },
      lastActiveOn: now,
    },
  });
}