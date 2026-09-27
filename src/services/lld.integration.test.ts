import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import type { ClassDiagram } from "@/lib/class-diagram/types";
import {
  getLLDProblem,
  getLLDProgress,
  listLLDProblems,
  revealLLDHint,
  saveLLDDesign,
  submitLLDDesign,
} from "./lld";

/**
 * LLD persistence, ownership, and — above all — withholding.
 *
 * Three rules this module exists to enforce, and each is enforced in the
 * service rather than in a page so a future route cannot forget one:
 *
 *   1. The reference class design and implementation are invisible until
 *      the learner submits.
 *   2. Only the hint prefix the learner unlocked is ever loaded.
 *   3. Everything is scoped to the authenticated user.
 *
 * Each run creates its own users and deletes them afterwards; deleting a
 * user cascades to their submissions.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
let slug = "";
let totalHints = 0;

const design: ClassDiagram = {
  types: [
    { id: "a", kind: "interface", name: "Payable", attributes: [], methods: [] },
    { id: "b", kind: "class", name: "Invoice", attributes: [], methods: [] },
    { id: "c", kind: "class", name: "Ledger", attributes: [], methods: [] },
  ],
  relationships: [
    { id: "r1", from: "b", to: "a", kind: "implementation" },
    { id: "r2", from: "c", to: "b", kind: "aggregation" },
  ],
};

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `lld-alice-${SUFFIX}@codeforge.test`, name: "Alice" },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `lld-bob-${SUFFIX}@codeforge.test`, name: "Bob" },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;

  const problem = await prisma.lLDProblem.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { slug: true, hints: true },
  });
  slug = problem?.slug ?? "";
  totalHints = problem?.hints.length ?? 0;

  expect(slug, "seed the database before running these").not.toBe("");
  expect(totalHints).toBeGreaterThan(1);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

// ---------------------------------------------------------------------------

describe("listing", () => {
  it("lists published exercises", async () => {
    const list = await listLLDProblems();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]!.title).toBeTruthy();
  });

  it("reports NOT_STARTED for a learner who has not begun", async () => {
    const list = await listLLDProblems(bob);
    expect(list.every((i) => i.status === "NOT_STARTED")).toBe(true);
  });
});

describe("withholding the reference", () => {
  it("hides it from an anonymous visitor", async () => {
    const problem = await getLLDProblem(slug);
    expect(problem).not.toBeNull();
    expect(problem!.reference).toBeNull();
  });

  it("hides it from a signed-in learner who has not submitted", async () => {
    await saveLLDDesign({
      userId: alice,
      problemSlug: slug,
      classDiagram: design,
      code: "class Invoice {}",
      language: "JAVA",
      rationale: "wip",
    });

    const problem = await getLLDProblem(slug, alice);
    expect(problem!.submission).not.toBeNull();
    // Saving a draft is not submitting.
    expect(problem!.reference).toBeNull();
  });

  it("still gives the brief, entities and objectives before submission", async () => {
    // Withholding the answer must not mean withholding the exercise.
    const problem = await getLLDProblem(slug, alice);
    expect(problem!.requirements.length).toBeGreaterThan(0);
    expect(problem!.entities.length).toBeGreaterThan(0);
    expect(problem!.objectives.length).toBeGreaterThan(0);
    expect(problem!.reference).toBeNull();
  });

  it("reveals it once the learner submits", async () => {
    const result = await submitLLDDesign({ userId: alice, problemSlug: slug });
    expect(result.ok).toBe(true);

    const problem = await getLLDProblem(slug, alice);
    expect(problem!.reference).not.toBeNull();
    expect(problem!.reference!.classDiagram.types.length).toBeGreaterThan(1);
    expect(problem!.reference!.tradeoffs.length).toBeGreaterThan(0);
  });

  it("keeps it hidden from a different learner", async () => {
    // Alice submitting must not unlock anything for Bob.
    const problem = await getLLDProblem(slug, bob);
    expect(problem!.reference).toBeNull();
    expect(problem!.submission).toBeNull();
  });
});

describe("the hint ladder", () => {
  it("reveals nothing until a hint is asked for", async () => {
    const problem = await getLLDProblem(slug, bob);
    expect(problem!.revealedHints).toEqual([]);
    // The count is public so the UI can say "0 of 4"; the bodies are not.
    expect(problem!.totalHints).toBe(totalHints);
  });

  it("reveals one hint at a time, in order", async () => {
    const first = await revealLLDHint({ userId: bob, problemSlug: slug });
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.index).toBe(1);

    const second = await revealLLDHint({ userId: bob, problemSlug: slug });
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.index).toBe(2);

    const problem = await getLLDProblem(slug, bob);
    expect(problem!.revealedHints).toHaveLength(2);
  });

  it("loads only the prefix the learner unlocked", async () => {
    const authored = await prisma.lLDProblem.findUnique({
      where: { slug },
      select: { hints: true },
    });
    const problem = await getLLDProblem(slug, bob);

    expect(problem!.revealedHints).toEqual(authored!.hints.slice(0, 2));
    // An unopened hint is withheld content and must not be in the payload.
    if (authored!.hints.length > 2) {
      expect(problem!.revealedHints).not.toContain(authored!.hints[2]);
    }
  });

  it("refuses once every hint has been opened", async () => {
    for (let i = 2; i < totalHints; i += 1) {
      await revealLLDHint({ userId: bob, problemSlug: slug });
    }
    const extra = await revealLLDHint({ userId: bob, problemSlug: slug });
    expect(extra.ok).toBe(false);
  });

  it("keeps one learner's hint progress out of another's", async () => {
    const forAlice = await getLLDProblem(slug, alice);
    // Bob opened every hint; Alice opened none.
    expect(forAlice!.revealedHints).toEqual([]);
  });

  it("does not let autosave rewind the hint counter", async () => {
    const before = await getLLDProblem(slug, bob);
    await saveLLDDesign({
      userId: bob,
      problemSlug: slug,
      classDiagram: design,
      code: "",
      language: "JAVA",
      rationale: "edited after opening hints",
    });
    const after = await getLLDProblem(slug, bob);
    expect(after!.revealedHints.length).toBe(before!.revealedHints.length);
  });
});

describe("saving", () => {
  it("upserts rather than creating a second row", async () => {
    await saveLLDDesign({
      userId: bob,
      problemSlug: slug,
      classDiagram: design,
      code: "one",
      language: "JAVA",
      rationale: "one",
    });
    await saveLLDDesign({
      userId: bob,
      problemSlug: slug,
      classDiagram: design,
      code: "two",
      language: "PYTHON",
      rationale: "two",
    });

    const rows = await prisma.lLDSubmission.count({ where: { userId: bob } });
    // Autosave fires constantly; a row per keystroke would be fatal.
    expect(rows).toBe(1);

    const problem = await getLLDProblem(slug, bob);
    expect(problem!.submission!.code).toBe("two");
    expect(problem!.submission!.language).toBe("PYTHON");
  });

  it("does not un-submit a design when it is edited afterwards", async () => {
    await saveLLDDesign({
      userId: alice,
      problemSlug: slug,
      classDiagram: design,
      code: "revised",
      language: "JAVA",
      rationale: "revised after submitting",
    });

    const problem = await getLLDProblem(slug, alice);
    expect(problem!.reference).not.toBeNull();
    expect(problem!.submission!.status).toBe("COMPLETED");
  });

  it("refuses to save against an exercise that does not exist", async () => {
    const saved = await saveLLDDesign({
      userId: alice,
      problemSlug: "no-such-exercise",
      classDiagram: design,
      code: "",
      language: "JAVA",
      rationale: "",
    });
    expect(saved).toBe(false);
  });
});

describe("submitting", () => {
  it("refuses a design with too few types", async () => {
    const other = await prisma.lLDProblem.findFirst({
      where: { status: "PUBLISHED", slug: { not: slug } },
      select: { slug: true },
    });
    if (!other) return;

    await saveLLDDesign({
      userId: bob,
      problemSlug: other.slug,
      classDiagram: {
        types: [{ id: "a", kind: "class", name: "Only", attributes: [], methods: [] }],
        relationships: [],
      },
      code: "",
      language: "JAVA",
      rationale: "",
    });

    // Submitting almost nothing to reveal the answer is the one way to
    // turn this exercise back into a worked example.
    const result = await submitLLDDesign({ userId: bob, problemSlug: other.slug });
    expect(result.ok).toBe(false);
  });

  it("refuses types with no relationships between them", async () => {
    const other = await prisma.lLDProblem.findFirst({
      where: { status: "PUBLISHED", slug: { not: slug } },
      select: { slug: true },
    });
    if (!other) return;

    await saveLLDDesign({
      userId: bob,
      problemSlug: other.slug,
      classDiagram: {
        types: [
          { id: "a", kind: "class", name: "A", attributes: [], methods: [] },
          { id: "b", kind: "class", name: "B", attributes: [], methods: [] },
          { id: "c", kind: "class", name: "C", attributes: [], methods: [] },
        ],
        relationships: [],
      },
      code: "",
      language: "JAVA",
      rationale: "",
    });

    const result = await submitLLDDesign({ userId: bob, problemSlug: other.slug });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/relationship/i);
  });

  it("refuses an exercise that does not exist", async () => {
    const result = await submitLLDDesign({
      userId: alice,
      problemSlug: "no-such-exercise",
    });
    expect(result.ok).toBe(false);
  });
});

describe("progress", () => {
  it("counts only this learner's designs", async () => {
    const forAlice = await getLLDProgress(alice);
    expect(forAlice.total).toBeGreaterThan(0);
    expect(forAlice.submitted).toBe(1);

    const forBob = await getLLDProgress(bob);
    expect(forBob.submitted).toBe(0);
  });
});

describe("the AI reviewer's context", () => {
  it("never contains the reference design or implementation", async () => {
    // The most important invariant in Phase 8. It is enforced
    // structurally — `loadLLDContext` does not select `classDiagram`,
    // `code` or `tradeoffs` from the problem, and `LLDContext` has no
    // field that could hold them — but "enforced by construction" is
    // exactly the guarantee that quietly disappears when somebody adds
    // one line to a `select`.
    const { loadContextBundle } = await import("./tutor");

    // Alice has submitted, so the reference IS unlocked for her in the
    // UI. The reviewer must still not receive it.
    const bundle = await loadContextBundle({ kind: "LLD", problemSlug: slug }, alice);
    expect(bundle?.kind).toBe("LLD");

    const serialised = JSON.stringify(bundle);

    const stored = await prisma.lLDProblem.findUnique({
      where: { slug },
      select: { classDiagram: true, code: true, tradeoffs: true, hints: true },
    });

    // Type names that appear ONLY in the reference — not in the learner's
    // design and not in the public brief. A name like "Garage" is in the
    // exercise title, which the reviewer is supposed to receive, so
    // matching on it would be a false positive rather than a leak.
    const publicBrief = [
      bundle && "title" in bundle ? bundle.title : "",
      bundle && "tagline" in bundle ? bundle.tagline : "",
      ...(bundle && "requirements" in bundle ? bundle.requirements : []),
      ...(bundle && "constraints" in bundle ? bundle.constraints : []),
      ...(bundle && "principles" in bundle ? bundle.principles : []),
    ]
      .join(" ")
      .toLowerCase();

    const learnerDrew = design.types.map((t) => t.name.toLowerCase());
    const referenceNames = (
      (stored!.classDiagram as { types?: { name?: string }[] })?.types ?? []
    )
      .map((t) => t.name)
      .filter((n): n is string => Boolean(n));

    const unique = referenceNames.filter(
      (n) =>
        !learnerDrew.includes(n.toLowerCase()) &&
        !publicBrief.includes(n.toLowerCase())
    );

    expect(unique.length, "fixture should have distinctive reference types")
      .toBeGreaterThan(0);
    for (const name of unique) {
      expect(serialised).not.toContain(name);
    }

    // The reference's *structure* must not be there either — its
    // relationship prose is the thing that would actually give the
    // answer away.
    expect(serialised).not.toMatch(/FeePolicy|HourlyFeePolicy|MachineState|LogSink/);

    for (const tradeoff of (stored!.tradeoffs as { because?: string }[]) ?? []) {
      if (tradeoff.because) expect(serialised).not.toContain(tradeoff.because);
    }

    // And no field by those names exists at all.
    expect(serialised).not.toMatch(/"(classDiagram|tradeoffs)":/);
  });

  it("does not contain hints the learner has not opened", async () => {
    const { loadContextBundle } = await import("./tutor");
    const stored = await prisma.lLDProblem.findUnique({
      where: { slug },
      select: { hints: true },
    });

    // Alice has opened none.
    const bundle = await loadContextBundle({ kind: "LLD", problemSlug: slug }, alice);
    const serialised = JSON.stringify(bundle);

    for (const hint of stored!.hints) {
      expect(serialised).not.toContain(hint);
    }
  });

  it("does contain the learner's own design and rationale", async () => {
    // The reviewer is useless without these, so pin that they arrive.
    const { loadContextBundle } = await import("./tutor");
    const bundle = await loadContextBundle({ kind: "LLD", problemSlug: slug }, alice);
    if (bundle?.kind !== "LLD") throw new Error("wrong bundle");

    expect(bundle.learnerDiagram).toContain("Invoice");
    expect(bundle.learnerDiagram).toContain("implements Payable");
    expect(bundle.learnerRationale).toContain("revised after submitting");
    expect(Array.isArray(bundle.diagnostics)).toBe(true);
  });
});
