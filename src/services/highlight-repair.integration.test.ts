import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { repairHighlightAnchors } from "./highlights";

/**
 * Repairing a moved highlight, against the real table.
 *
 * The pure rule is covered in src/lib/highlights/anchor.test.ts. What is
 * asserted here is the part a pure test cannot reach: that the write is
 * owner-scoped, that it moves only the columns it is allowed to move, and
 * that existing rows survive it. Restructuring a chapter is what triggers
 * this path, so "does it corrupt anybody's highlights" is the question.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
let aliceHighlight = "";
let bobHighlight = "";

const ANCHOR = {
  entityType: "CHAPTER" as const,
  entityId: "chapter-under-test",
  blockIndex: 3,
  startOffset: 10,
  endOffset: 27,
  quote: "The write pointer",
  color: "ember",
};

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `hl-alice-${SUFFIX}@techepitome.test`, name: "Alice" },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `hl-bob-${SUFFIX}@techepitome.test`, name: "Bob" },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;

  const [ah, bh] = await Promise.all([
    prisma.highlight.create({
      data: { ...ANCHOR, userId: alice },
      select: { id: true },
    }),
    prisma.highlight.create({
      data: { ...ANCHOR, userId: bob },
      select: { id: true },
    }),
  ]);
  aliceHighlight = ah.id;
  bobHighlight = bh.id;
});

afterAll(async () => {
  await prisma.highlight.deleteMany({ where: { userId: { in: [alice, bob] } } });
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

describe("repairHighlightAnchors", () => {
  it("moves the caller's own highlight to its new position", async () => {
    const count = await repairHighlightAnchors({
      userId: alice,
      repairs: [
        { id: aliceHighlight, blockIndex: 5, startOffset: 0, endOffset: 17 },
      ],
    });
    expect(count).toBe(1);

    const row = await prisma.highlight.findUnique({
      where: { id: aliceHighlight },
      select: { blockIndex: true, startOffset: true, endOffset: true, quote: true },
    });
    expect(row).toMatchObject({ blockIndex: 5, startOffset: 0, endOffset: 17 });

    // The quote is the identity the repair was proved against and must not
    // be rewritable through this path.
    expect(row?.quote).toBe(ANCHOR.quote);
  });

  it("refuses to move somebody else's highlight", async () => {
    // The IDOR case: Alice names Bob's row.
    const count = await repairHighlightAnchors({
      userId: alice,
      repairs: [{ id: bobHighlight, blockIndex: 99, startOffset: 1, endOffset: 2 }],
    });
    expect(count).toBe(0);

    const row = await prisma.highlight.findUnique({
      where: { id: bobHighlight },
      select: { blockIndex: true, startOffset: true },
    });
    // Untouched, at its original anchor.
    expect(row).toMatchObject({
      blockIndex: ANCHOR.blockIndex,
      startOffset: ANCHOR.startOffset,
    });
  });

  it("applies only the rows that belong to the caller in a mixed batch", async () => {
    const count = await repairHighlightAnchors({
      userId: bob,
      repairs: [
        { id: bobHighlight, blockIndex: 7, startOffset: 2, endOffset: 19 },
        { id: aliceHighlight, blockIndex: 42, startOffset: 0, endOffset: 3 },
      ],
    });
    expect(count).toBe(1);

    const [bobRow, aliceRow] = await Promise.all([
      prisma.highlight.findUnique({
        where: { id: bobHighlight },
        select: { blockIndex: true },
      }),
      prisma.highlight.findUnique({
        where: { id: aliceHighlight },
        select: { blockIndex: true },
      }),
    ]);

    expect(bobRow?.blockIndex).toBe(7);
    // Alice's row keeps the value from the first test, not 42.
    expect(aliceRow?.blockIndex).toBe(5);
  });

  it("is a no-op for an empty batch", async () => {
    expect(await repairHighlightAnchors({ userId: alice, repairs: [] })).toBe(0);
  });

  it("does not delete or create rows", async () => {
    const before = await prisma.highlight.count({
      where: { userId: { in: [alice, bob] } },
    });

    await repairHighlightAnchors({
      userId: alice,
      repairs: [
        { id: aliceHighlight, blockIndex: 1, startOffset: 0, endOffset: 17 },
        { id: "does-not-exist", blockIndex: 2, startOffset: 0, endOffset: 1 },
      ],
    });

    expect(
      await prisma.highlight.count({ where: { userId: { in: [alice, bob] } } })
    ).toBe(before);
  });
});
