import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  appendMessage,
  findLatestConversationFor,
  getConversation,
  loadContextBundle,
  loadHistory,
  resolveConversation,
} from "./tutor";

/**
 * The tutor against the real database.
 *
 * The rules that matter most here are the ones a unit test cannot reach:
 * that a conversation belongs to exactly one learner and is invisible to
 * everyone else, that the hint prefix loaded is really the prefix the
 * learner unlocked, and that a failing submission actually arrives in the
 * context. Each of those is a query, and a query is where an authorization
 * bug lives.
 *
 * Every run creates its own users and deletes them afterwards. Deleting a
 * user cascades to their conversations, messages, progress and usage rows.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
let problemSlug = "";
let problemId = "";
let hintCount = 0;
let chapterAnchor = {
  kind: "CHAPTER" as const,
  courseSlug: "",
  sectionSlug: "",
  chapterSlug: "",
};

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `tutor-alice-${SUFFIX}@codeforge.test`, name: "Alice" },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `tutor-bob-${SUFFIX}@codeforge.test`, name: "Bob" },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;

  // A problem that actually ships hints, so the escalation assertions are
  // about real content rather than an empty ladder.
  const problem = await prisma.problem.findFirst({
    where: { status: "PUBLISHED", hints: { some: {} } },
    orderBy: { number: "asc" },
    select: { id: true, slug: true, _count: { select: { hints: true } } },
  });
  problemSlug = problem?.slug ?? "";
  problemId = problem?.id ?? "";
  hintCount = problem?._count.hints ?? 0;

  const chapter = await prisma.chapter.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { slug: "asc" },
    select: {
      slug: true,
      section: { select: { slug: true, course: { select: { slug: true } } } },
    },
  });

  chapterAnchor = {
    kind: "CHAPTER",
    courseSlug: chapter?.section.course.slug ?? "",
    sectionSlug: chapter?.section.slug ?? "",
    chapterSlug: chapter?.slug ?? "",
  };

  expect(problemSlug, "seed the database before running these").not.toBe("");
  expect(hintCount).toBeGreaterThan(1);
  expect(chapterAnchor.chapterSlug).not.toBe("");
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

// ---------------------------------------------------------------------------

describe("context loading — problem", () => {
  it("loads the statement, patterns and hint count", async () => {
    const bundle = await loadContextBundle(
      { kind: "PROBLEM", problemSlug },
      alice
    );

    expect(bundle?.kind).toBe("PROBLEM");
    if (bundle?.kind !== "PROBLEM") throw new Error("wrong bundle");

    expect(bundle.title).toBeTruthy();
    expect(bundle.statementText.length).toBeGreaterThan(20);
    expect(bundle.totalAuthoredHints).toBe(hintCount);
  });

  it("reveals no hints to a learner who has opened none", async () => {
    const bundle = await loadContextBundle(
      { kind: "PROBLEM", problemSlug },
      alice
    );
    if (bundle?.kind !== "PROBLEM") throw new Error("wrong bundle");

    expect(bundle.revealedHints).toEqual([]);
  });

  it("reveals exactly the prefix the learner has unlocked", async () => {
    await prisma.userProblemProgress.upsert({
      where: { userId_problemId: { userId: alice, problemId } },
      create: {
        userId: alice,
        problemId,
        status: "ATTEMPTED",
        hintsRevealed: 2,
      },
      update: { hintsRevealed: 2 },
    });

    const bundle = await loadContextBundle(
      { kind: "PROBLEM", problemSlug },
      alice
    );
    if (bundle?.kind !== "PROBLEM") throw new Error("wrong bundle");

    // Exactly two: an unopened hint is withheld content, and handing the
    // whole ladder to the model would let it answer at hint 4 on the first
    // ask — silently defeating the escalation the product enforces.
    expect(bundle.revealedHints).toHaveLength(2);

    const authored = await prisma.hint.findMany({
      where: { problemId },
      orderBy: { order: "asc" },
      select: { body: true },
    });
    expect(bundle.revealedHints).toEqual([
      authored[0]!.body,
      authored[1]!.body,
    ]);
  });

  it("does not leak one learner's hint progress into another's context", async () => {
    const bundle = await loadContextBundle({ kind: "PROBLEM", problemSlug }, bob);
    if (bundle?.kind !== "PROBLEM") throw new Error("wrong bundle");

    // Alice is two hints in; Bob has opened none.
    expect(bundle.revealedHints).toEqual([]);
    expect(bundle.attempts).toBe(0);
  });

  it("includes the learner's latest scored submission", async () => {
    await prisma.submission.create({
      data: {
        userId: alice,
        problemId,
        language: "PYTHON",
        code: "def f(): pass",
        status: "WRONG_ANSWER",
        passedCount: 8,
        totalCount: 12,
        errorMessage: "AssertionError on case 9",
        isRun: false,
      },
    });

    const bundle = await loadContextBundle(
      { kind: "PROBLEM", problemSlug },
      alice
    );
    if (bundle?.kind !== "PROBLEM") throw new Error("wrong bundle");

    expect(bundle.latestSubmission).toMatchObject({
      status: "WRONG_ANSWER",
      passed: 8,
      total: 12,
    });
  });

  it("ignores unscored runs when picking the latest submission", async () => {
    await prisma.submission.create({
      data: {
        userId: alice,
        problemId,
        language: "PYTHON",
        code: "print(1)",
        status: "ACCEPTED",
        passedCount: 2,
        totalCount: 2,
        isRun: true,
      },
    });

    const bundle = await loadContextBundle(
      { kind: "PROBLEM", problemSlug },
      alice
    );
    if (bundle?.kind !== "PROBLEM") throw new Error("wrong bundle");

    // A "Run" is the learner poking at sample cases; reporting it as their
    // result would tell the tutor they passed when they did not.
    expect(bundle.latestSubmission?.status).toBe("WRONG_ANSWER");
  });

  it("returns null for a problem that does not exist", async () => {
    const bundle = await loadContextBundle(
      { kind: "PROBLEM", problemSlug: "no-such-problem" },
      alice
    );
    expect(bundle).toBeNull();
  });
});

describe("context loading — chapter", () => {
  it("loads the chapter with its section and course", async () => {
    const bundle = await loadContextBundle(chapterAnchor, alice);
    expect(bundle?.kind).toBe("CHAPTER");
    if (bundle?.kind !== "CHAPTER") throw new Error("wrong bundle");

    expect(bundle.chapterTitle).toBeTruthy();
    expect(bundle.sectionTitle).toBeTruthy();
    expect(bundle.courseTitle).toBeTruthy();
    expect(bundle.bodyText.length).toBeGreaterThan(50);
  });

  it("returns null when the chapter is not under the named section", async () => {
    const bundle = await loadContextBundle(
      { ...chapterAnchor, sectionSlug: "not-a-section" },
      alice
    );
    expect(bundle).toBeNull();
  });
});

describe("context loading — global", () => {
  it("summarises the learner's own progress", async () => {
    const bundle = await loadContextBundle({ kind: "GLOBAL" }, alice);
    expect(bundle?.kind).toBe("GLOBAL");
    if (bundle?.kind !== "GLOBAL") throw new Error("wrong bundle");

    expect(bundle.completedChapters).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(bundle.weakPatterns)).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("conversations", () => {
  it("creates a thread anchored to the problem", async () => {
    const bundle = await loadContextBundle(
      { kind: "PROBLEM", problemSlug },
      alice
    );
    const conversation = await resolveConversation({
      userId: alice,
      anchor: { kind: "PROBLEM", problemSlug },
      bundle: bundle!,
    });

    expect(conversation).not.toBeNull();
    expect(conversation!.hintLevel).toBe(0);

    const row = await prisma.aIConversation.findUnique({
      where: { id: conversation!.id },
      select: { userId: true, contextType: true, contextId: true, mode: true },
    });
    expect(row).toMatchObject({
      userId: alice,
      contextType: "PROBLEM",
      contextId: problemSlug,
      mode: "TUTOR",
    });
  });

  it("stores messages with their request type and hint level", async () => {
    const bundle = await loadContextBundle({ kind: "GLOBAL" }, alice);
    const conversation = await resolveConversation({
      userId: alice,
      anchor: { kind: "GLOBAL" },
      bundle: bundle!,
    });

    await appendMessage({
      conversationId: conversation!.id,
      userId: alice,
      role: "USER",
      content: "Give me a hint.",
      requestType: "HINT",
      hintLevel: 1,
    });
    await appendMessage({
      conversationId: conversation!.id,
      userId: alice,
      role: "ASSISTANT",
      content: "What must be true inside your window?",
      requestType: "HINT",
      hintLevel: 1,
    });

    const loaded = await getConversation(conversation!.id, alice);
    expect(loaded!.messages).toHaveLength(2);
    expect(loaded!.messages[0]).toMatchObject({
      role: "USER",
      requestType: "HINT",
      hintLevel: 1,
    });
    expect(loaded!.messages[1]!.role).toBe("ASSISTANT");
  });

  it("resumes an existing thread at the rung it reached", async () => {
    const bundle = await loadContextBundle({ kind: "GLOBAL" }, alice);
    const created = await resolveConversation({
      userId: alice,
      anchor: { kind: "GLOBAL" },
      bundle: bundle!,
    });

    await appendMessage({
      conversationId: created!.id,
      userId: alice,
      role: "ASSISTANT",
      content: "hint two",
      requestType: "HINT",
      hintLevel: 2,
    });

    const resumed = await resolveConversation({
      userId: alice,
      conversationId: created!.id,
      anchor: { kind: "GLOBAL" },
      bundle: bundle!,
    });

    // A reload must not restart the ladder at rung one.
    expect(resumed!.id).toBe(created!.id);
    expect(resumed!.hintLevel).toBe(2);
  });

  it("finds the most recent thread for an anchor", async () => {
    const found = await findLatestConversationFor({
      userId: alice,
      anchor: { kind: "PROBLEM", problemSlug },
    });
    expect(found).toBeTruthy();
  });

  it("returns history oldest-first", async () => {
    const bundle = await loadContextBundle({ kind: "GLOBAL" }, alice);
    const conversation = await resolveConversation({
      userId: alice,
      anchor: { kind: "GLOBAL" },
      bundle: bundle!,
    });

    await appendMessage({
      conversationId: conversation!.id,
      userId: alice,
      role: "USER",
      content: "first",
      requestType: "GENERAL_QUESTION",
      hintLevel: 0,
    });
    await appendMessage({
      conversationId: conversation!.id,
      userId: alice,
      role: "ASSISTANT",
      content: "second",
      requestType: "GENERAL_QUESTION",
      hintLevel: 0,
    });

    const history = await loadHistory(conversation!.id, alice);
    expect(history.map((h) => h.content)).toEqual(["first", "second"]);
  });
});

// ---------------------------------------------------------------------------

describe("authorization", () => {
  let aliceConversation = "";

  beforeAll(async () => {
    const bundle = await loadContextBundle({ kind: "GLOBAL" }, alice);
    const conversation = await resolveConversation({
      userId: alice,
      anchor: { kind: "GLOBAL" },
      bundle: bundle!,
    });
    aliceConversation = conversation!.id;

    await appendMessage({
      conversationId: aliceConversation,
      userId: alice,
      role: "USER",
      content: "alice's private question",
      requestType: "GENERAL_QUESTION",
      hintLevel: 0,
    });
  });

  it("lets the owner read their own conversation", async () => {
    const loaded = await getConversation(aliceConversation, alice);
    expect(loaded).not.toBeNull();
    expect(loaded!.messages[0]!.content).toBe("alice's private question");
  });

  it("hides another learner's conversation", async () => {
    // Null, not a throw and not an empty thread: a probe for someone
    // else's id must be indistinguishable from a probe for one that was
    // never created.
    expect(await getConversation(aliceConversation, bob)).toBeNull();
  });

  it("hides another learner's messages", async () => {
    expect(await loadHistory(aliceConversation, bob)).toEqual([]);
  });

  it("refuses to continue another learner's conversation", async () => {
    const bundle = await loadContextBundle({ kind: "GLOBAL" }, bob);
    const attempt = await resolveConversation({
      userId: bob,
      conversationId: aliceConversation,
      anchor: { kind: "GLOBAL" },
      bundle: bundle!,
    });

    // Null means the route handler answers 404 — Bob learns nothing about
    // whether that id exists.
    expect(attempt).toBeNull();
  });

  it("does not surface another learner's thread through anchor lookup", async () => {
    const found = await findLatestConversationFor({
      userId: bob,
      anchor: { kind: "PROBLEM", problemSlug },
    });
    expect(found).toBeNull();
  });
});
