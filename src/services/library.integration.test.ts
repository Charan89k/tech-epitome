import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  annotatableExists,
  deleteNote,
  getNoteFor,
  isBookmarked,
  listBookmarks,
  listNotes,
  toggleBookmark,
  upsertNote,
} from "./library";

/**
 * Bookmarks and notes.
 *
 * Both are private per-learner rows with no sharing at all, so the whole
 * security story is scoping — which is exactly why it is worth asserting
 * rather than assuming. The other thing pinned here is that clearing a
 * note deletes it: that is the delete gesture in the UI, and a blank row
 * left behind would show as an empty note in the library forever.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
let problemId = "";
let chapterId = "";

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `lib-alice-${SUFFIX}@techepitome.test` },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `lib-bob-${SUFFIX}@techepitome.test` },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;

  const problem = await prisma.problem.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });
  const chapter = await prisma.chapter.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });
  problemId = problem.id;
  chapterId = chapter.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

describe("target validation", () => {
  it("accepts a published problem, chapter and pattern", async () => {
    expect(await annotatableExists("PROBLEM", problemId)).toBe(true);
    expect(await annotatableExists("CHAPTER", chapterId)).toBe(true);
  });

  it("rejects an id that names nothing", async () => {
    expect(await annotatableExists("PROBLEM", "not-a-real-id")).toBe(false);
  });

  it("rejects an unpublished target", async () => {
    const draft = await prisma.problem.create({
      data: {
        slug: `draft-problem-${SUFFIX}`,
        number: 90_000 + Math.floor(Math.random() * 9_000),
        title: "Draft",
        statement: [],
        difficulty: "EASY",
        status: "DRAFT",
      },
      select: { id: true },
    });

    expect(await annotatableExists("PROBLEM", draft.id)).toBe(false);
    await prisma.problem.delete({ where: { id: draft.id } });
  });
});

describe("bookmarks", () => {
  it("toggles on and off", async () => {
    expect(
      await toggleBookmark({ userId: alice, entityType: "PROBLEM", entityId: problemId })
    ).toBe(true);
    expect(
      await isBookmarked({ userId: alice, entityType: "PROBLEM", entityId: problemId })
    ).toBe(true);

    expect(
      await toggleBookmark({ userId: alice, entityType: "PROBLEM", entityId: problemId })
    ).toBe(false);
    expect(
      await isBookmarked({ userId: alice, entityType: "PROBLEM", entityId: problemId })
    ).toBe(false);
  });

  it("keeps one learner's bookmarks out of another's list", async () => {
    await toggleBookmark({ userId: alice, entityType: "CHAPTER", entityId: chapterId });

    expect(await listBookmarks(alice)).toHaveLength(1);
    expect(await listBookmarks(bob)).toHaveLength(0);
    expect(
      await isBookmarked({ userId: bob, entityType: "CHAPTER", entityId: chapterId })
    ).toBe(false);
  });

  it("resolves a bookmark to a title and a link", async () => {
    const [item] = await listBookmarks(alice);
    expect(item!.resolved).toBe(true);
    expect(item!.title.length).toBeGreaterThan(0);
    expect(item!.href.startsWith("/")).toBe(true);
  });
});

describe("notes", () => {
  it("creates, then updates in place rather than accumulating", async () => {
    await upsertNote({
      userId: alice,
      entityType: "PROBLEM",
      entityId: problemId,
      body: "The window only shrinks when the constraint breaks.",
    });
    await upsertNote({
      userId: alice,
      entityType: "PROBLEM",
      entityId: problemId,
      body: "Revised: the window shrinks from the left, never the right.",
    });

    const rows = await prisma.note.findMany({
      where: { userId: alice, entityType: "PROBLEM", entityId: problemId },
    });
    // One note per learner per thing. A margin note, not a thread.
    expect(rows).toHaveLength(1);
    expect(rows[0]!.body).toMatch(/^Revised:/);
  });

  it("deletes when the body is cleared", async () => {
    const result = await upsertNote({
      userId: alice,
      entityType: "PROBLEM",
      entityId: problemId,
      body: "   ",
    });

    expect(result).toBeNull();
    expect(
      await getNoteFor({ userId: alice, entityType: "PROBLEM", entityId: problemId })
    ).toBeNull();
  });

  it("keeps notes private to their author", async () => {
    await upsertNote({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
      body: "Alice's private note.",
    });

    expect(await listNotes(alice)).toHaveLength(1);
    expect(await listNotes(bob)).toHaveLength(0);
    expect(
      await getNoteFor({ userId: bob, entityType: "CHAPTER", entityId: chapterId })
    ).toBeNull();
  });

  it("refuses to delete a note belonging to somebody else", async () => {
    const note = await getNoteFor({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
    });
    expect(note).not.toBeNull();

    expect(await deleteNote(note!.id, bob)).toBe(false);
    expect(
      await getNoteFor({ userId: alice, entityType: "CHAPTER", entityId: chapterId })
    ).not.toBeNull();

    expect(await deleteNote(note!.id, alice)).toBe(true);
  });

  it("finds a note by its text", async () => {
    await upsertNote({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
      body: "Monotonic deque keeps candidates in decreasing order.",
    });

    expect(await listNotes(alice, "monotonic")).toHaveLength(1);
    expect(await listNotes(alice, "quicksort")).toHaveLength(0);
  });
});
