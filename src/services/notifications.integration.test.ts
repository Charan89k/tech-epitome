import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  listNotifications,
  markAllRead,
  markRead,
  notify,
  notifyInterviewGraded,
  notifySolveMilestone,
  unreadCount,
} from "./notifications";

/**
 * Notifications.
 *
 * Three things are worth pinning. Preferences are honoured **on write**,
 * so turning a kind off does not silently accumulate a backlog that all
 * appears if it is turned back on. `href` is rejected unless it is a path
 * on this site, because a notification is rendered as a link and an
 * absolute URL there is an open redirect with a friendly label. And every
 * read and write is scoped, so one learner's bell cannot reach another's.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: {
        email: `notif-alice-${SUFFIX}@codeforge.test`,
        profile: { create: {} },
      },
      select: { id: true },
    }),
    prisma.user.create({
      data: {
        email: `notif-bob-${SUFFIX}@codeforge.test`,
        profile: { create: {} },
      },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

describe("writing", () => {
  it("records one and counts it as unread", async () => {
    const id = await notify({
      userId: alice,
      kind: "MILESTONE",
      title: "First problem solved",
      body: "One down.",
      href: "/dashboard",
    });

    expect(id).not.toBeNull();
    expect(await unreadCount(alice)).toBe(1);
  });

  it("refuses an absolute href rather than storing it", async () => {
    // A notification is a link. An off-site one is an open redirect
    // wearing the product's own chrome.
    for (const href of [
      "https://evil.example/steal",
      "//evil.example",
      "javascript:alert(1)",
      "http://localhost/ok",
    ]) {
      const id = await notify({
        userId: alice,
        kind: "ACCOUNT",
        title: "Test",
        body: "Test",
        href,
      });
      expect(id, href).toBeNull();
    }
  });

  it("accepts an ordinary path, including a query and a fragment", async () => {
    const id = await notify({
      userId: alice,
      kind: "ACCOUNT",
      title: "Fine",
      body: "Fine",
      href: "/interviews/abc123?tab=feedback#dimensions",
    });
    expect(id).not.toBeNull();
  });

  it("honours a preference at write time, not at read time", async () => {
    await prisma.profile.update({
      where: { userId: bob },
      data: { notifyMilestones: false },
    });

    const id = await notify({
      userId: bob,
      kind: "MILESTONE",
      title: "Suppressed",
      body: "Should never be stored.",
    });

    expect(id).toBeNull();
    // Nothing accumulated: turning the preference back on must not
    // release a backlog of things that were declined.
    expect(await prisma.notification.count({ where: { userId: bob } })).toBe(0);
  });

  it("never suppresses an account notice, whatever the preferences", async () => {
    await prisma.profile.update({
      where: { userId: bob },
      data: {
        notifyMilestones: false,
        notifyReviewDue: false,
        notifyInterviewGraded: false,
      },
    });

    const id = await notify({
      userId: bob,
      kind: "ACCOUNT",
      title: "Your password was changed",
      body: "If this was not you, reset it.",
    });
    expect(id).not.toBeNull();
  });
});

describe("the producers", () => {
  it("fires a milestone only on the exact number", async () => {
    const before = await prisma.notification.count({
      where: { userId: alice, kind: "MILESTONE" },
    });

    // A recount or a backfill must not replay the whole ladder.
    for (const count of [2, 3, 9, 11, 24, 26]) {
      await notifySolveMilestone(alice, count);
    }
    expect(
      await prisma.notification.count({
        where: { userId: alice, kind: "MILESTONE" },
      })
    ).toBe(before);

    await notifySolveMilestone(alice, 10);
    expect(
      await prisma.notification.count({
        where: { userId: alice, kind: "MILESTONE" },
      })
    ).toBe(before + 1);
  });

  it("links a graded interview to the interview it graded", async () => {
    await notifyInterviewGraded({
      userId: alice,
      sessionId: "session-xyz",
      label: "Behavioural — Teamwork question",
    });

    const row = await prisma.notification.findFirst({
      where: { userId: alice, kind: "INTERVIEW_GRADED" },
      orderBy: { createdAt: "desc" },
      select: { href: true, body: true },
    });
    expect(row?.href).toBe("/interviews/session-xyz");
    expect(row?.body).toContain("Behavioural");
  });
});

describe("ownership", () => {
  it("shows a learner only their own", async () => {
    const mine = await listNotifications(alice);
    expect(mine.length).toBeGreaterThan(0);
    expect(await listNotifications(bob)).toHaveLength(
      await prisma.notification.count({ where: { userId: bob } })
    );

    const theirIds = new Set(
      (await listNotifications(bob)).map((row) => row.id)
    );
    for (const row of mine) expect(theirIds.has(row.id)).toBe(false);
  });

  it("refuses to mark another learner's notification read", async () => {
    const [first] = await listNotifications(alice);
    expect(first).toBeDefined();

    expect(await markRead(first!.id, bob)).toBe(false);

    const still = await prisma.notification.findUniqueOrThrow({
      where: { id: first!.id },
      select: { readAt: true },
    });
    expect(still.readAt).toBeNull();
  });

  it("marks all read for the owner and nobody else", async () => {
    const bobUnreadBefore = await unreadCount(bob);
    await markAllRead(alice);

    expect(await unreadCount(alice)).toBe(0);
    expect(await unreadCount(bob)).toBe(bobUnreadBefore);
  });
});
