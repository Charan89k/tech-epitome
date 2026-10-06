import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Quota decisions over a stubbed database.
 *
 * The queries are a count and an aggregate over indexed columns; what can
 * go wrong is the arithmetic and the rules around them — the threshold,
 * the admin exemption, the site budget's units, and the come-back time —
 * so that is what is pinned here.
 */

const db = vi.hoisted(() => ({
  aIUsageRecord: { count: vi.fn(), findFirst: vi.fn(), aggregate: vi.fn() },
  interviewSession: { count: vi.fn(), findFirst: vi.fn() },
}));
const env = vi.hoisted(() => ({
  AI_DAILY_TURN_LIMIT: 3,
  AI_DAILY_INTERVIEW_LIMIT: 2,
  AI_DAILY_BUDGET_CENTS: undefined as number | undefined,
}));

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/env", () => ({ getEnv: () => env }));

const { checkAiTurnQuota, checkInterviewQuota } = await import("./quota");

const NOW = new Date("2026-10-06T12:00:00Z");
const learner = { id: "u1", role: "USER" as const };

beforeEach(() => {
  vi.clearAllMocks();
  env.AI_DAILY_BUDGET_CENTS = undefined;
  db.aIUsageRecord.aggregate.mockResolvedValue({ _sum: { costMilliCents: 0 } });
});

describe("checkAiTurnQuota", () => {
  it("allows turns under the limit", async () => {
    db.aIUsageRecord.count.mockResolvedValue(2);
    expect(await checkAiTurnQuota(learner, NOW)).toEqual({ ok: true });
  });

  it("refuses at the limit and says when it frees up", async () => {
    db.aIUsageRecord.count.mockResolvedValue(3);
    // The oldest counted turn was 21h ago, so one frees up in 3h.
    db.aIUsageRecord.findFirst.mockResolvedValue({
      createdAt: new Date(NOW.getTime() - 21 * 3600_000),
    });
    const decision = await checkAiTurnQuota(learner, NOW);
    expect(decision.ok).toBe(false);
    if (!decision.ok) {
      expect(decision.message).toContain("3 AI messages");
      expect(decision.message).toContain("about 3 hours");
      expect(decision.message).not.toMatch(/upgrade|premium|pro\b|pay/i);
    }
  });

  it("counts a rolling 24 hours", async () => {
    db.aIUsageRecord.count.mockResolvedValue(0);
    await checkAiTurnQuota(learner, NOW);
    const since = db.aIUsageRecord.count.mock.calls[0]![0].where.createdAt.gte as Date;
    expect(NOW.getTime() - since.getTime()).toBe(24 * 3600_000);
  });

  it("never limits an admin and never queries for one", async () => {
    expect(await checkAiTurnQuota({ id: "a", role: "ADMIN" }, NOW)).toEqual({
      ok: true,
    });
    expect(db.aIUsageRecord.count).not.toHaveBeenCalled();
  });

  it("stops everyone once the site budget is spent, in cents", async () => {
    env.AI_DAILY_BUDGET_CENTS = 500; // $5.00
    db.aIUsageRecord.count.mockResolvedValue(0);
    // The ledger stores tenth-of-a-cent integers: 5000 = $5.00.
    db.aIUsageRecord.aggregate.mockResolvedValue({ _sum: { costMilliCents: 4999 } });
    expect((await checkAiTurnQuota(learner, NOW)).ok).toBe(true);
    db.aIUsageRecord.aggregate.mockResolvedValue({ _sum: { costMilliCents: 5000 } });
    const decision = await checkAiTurnQuota(learner, NOW);
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.message).toMatch(/whole site/);
  });

  it("measures the budget from UTC midnight", async () => {
    env.AI_DAILY_BUDGET_CENTS = 100;
    db.aIUsageRecord.count.mockResolvedValue(0);
    await checkAiTurnQuota(learner, NOW);
    const gte = db.aIUsageRecord.aggregate.mock.calls[0]![0].where.createdAt
      .gte as Date;
    expect(gte.toISOString()).toBe("2026-10-06T00:00:00.000Z");
  });
});

describe("checkInterviewQuota", () => {
  it("allows interviews under the limit", async () => {
    db.interviewSession.count.mockResolvedValue(1);
    expect(await checkInterviewQuota(learner, NOW)).toEqual({ ok: true });
  });

  it("refuses at the limit with minutes when it is close", async () => {
    db.interviewSession.count.mockResolvedValue(2);
    db.interviewSession.findFirst.mockResolvedValue({
      startedAt: new Date(NOW.getTime() - 24 * 3600_000 + 20 * 60_000),
    });
    const decision = await checkInterviewQuota(learner, NOW);
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.message).toContain("about 20 minutes");
  });
});
