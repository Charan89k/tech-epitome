import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { addDays, utcDayStart } from "@/lib/dates";
import { EASE_DEFAULT } from "@/lib/review/scheduler";
import {
  bumpReviewPriority,
  ensureReviewItem,
  getRecentlyReviewed,
  getReviewQueue,
  getReviewSummary,
  gradeReviewItem,
  initialEaseForProblem,
} from "./review";

/**
 * Persistence, isolation and ordering, against the real database.
 *
 * The scheduler's arithmetic is covered exhaustively by its own unit tests.
 * What cannot be tested in isolation is everything around it: that the
 * unique constraint really does prevent duplicates, that a query naming
 * another user's item genuinely returns nothing, and that the queue comes
 * back in the order the service claims.
 *
 * Each run creates its own users and deletes them afterwards, so the suite
 * is repeatable and leaves no residue. Deleting a user cascades to their
 * review items.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
/** Real published entity ids, so prompt resolution has something to find. */
let patternIds: string[] = [];
let chapterId = "";

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `review-alice-${SUFFIX}@techepitome.test`, name: "Alice" },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `review-bob-${SUFFIX}@techepitome.test`, name: "Bob" },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;

  const patterns = await prisma.pattern.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { slug: "asc" },
    take: 5,
    select: { id: true },
  });
  patternIds = patterns.map((pattern) => pattern.id);

  const chapter = await prisma.chapter.findFirst({
    where: { status: "PUBLISHED", keyTakeaways: { isEmpty: false } },
    orderBy: { slug: "asc" },
    select: { id: true },
  });
  chapterId = chapter?.id ?? "";

  expect(patternIds.length, "seed the database before running these").toBeGreaterThan(3);
  expect(chapterId).not.toBe("");
});

afterAll(async () => {
  // Cascades to review items, progress and activity.
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

// ---------------------------------------------------------------------------

describe("creating review items", () => {
  it("creates one item and schedules it for tomorrow", async () => {
    const now = new Date("2026-05-10T14:00:00.000Z");
    await ensureReviewItem(alice, "PATTERN", patternIds[0]!, { now });

    const item = await prisma.reviewItem.findUnique({
      where: {
        userId_entityType_entityId: {
          userId: alice,
          entityType: "PATTERN",
          entityId: patternIds[0]!,
        },
      },
    });

    expect(item).not.toBeNull();
    expect(item!.stage).toBe("NEW");
    expect(item!.dueAt.toISOString()).toBe("2026-05-11T00:00:00.000Z");
    expect(item!.ease).toBe(EASE_DEFAULT);
    expect(item!.totalReviews).toBe(0);
  });

  it("is idempotent — repeated creation never duplicates", async () => {
    const entityId = patternIds[1]!;

    await Promise.all([
      ensureReviewItem(alice, "PATTERN", entityId),
      ensureReviewItem(alice, "PATTERN", entityId),
      ensureReviewItem(alice, "PATTERN", entityId),
    ]);
    await ensureReviewItem(alice, "PATTERN", entityId);

    const count = await prisma.reviewItem.count({
      where: { userId: alice, entityType: "PATTERN", entityId },
    });
    expect(count).toBe(1);
  });

  it("never resets an existing schedule", async () => {
    // Re-completing a chapter or re-solving a problem must not undo review
    // history the learner has built up.
    const entityId = patternIds[2]!;
    await ensureReviewItem(alice, "PATTERN", entityId);

    const item = await prisma.reviewItem.findFirstOrThrow({
      where: { userId: alice, entityType: "PATTERN", entityId },
    });
    await gradeReviewItem(alice, item.id, "EASY", new Date("2026-05-10T10:00:00.000Z"));

    const afterGrading = await prisma.reviewItem.findFirstOrThrow({
      where: { id: item.id },
    });

    await ensureReviewItem(alice, "PATTERN", entityId);

    const afterRecreate = await prisma.reviewItem.findFirstOrThrow({
      where: { id: item.id },
    });
    expect(afterRecreate.dueAt.toISOString()).toBe(afterGrading.dueAt.toISOString());
    expect(afterRecreate.intervalDays).toBe(afterGrading.intervalDays);
    expect(afterRecreate.stage).toBe(afterGrading.stage);
  });

  it("lets two users track the same entity independently", async () => {
    const entityId = patternIds[0]!;
    await ensureReviewItem(bob, "PATTERN", entityId);

    const count = await prisma.reviewItem.count({
      where: { entityType: "PATTERN", entityId, userId: { in: [alice, bob] } },
    });
    expect(count).toBe(2);
  });

  it("derives a lower starting ease when the solve needed help", () => {
    expect(initialEaseForProblem(0, false)).toBe(EASE_DEFAULT);
    expect(initialEaseForProblem(1, false)).toBeLessThan(EASE_DEFAULT);
    expect(initialEaseForProblem(3, false)).toBeLessThan(initialEaseForProblem(1, false));
    expect(initialEaseForProblem(0, true)).toBeLessThan(initialEaseForProblem(3, false));
  });
});

// ---------------------------------------------------------------------------

describe("grading", () => {
  it("persists the new schedule and counts the review", async () => {
    await ensureReviewItem(bob, "CHAPTER", chapterId);
    const item = await prisma.reviewItem.findFirstOrThrow({
      where: { userId: bob, entityType: "CHAPTER", entityId: chapterId },
    });

    const at = new Date("2026-05-12T09:00:00.000Z");
    const outcome = await gradeReviewItem(bob, item.id, "GOOD", at);

    expect(outcome).not.toBeNull();
    expect(outcome!.intervalDays).toBe(2);
    expect(outcome!.stage).toBe("REVIEW");

    const stored = await prisma.reviewItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(stored.stage).toBe("REVIEW");
    expect(stored.intervalDays).toBe(2);
    expect(stored.repetitions).toBe(1);
    expect(stored.totalReviews).toBe(1);
    expect(stored.lastGrade).toBe("GOOD");
    expect(stored.lastReviewedAt?.toISOString()).toBe(at.toISOString());
    expect(stored.dueAt.toISOString()).toBe("2026-05-14T00:00:00.000Z");
  });

  it("returns null for an item that does not exist", async () => {
    expect(await gradeReviewItem(alice, "does-not-exist", "GOOD")).toBeNull();
  });

  it("accumulates totalReviews across a session", async () => {
    const entityId = patternIds[3]!;
    await ensureReviewItem(bob, "PATTERN", entityId);
    const item = await prisma.reviewItem.findFirstOrThrow({
      where: { userId: bob, entityType: "PATTERN", entityId },
    });

    await gradeReviewItem(bob, item.id, "AGAIN");
    await gradeReviewItem(bob, item.id, "GOOD");
    await gradeReviewItem(bob, item.id, "GOOD");

    const stored = await prisma.reviewItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(stored.totalReviews).toBe(3);
    expect(stored.lapses).toBe(1);
  });

  it("survives two grades submitted back to back", async () => {
    // A double-click must leave a coherent schedule rather than a half-
    // written row. Last write wins, and both writes are complete.
    const entityId = patternIds[4]!;
    await ensureReviewItem(bob, "PATTERN", entityId);
    const item = await prisma.reviewItem.findFirstOrThrow({
      where: { userId: bob, entityType: "PATTERN", entityId },
    });

    const [first, second] = await Promise.all([
      gradeReviewItem(bob, item.id, "GOOD", new Date("2026-05-12T09:00:00.000Z")),
      gradeReviewItem(bob, item.id, "GOOD", new Date("2026-05-12T09:00:01.000Z")),
    ]);

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    const stored = await prisma.reviewItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(stored.intervalDays).toBeGreaterThanOrEqual(1);
    expect(stored.dueAt.getTime()).toBeGreaterThan(Date.parse("2026-05-12T09:00:00.000Z"));
    expect(stored.totalReviews).toBe(2);
  });
});

// ---------------------------------------------------------------------------

describe("user isolation", () => {
  it("refuses to grade another user's item", async () => {
    const entityId = patternIds[0]!;
    const aliceItem = await prisma.reviewItem.findFirstOrThrow({
      where: { userId: alice, entityType: "PATTERN", entityId },
    });

    const before = await prisma.reviewItem.findUniqueOrThrow({
      where: { id: aliceItem.id },
    });

    // Bob knows the id and asks for it directly.
    const outcome = await gradeReviewItem(bob, aliceItem.id, "EASY");
    expect(outcome).toBeNull();

    const after = await prisma.reviewItem.findUniqueOrThrow({
      where: { id: aliceItem.id },
    });
    expect(after.totalReviews).toBe(before.totalReviews);
    expect(after.dueAt.toISOString()).toBe(before.dueAt.toISOString());
    expect(after.lastGrade).toBe(before.lastGrade);
  });

  it("never returns another user's items in the queue", async () => {
    const future = new Date("2030-01-01T00:00:00.000Z");
    const aliceQueue = await getReviewQueue(alice, future, 100);
    const bobQueue = await getReviewQueue(bob, future, 100);

    const aliceIds = new Set(aliceQueue.map((card) => card.id));
    for (const card of bobQueue) {
      expect(aliceIds.has(card.id), "queues must not overlap").toBe(false);
    }

    const owners = await prisma.reviewItem.findMany({
      where: { id: { in: aliceQueue.map((card) => card.id) } },
      select: { userId: true },
    });
    for (const owner of owners) expect(owner.userId).toBe(alice);
  });

  it("does not count another user's items in the summary", async () => {
    const future = new Date("2030-01-01T00:00:00.000Z");
    const summary = await getReviewSummary(alice, future);

    const actual = await prisma.reviewItem.count({ where: { userId: alice } });
    expect(summary.trackedCount).toBe(actual);
  });

  it("never returns another user's recently reviewed items", async () => {
    const recent = await getRecentlyReviewed(bob, 50);
    const owners = await prisma.reviewItem.findMany({
      where: { id: { in: recent.map((item) => item.id) } },
      select: { userId: true },
    });
    for (const owner of owners) expect(owner.userId).toBe(bob);
  });
});

// ---------------------------------------------------------------------------

describe("the queue", () => {
  it("orders overdue before due-today, then by lapses, then by ease", async () => {
    // A user of their own, so the ordering assertion is not affected by
    // anything the other tests left behind.
    const carol = await prisma.user.create({
      data: { email: `review-carol-${SUFFIX}@techepitome.test`, name: "Carol" },
      select: { id: true },
    });

    try {
      const now = new Date("2026-06-15T12:00:00.000Z");
      const today = utcDayStart(now);

      // Built directly so the exact state under test is unambiguous.
      const rows = [
        { tag: "today-easy", dueAt: today, lapses: 0, ease: 260 },
        { tag: "today-hard", dueAt: today, lapses: 0, ease: 200 },
        { tag: "today-lapsed", dueAt: today, lapses: 4, ease: 260 },
        { tag: "overdue-1", dueAt: addDays(today, -1), lapses: 0, ease: 260 },
        { tag: "overdue-9", dueAt: addDays(today, -9), lapses: 0, ease: 260 },
        { tag: "future", dueAt: addDays(today, 3), lapses: 9, ease: 130 },
      ];

      for (const [index, row] of rows.entries()) {
        await prisma.reviewItem.create({
          data: {
            userId: carol.id,
            entityType: "PATTERN",
            // Synthetic ids: this test is about ordering, not content, and
            // distinct ids keep the unique constraint out of the way. They
            // also exercise the unresolvable-content path.
            entityId: `order-${index}-${row.tag}`,
            stage: "REVIEW",
            dueAt: row.dueAt,
            intervalDays: 5,
            repetitions: 2,
            ease: row.ease,
            lapses: row.lapses,
          },
        });
      }

      const queue = await getReviewQueue(carol.id, now, 50);
      const dueAts = queue.map((card) => card.dueAt.toISOString());

      // Future item excluded entirely, despite being the weakest.
      expect(queue).toHaveLength(5);

      // Most overdue first, then the other overdue, then today's three.
      expect(dueAts[0]).toBe(addDays(today, -9).toISOString());
      expect(dueAts[1]).toBe(addDays(today, -1).toISOString());
      expect(dueAts.slice(2)).toEqual([
        today.toISOString(),
        today.toISOString(),
        today.toISOString(),
      ]);

      // Within today: most-lapsed first, then lowest ease.
      const todayCards = queue.slice(2);
      expect(todayCards[0]!.lapses).toBe(4);
      expect(todayCards.map((card) => card.lapses)).toEqual([4, 0, 0]);
    } finally {
      await prisma.user.delete({ where: { id: carol.id } });
    }
  });

  it("is deterministic across repeated calls", async () => {
    const at = new Date("2030-01-01T00:00:00.000Z");
    const first = await getReviewQueue(alice, at, 50);
    const second = await getReviewQueue(alice, at, 50);
    expect(second.map((card) => card.id)).toEqual(first.map((card) => card.id));
  });

  it("respects the session limit", async () => {
    const at = new Date("2030-01-01T00:00:00.000Z");
    const limited = await getReviewQueue(alice, at, 2);
    expect(limited.length).toBeLessThanOrEqual(2);
  });

  it("builds a real prompt with a question and an answer", async () => {
    const at = new Date("2030-01-01T00:00:00.000Z");
    const queue = await getReviewQueue(alice, at, 50);
    expect(queue.length).toBeGreaterThan(0);

    for (const card of queue) {
      expect(card.prompt.question.length).toBeGreaterThan(20);
      expect(card.prompt.kind.length).toBeGreaterThan(0);
      expect(card.prompt.answer.length).toBeGreaterThan(0);
      for (const section of card.prompt.answer) {
        expect(section.items.length).toBeGreaterThan(0);
      }
    }
  });

  it("excludes items that are not yet due", async () => {
    const queue = await getReviewQueue(alice, new Date("2020-01-01T00:00:00.000Z"), 50);
    expect(queue).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------

describe("priority bumping", () => {
  it("pulls a future item forward to today", async () => {
    const dave = await prisma.user.create({
      data: { email: `review-dave-${SUFFIX}@techepitome.test`, name: "Dave" },
      select: { id: true },
    });

    try {
      const now = new Date("2026-07-01T12:00:00.000Z");
      await prisma.reviewItem.create({
        data: {
          userId: dave.id,
          entityType: "PROBLEM",
          entityId: "problem-x",
          stage: "REVIEW",
          dueAt: addDays(utcDayStart(now), 30),
          intervalDays: 30,
          repetitions: 4,
        },
      });

      await bumpReviewPriority(dave.id, "PROBLEM", "problem-x", now);

      const stored = await prisma.reviewItem.findFirstOrThrow({
        where: { userId: dave.id, entityId: "problem-x" },
      });
      expect(stored.dueAt.toISOString()).toBe(utcDayStart(now).toISOString());
      expect(stored.stage).toBe("LEARNING");
    } finally {
      await prisma.user.delete({ where: { id: dave.id } });
    }
  });

  it("creates nothing when the item is not already tracked", async () => {
    // You cannot review something you never learned.
    await bumpReviewPriority(alice, "PROBLEM", "never-seen-before");
    const count = await prisma.reviewItem.count({
      where: { userId: alice, entityId: "never-seen-before" },
    });
    expect(count).toBe(0);
  });

  it("never pushes an already-due item further out", async () => {
    const erin = await prisma.user.create({
      data: { email: `review-erin-${SUFFIX}@techepitome.test`, name: "Erin" },
      select: { id: true },
    });

    try {
      const now = new Date("2026-07-01T12:00:00.000Z");
      const overdue = addDays(utcDayStart(now), -5);
      await prisma.reviewItem.create({
        data: {
          userId: erin.id,
          entityType: "PROBLEM",
          entityId: "problem-y",
          stage: "REVIEW",
          dueAt: overdue,
          intervalDays: 5,
        },
      });

      await bumpReviewPriority(erin.id, "PROBLEM", "problem-y", now);

      const stored = await prisma.reviewItem.findFirstOrThrow({
        where: { userId: erin.id, entityId: "problem-y" },
      });
      expect(stored.dueAt.toISOString()).toBe(overdue.toISOString());
    } finally {
      await prisma.user.delete({ where: { id: erin.id } });
    }
  });
});
