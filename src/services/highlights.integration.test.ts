import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { HIGHLIGHT_LIMITS } from "@/lib/highlights/types";
import {
  countHighlights,
  createHighlight,
  deleteHighlight,
  highlightableExists,
  listHighlights,
  listHighlightsFor,
  recolourHighlight,
} from "./highlights";

/**
 * Highlights, against the real database.
 *
 * The assertions that matter are ownership and coherence. A highlight is
 * a private row with no sharing whatsoever, so every read and write must
 * be scoped; and because the anchor is a pair of offsets the client
 * supplies, the server has to refuse anything that does not add up
 * rather than storing it and discovering the problem at render time.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
let chapterId = "";
let problemId = "";

/**
 * A coherent anchor.
 *
 * `endOffset` is derived from the quote unless the caller overrides it,
 * because the validator insists the two agree — the first draft of this
 * helper did not, and every test that changed the quote was silently
 * asserting the rejection path instead of the one it named.
 */
function anchor(
  over: Partial<{
    blockIndex: number;
    startOffset: number;
    endOffset: number;
    quote: string;
  }> = {}
) {
  const startOffset = over.startOffset ?? 0;
  const quote = over.quote ?? "hello world";
  return {
    blockIndex: over.blockIndex ?? 0,
    startOffset,
    endOffset: over.endOffset ?? startOffset + quote.length,
    quote,
  };
}

beforeAll(async () => {
  const a = await prisma.user.create({
    data: { email: `hl-alice-${SUFFIX}@codeforge.test` },
    select: { id: true },
  });
  const b = await prisma.user.create({
    data: { email: `hl-bob-${SUFFIX}@codeforge.test` },
    select: { id: true },
  });
  alice = a.id;
  bob = b.id;

  const chapter = await prisma.chapter.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });
  const problem = await prisma.problem.findFirstOrThrow({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });
  chapterId = chapter.id;
  problemId = problem.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

describe("targets", () => {
  it("accepts published chapters and problems", async () => {
    expect(await highlightableExists("CHAPTER", chapterId)).toBe(true);
    expect(await highlightableExists("PROBLEM", problemId)).toBe(true);
  });

  it("refuses an id that names nothing", async () => {
    expect(await highlightableExists("CHAPTER", "no-such-chapter")).toBe(false);
  });

  it("refuses unpublished content", async () => {
    const draft = await prisma.problem.create({
      data: {
        slug: `hl-draft-${SUFFIX}`,
        number: 910_000 + Math.floor(Math.random() * 9_000),
        title: "Draft",
        statement: [],
        difficulty: "EASY",
        status: "DRAFT",
      },
      select: { id: true },
    });

    expect(await highlightableExists("PROBLEM", draft.id)).toBe(false);

    const result = await createHighlight({
      userId: alice,
      entityType: "PROBLEM",
      entityId: draft.id,
      anchor: anchor(),
      color: "ember",
    });
    expect(result).toEqual({ ok: false, reason: "unknown-target" });

    await prisma.problem.delete({ where: { id: draft.id } });
  });
});

describe("creating", () => {
  it("stores a highlight and returns it", async () => {
    const result = await createHighlight({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
      anchor: anchor(),
      color: "sky",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deduplicated).toBe(false);
    expect(result.highlight.quote).toBe("hello world");
    expect(result.highlight.color).toBe("sky");
  });

  it("persists across a fresh read", async () => {
    const rows = await listHighlightsFor({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.startOffset).toBe(0);
    expect(rows[0]!.endOffset).toBe(11);
  });

  it("treats an identical span as the same highlight rather than an error", async () => {
    // A double click should be idempotent, not a failure to read.
    const before = await countHighlights(alice);
    const result = await createHighlight({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
      anchor: anchor(),
      color: "mint",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.deduplicated).toBe(true);
    expect(await countHighlights(alice)).toBe(before);
  });

  it("refuses a partial overlap", async () => {
    // Stacking marks produces a colour nobody chose.
    const result = await createHighlight({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
      anchor: anchor({ startOffset: 5, quote: "x".repeat(15) }),
      color: "ember",
    });
    expect(result).toEqual({ ok: false, reason: "overlaps" });
  });

  it("allows an adjacent, non-overlapping span", async () => {
    const result = await createHighlight({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
      anchor: anchor({ startOffset: 11, quote: "123456789" }),
      color: "violet",
    });
    expect(result.ok).toBe(true);
  });

  it("refuses an incoherent anchor without touching the database", async () => {
    const before = await countHighlights(alice);

    for (const bad of [
      anchor({ startOffset: 10, endOffset: 4 }),
      anchor({ startOffset: -5, endOffset: 4 }),
      anchor({ blockIndex: HIGHLIGHT_LIMITS.maxBlockIndex + 1 }),
      anchor({ quote: "   " }),
      // A five-character range carrying a huge payload.
      anchor({ startOffset: 0, endOffset: 5, quote: "x".repeat(1_500) }),
      anchor({
        startOffset: 0,
        endOffset: HIGHLIGHT_LIMITS.maxLength + 1,
        quote: "x".repeat(HIGHLIGHT_LIMITS.maxLength + 1),
      }),
    ]) {
      const result = await createHighlight({
        userId: alice,
        entityType: "CHAPTER",
        entityId: chapterId,
        anchor: bad,
        color: "ember",
      });
      expect(result, JSON.stringify(bad).slice(0, 60)).toEqual({
        ok: false,
        reason: "invalid-anchor",
      });
    }

    expect(await countHighlights(alice)).toBe(before);
  });
});

describe("ownership", () => {
  it("keeps one learner's highlights out of another's list", async () => {
    await createHighlight({
      userId: bob,
      entityType: "CHAPTER",
      entityId: chapterId,
      anchor: anchor({ quote: "bob's words" }),
      color: "ember",
    });

    const mine = await listHighlightsFor({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
    });
    const theirs = await listHighlightsFor({
      userId: bob,
      entityType: "CHAPTER",
      entityId: chapterId,
    });

    expect(mine.every((row) => row.quote !== "bob's words")).toBe(true);
    expect(theirs).toHaveLength(1);
    // The identical span belongs to each of them separately.
    expect(theirs[0]!.startOffset).toBe(0);
  });

  it("refuses to delete another learner's highlight", async () => {
    const [target] = await listHighlightsFor({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
    });
    expect(target).toBeDefined();

    expect(await deleteHighlight(target!.id, bob)).toBe(false);

    // Still there, untouched.
    expect(
      await prisma.highlight.count({ where: { id: target!.id, userId: alice } })
    ).toBe(1);
  });

  it("refuses to recolour another learner's highlight", async () => {
    const [target] = await listHighlightsFor({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
    });

    expect(
      await recolourHighlight({ id: target!.id, userId: bob, color: "mint" })
    ).toBe(false);

    const unchanged = await prisma.highlight.findUniqueOrThrow({
      where: { id: target!.id },
      select: { color: true },
    });
    expect(unchanged.color).not.toBe("mint");
  });

  it("lets the owner recolour and delete their own", async () => {
    const [target] = await listHighlightsFor({
      userId: alice,
      entityType: "CHAPTER",
      entityId: chapterId,
    });

    expect(
      await recolourHighlight({ id: target!.id, userId: alice, color: "mint" })
    ).toBe(true);
    expect(await deleteHighlight(target!.id, alice)).toBe(true);
    expect(await deleteHighlight(target!.id, alice)).toBe(false);
  });

  it("never lets a create be attributed to somebody else", async () => {
    // The service takes the id from its caller, which is the session. The
    // shape of the API is the guarantee: there is no field to forge.
    const before = await countHighlights(bob);
    await createHighlight({
      userId: alice,
      entityType: "PROBLEM",
      entityId: problemId,
      anchor: anchor({ quote: "alice only" }),
      color: "ember",
    });
    expect(await countHighlights(bob)).toBe(before);
  });
});

describe("the library listing", () => {
  it("resolves a title and a link back to the source", async () => {
    const rows = await listHighlights(alice);
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.resolved).toBe(true);
      expect(row.title.length).toBeGreaterThan(0);
      expect(row.href.startsWith("/")).toBe(true);
    }
  });

  it("searches the highlighted text", async () => {
    expect(await listHighlights(alice, "alice only")).toHaveLength(1);
    expect(await listHighlights(alice, "not in any highlight")).toHaveLength(0);
  });

  it("shows a highlight on unpublished content as unavailable, not gone", async () => {
    // Deleting it silently would throw away something the learner marked
    // against content that might come back.
    const draft = await prisma.problem.create({
      data: {
        slug: `hl-hidden-${SUFFIX}`,
        number: 920_000 + Math.floor(Math.random() * 9_000),
        title: "Hidden",
        statement: [],
        difficulty: "EASY",
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    await createHighlight({
      userId: alice,
      entityType: "PROBLEM",
      entityId: draft.id,
      anchor: anchor({ quote: "soon to vanish" }),
      color: "ember",
    });

    await prisma.problem.update({
      where: { id: draft.id },
      data: { status: "DRAFT" },
    });

    const row = (await listHighlights(alice, "soon to vanish"))[0];
    expect(row).toBeDefined();
    expect(row!.resolved).toBe(false);
    expect(row!.title).toBe("Unavailable");
    // The quote survives, so nothing the learner wrote is lost.
    expect(row!.quote).toBe("soon to vanish");

    await prisma.problem.delete({ where: { id: draft.id } });
  });

  it("shows nothing at all to a learner with none", async () => {
    const fresh = await prisma.user.create({
      data: { email: `hl-empty-${SUFFIX}@codeforge.test` },
      select: { id: true },
    });
    expect(await listHighlights(fresh.id)).toHaveLength(0);
    expect(await countHighlights(fresh.id)).toBe(0);
    await prisma.user.delete({ where: { id: fresh.id } });
  });
});

describe("cascade", () => {
  it("removes a learner's highlights with their account, and no content", async () => {
    const victim = await prisma.user.create({
      data: { email: `hl-victim-${SUFFIX}@codeforge.test` },
      select: { id: true },
    });
    await createHighlight({
      userId: victim.id,
      entityType: "CHAPTER",
      entityId: chapterId,
      anchor: anchor(),
      color: "ember",
    });

    const chaptersBefore = await prisma.chapter.count();
    await prisma.user.delete({ where: { id: victim.id } });

    expect(
      await prisma.highlight.count({ where: { userId: victim.id } })
    ).toBe(0);
    expect(await prisma.chapter.count()).toBe(chaptersBefore);
  });
});
