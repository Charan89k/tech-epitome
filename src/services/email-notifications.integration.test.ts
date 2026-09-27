import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  ConsoleEmailProvider,
  RejectingEmailProvider,
  resetEmailProviderForTests,
  setEmailProvider,
} from "@/lib/email";
import {
  periodKeyFor,
  REVIEW_REMINDER_KIND,
  runReviewReminders,
  sendReviewReminder,
} from "./email-notifications";

/**
 * The review-reminder pipeline, against the real database.
 *
 * Every gate is exercised on its own, and the one that matters most is
 * idempotency: the unique index on `(userId, kind, periodKey)` is what
 * stops a scheduler firing twice from mailing somebody twice, and it has
 * to hold even when two runs overlap.
 *
 * The provider here is the console double, so no mail leaves the
 * machine. What travels through the pipeline is a real `SendResult` from
 * a real provider implementation — the failure case uses a provider that
 * genuinely rejects rather than a mock of the pipeline itself.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let problemId = "";
const created: string[] = [];

async function makeLearner(options: {
  tag: string;
  emailOptIn: boolean;
  withDueReview: boolean;
}): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: `mail-${options.tag}-${SUFFIX}@techepitome.test`,
      name: "Learner",
      profile: { create: { emailReviewReminders: options.emailOptIn } },
    },
    select: { id: true },
  });
  created.push(user.id);

  if (options.withDueReview) {
    await prisma.reviewItem.create({
      data: {
        userId: user.id,
        entityType: "PROBLEM",
        entityId: problemId,
        // Yesterday, so it is due.
        dueAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
  }

  return user.id;
}

beforeAll(async () => {
  const problem = await prisma.problem.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });
  problemId = problem.id;
});

afterEach(() => {
  resetEmailProviderForTests();
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: created } } });
  resetEmailProviderForTests();
});

describe("eligibility", () => {
  it("sends to a learner who opted in and has work waiting", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const userId = await makeLearner({
      tag: "eligible",
      emailOptIn: true,
      withDueReview: true,
    });

    expect(await sendReviewReminder({ userId })).toBe("sent");
    expect(outbox.outbox).toHaveLength(1);
    expect(outbox.outbox[0]!.subject).toMatch(/review/i);

    // And it was recorded as accepted, with the provider's own id.
    const row = await prisma.emailDelivery.findFirstOrThrow({
      where: { userId, kind: REVIEW_REMINDER_KIND },
      select: { status: true, provider: true, providerId: true, reason: true },
    });
    expect(row.status).toBe("accepted");
    expect(row.provider).toBe("console");
    expect(row.providerId).toBeTruthy();
    expect(row.reason).toBeNull();
  });

  it("sends nothing to a learner who did not opt in", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const userId = await makeLearner({
      tag: "optedout",
      emailOptIn: false,
      withDueReview: true,
    });

    expect(await sendReviewReminder({ userId })).toBe("opted-out");
    expect(outbox.outbox).toHaveLength(0);
    // No row at all: somebody who never asked leaves no trace.
    expect(
      await prisma.emailDelivery.count({ where: { userId } })
    ).toBe(0);
  });

  it("sends nothing when there is nothing due", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const userId = await makeLearner({
      tag: "nowork",
      emailOptIn: true,
      withDueReview: false,
    });

    expect(await sendReviewReminder({ userId })).toBe("no-due-reviews");
    expect(outbox.outbox).toHaveLength(0);
  });

  it("treats a future review as not due", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const userId = await makeLearner({
      tag: "future",
      emailOptIn: true,
      withDueReview: false,
    });
    await prisma.reviewItem.create({
      data: {
        userId,
        entityType: "PROBLEM",
        entityId: problemId,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    expect(await sendReviewReminder({ userId })).toBe("no-due-reviews");
    expect(outbox.outbox).toHaveLength(0);
  });
});

describe("idempotency", () => {
  it("sends once per period however many times it is invoked", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const userId = await makeLearner({
      tag: "once",
      emailOptIn: true,
      withDueReview: true,
    });

    expect(await sendReviewReminder({ userId })).toBe("sent");
    expect(await sendReviewReminder({ userId })).toBe("already-sent");
    expect(await sendReviewReminder({ userId })).toBe("already-sent");

    expect(outbox.outbox).toHaveLength(1);
    expect(
      await prisma.emailDelivery.count({
        where: { userId, kind: REVIEW_REMINDER_KIND },
      })
    ).toBe(1);
  });

  it("holds when two runs overlap", async () => {
    // The insert is the lock, not a time-window query — two callers can
    // both pass a `findFirst` and only one can win a unique index.
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const userId = await makeLearner({
      tag: "race",
      emailOptIn: true,
      withDueReview: true,
    });

    const outcomes = await Promise.all([
      sendReviewReminder({ userId }),
      sendReviewReminder({ userId }),
      sendReviewReminder({ userId }),
    ]);

    expect(outcomes.filter((o) => o === "sent")).toHaveLength(1);
    expect(outcomes.filter((o) => o === "already-sent")).toHaveLength(2);
    expect(outbox.outbox).toHaveLength(1);
  });

  it("sends again in the next period", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const userId = await makeLearner({
      tag: "nextday",
      emailOptIn: true,
      withDueReview: true,
    });

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    expect(periodKeyFor(today)).not.toBe(periodKeyFor(tomorrow));

    expect(await sendReviewReminder({ userId, now: today })).toBe("sent");
    expect(await sendReviewReminder({ userId, now: tomorrow })).toBe("sent");
    expect(outbox.outbox).toHaveLength(2);
  });

  it("does not retry within a period after a provider rejection", async () => {
    // A provider outage must not become a burst of eleven mails when it
    // recovers. The next period is soon enough.
    setEmailProvider(new RejectingEmailProvider());

    const userId = await makeLearner({
      tag: "norety",
      emailOptIn: true,
      withDueReview: true,
    });

    expect(await sendReviewReminder({ userId })).toBe("rejected");

    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);
    expect(await sendReviewReminder({ userId })).toBe("already-sent");
    expect(outbox.outbox).toHaveLength(0);
  });
});

describe("provider failure", () => {
  it("records a rejection as a rejection, never as a send", async () => {
    setEmailProvider(new RejectingEmailProvider());

    const userId = await makeLearner({
      tag: "rejected",
      emailOptIn: true,
      withDueReview: true,
    });

    expect(await sendReviewReminder({ userId })).toBe("rejected");

    const row = await prisma.emailDelivery.findFirstOrThrow({
      where: { userId, kind: REVIEW_REMINDER_KIND },
      select: { status: true, providerId: true, reason: true },
    });
    expect(row.status).toBe("rejected");
    // The central promise: nothing claims an id it does not have.
    expect(row.providerId).toBeNull();
    expect(row.reason).toBeTruthy();
  });
});

describe("the batch", () => {
  it("counts every outcome and mails only the eligible", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const eligible = await makeLearner({
      tag: "batch-yes",
      emailOptIn: true,
      withDueReview: true,
    });
    await makeLearner({
      tag: "batch-no",
      emailOptIn: false,
      withDueReview: true,
    });

    const summary = await runReviewReminders();

    expect(summary.provider).toBe("console");
    expect(summary.sent).toBeGreaterThanOrEqual(1);
    // The opted-out learner was considered and declined, not skipped
    // silently.
    expect(summary.optedOut).toBeGreaterThanOrEqual(1);

    const sentTo = await prisma.emailDelivery.count({
      where: { userId: eligible, status: "accepted" },
    });
    expect(sentTo).toBe(1);
  });

  it("is safe to run twice back to back", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    await makeLearner({
      tag: "batch-twice",
      emailOptIn: true,
      withDueReview: true,
    });

    const first = await runReviewReminders();
    const before = outbox.outbox.length;
    const second = await runReviewReminders();

    expect(first.sent).toBeGreaterThanOrEqual(1);
    expect(second.sent).toBe(0);
    expect(second.alreadySent).toBeGreaterThanOrEqual(1);
    expect(outbox.outbox).toHaveLength(before);
  });
});

describe("cascade", () => {
  it("removes delivery records with the account", async () => {
    const outbox = new ConsoleEmailProvider();
    setEmailProvider(outbox);

    const userId = await makeLearner({
      tag: "cascade",
      emailOptIn: true,
      withDueReview: true,
    });
    await sendReviewReminder({ userId });
    expect(await prisma.emailDelivery.count({ where: { userId } })).toBe(1);

    await prisma.user.delete({ where: { id: userId } });
    expect(await prisma.emailDelivery.count({ where: { userId } })).toBe(0);
  });
});
