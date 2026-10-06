import "server-only";

import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";

/**
 * Daily limits on AI use.
 *
 * Every AI feature is free, and every AI turn costs real money, so the
 * product needs a ceiling that does not depend on goodwill. Three, checked
 * before a call is made:
 *
 *   turns       tutor and interview messages per learner, rolling 24 hours
 *   interviews  new mock interviews per learner, rolling 24 hours
 *   budget      total spend across all learners today (UTC), optional
 *
 * The counts come from tables the product already writes — the usage
 * ledger and interview sessions — so the limits hold across every
 * serverless instance, unlike an in-memory counter, and cost no extra
 * writes. The per-minute burst limiter in lib/rate-limit.ts still guards
 * against floods; this guards against the steady drip that adds up.
 *
 * Admins are exempt so the people answering a bug report can reproduce it.
 * The messages name a time to come back, never a price: there is no paid
 * way past the limit, and there must never be one.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type QuotaDecision = { ok: true } | { ok: false; message: string };

type Who = { id: string; role: "USER" | "ADMIN" };

/** Before a tutor or interview turn. */
export async function checkAiTurnQuota(
  user: Who,
  now = new Date()
): Promise<QuotaDecision> {
  if (user.role === "ADMIN") return { ok: true };
  const env = getEnv();

  const budget = await checkSiteBudget(env.AI_DAILY_BUDGET_CENTS, now);
  if (!budget.ok) return budget;

  const since = new Date(now.getTime() - DAY_MS);
  const used = await prisma.aIUsageRecord.count({
    where: { userId: user.id, createdAt: { gte: since } },
  });
  if (used < env.AI_DAILY_TURN_LIMIT) return { ok: true };

  const oldest = await prisma.aIUsageRecord.findFirst({
    where: { userId: user.id, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  return {
    ok: false,
    message: `You have used today's ${env.AI_DAILY_TURN_LIMIT} AI messages. ${comeBack(oldest?.createdAt, now)} Everything else — problems, the visualizer, lessons and review — keeps working.`,
  };
}

/** Before starting a new mock interview. */
export async function checkInterviewQuota(
  user: Who,
  now = new Date()
): Promise<QuotaDecision> {
  if (user.role === "ADMIN") return { ok: true };
  const env = getEnv();

  const budget = await checkSiteBudget(env.AI_DAILY_BUDGET_CENTS, now);
  if (!budget.ok) return budget;

  const since = new Date(now.getTime() - DAY_MS);
  const started = await prisma.interviewSession.count({
    where: { userId: user.id, startedAt: { gte: since } },
  });
  if (started < env.AI_DAILY_INTERVIEW_LIMIT) return { ok: true };

  const oldest = await prisma.interviewSession.findFirst({
    where: { userId: user.id, startedAt: { gte: since } },
    orderBy: { startedAt: "asc" },
    select: { startedAt: true },
  });
  return {
    ok: false,
    message: `You have started ${env.AI_DAILY_INTERVIEW_LIMIT} mock interviews today, which is the daily limit. ${comeBack(oldest?.startedAt, now)}`,
  };
}

async function checkSiteBudget(
  budgetCents: number | undefined,
  now: Date
): Promise<QuotaDecision> {
  if (!budgetCents) return { ok: true };
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const spent = await prisma.aIUsageRecord.aggregate({
    where: { createdAt: { gte: midnight } },
    _sum: { costMilliCents: true },
  });
  // Ledger costs are tenth-of-a-cent integers.
  if ((spent._sum.costMilliCents ?? 0) < budgetCents * 10) return { ok: true };
  return {
    ok: false,
    message:
      "The AI features have reached today's limit for the whole site. They reset at midnight UTC. Everything else keeps working.",
  };
}

/** "You can use it again in about 3 hours." from the oldest counted event. */
function comeBack(oldest: Date | undefined, now: Date): string {
  if (!oldest) return "Try again tomorrow.";
  const ms = oldest.getTime() + DAY_MS - now.getTime();
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours <= 1) {
    const minutes = Math.max(1, Math.ceil(ms / 60_000));
    return `You can use it again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }
  return `You can use it again in about ${hours} hours.`;
}
