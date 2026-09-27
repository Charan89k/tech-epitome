import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import type { Diagram } from "@/lib/diagram/types";
import {
  getSystemDesignProblem,
  getSystemDesignProgress,
  listSystemDesignProblems,
  saveDesign,
  submitDesign,
} from "./system-design";

/**
 * Design workspace persistence and, above all, withholding.
 *
 * The rule this module exists to enforce is that the reference
 * architecture is invisible until the learner submits their own. It is
 * enforced in the *service* rather than in the page precisely so a
 * forgotten check in a future route cannot leak it, and these tests are
 * what keep that true.
 *
 * Each run creates its own users and deletes them afterwards; deleting a
 * user cascades to their design submissions.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
let slug = "";

const design: Diagram = {
  nodes: [
    { id: "c", kind: "client", label: "Browser" },
    { id: "api", kind: "api", label: "API" },
    { id: "db", kind: "database", label: "Postgres" },
  ],
  edges: [
    { id: "e1", from: "c", to: "api", kind: "sync" },
    { id: "e2", from: "api", to: "db", kind: "sync" },
  ],
};

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `sd-alice-${SUFFIX}@codeforge.test`, name: "Alice" },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `sd-bob-${SUFFIX}@codeforge.test`, name: "Bob" },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;

  const problem = await prisma.systemDesignProblem.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: { slug: true },
  });
  slug = problem?.slug ?? "";

  expect(slug, "seed the database before running these").not.toBe("");
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

// ---------------------------------------------------------------------------

describe("listing", () => {
  it("lists published exercises", async () => {
    const list = await listSystemDesignProblems();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]!.title).toBeTruthy();
  });

  it("reports NOT_STARTED for a learner who has not begun", async () => {
    const list = await listSystemDesignProblems(bob);
    expect(list.every((item) => item.status === "NOT_STARTED")).toBe(true);
  });
});

describe("withholding the reference", () => {
  it("hides the reference architecture from an anonymous visitor", async () => {
    const problem = await getSystemDesignProblem(slug);
    expect(problem).not.toBeNull();
    expect(problem!.reference).toBeNull();
  });

  it("hides it from a signed-in learner who has not submitted", async () => {
    await saveDesign({ userId: alice, problemSlug: slug, diagram: design, notes: "wip" });

    const problem = await getSystemDesignProblem(slug, alice);
    expect(problem!.submission).not.toBeNull();
    // Saving a draft is not submitting. The answer stays hidden.
    expect(problem!.reference).toBeNull();
  });

  it("still states the decisions the learner should be able to defend", async () => {
    // The prompts are derived from the reference's trade-offs but phrased
    // as questions, so the exercise is guided without being answered.
    const problem = await getSystemDesignProblem(slug, alice);
    expect(problem!.discussionAreas.length).toBeGreaterThan(0);
    expect(problem!.reference).toBeNull();
  });

  it("reveals it once the learner submits", async () => {
    const result = await submitDesign({ userId: alice, problemSlug: slug });
    expect(result.ok).toBe(true);

    const problem = await getSystemDesignProblem(slug, alice);
    expect(problem!.reference).not.toBeNull();
    expect(problem!.reference!.architecture.nodes.length).toBeGreaterThan(1);
    expect(problem!.reference!.tradeoffs.length).toBeGreaterThan(0);
  });

  it("keeps it hidden from a different learner who has not submitted", async () => {
    // Alice submitting must not unlock anything for Bob.
    const problem = await getSystemDesignProblem(slug, bob);
    expect(problem!.reference).toBeNull();
    expect(problem!.submission).toBeNull();
  });
});

describe("saving", () => {
  it("upserts rather than creating a second row", async () => {
    await saveDesign({ userId: bob, problemSlug: slug, diagram: design, notes: "one" });
    await saveDesign({ userId: bob, problemSlug: slug, diagram: design, notes: "two" });

    const rows = await prisma.systemDesignSubmission.count({
      where: { userId: bob },
    });
    // Autosave fires constantly; a second row per keystroke would be fatal.
    expect(rows).toBe(1);

    const problem = await getSystemDesignProblem(slug, bob);
    expect(problem!.submission!.notes).toBe("two");
  });

  it("does not un-submit a design when it is edited afterwards", async () => {
    await saveDesign({
      userId: alice,
      problemSlug: slug,
      diagram: design,
      notes: "revised after submitting",
    });

    const problem = await getSystemDesignProblem(slug, alice);
    // Taking the reference away again because they fixed a typo would be
    // both surprising and punitive.
    expect(problem!.reference).not.toBeNull();
    expect(problem!.submission!.status).toBe("COMPLETED");
  });

  it("refuses to save against an exercise that does not exist", async () => {
    const saved = await saveDesign({
      userId: alice,
      problemSlug: "no-such-exercise",
      diagram: design,
      notes: "",
    });
    expect(saved).toBe(false);
  });
});

describe("submitting", () => {
  it("refuses an empty design", async () => {
    const empty = await prisma.systemDesignProblem.findFirst({
      where: { status: "PUBLISHED", slug: { not: slug } },
      select: { slug: true },
    });
    if (!empty) return;

    await saveDesign({
      userId: bob,
      problemSlug: empty.slug,
      diagram: { nodes: [], edges: [] },
      notes: "",
    });

    // Submitting nothing to reveal the answer is the one way to turn this
    // exercise back into a worked example.
    const result = await submitDesign({ userId: bob, problemSlug: empty.slug });
    expect(result.ok).toBe(false);
  });

  it("refuses components with no connections between them", async () => {
    const other = await prisma.systemDesignProblem.findFirst({
      where: { status: "PUBLISHED", slug: { not: slug } },
      select: { slug: true },
    });
    if (!other) return;

    await saveDesign({
      userId: bob,
      problemSlug: other.slug,
      diagram: {
        nodes: [
          { id: "a", kind: "api", label: "API" },
          { id: "b", kind: "database", label: "DB" },
        ],
        edges: [],
      },
      notes: "",
    });

    const result = await submitDesign({ userId: bob, problemSlug: other.slug });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/connect/i);
  });

  it("refuses an exercise that does not exist", async () => {
    const result = await submitDesign({
      userId: alice,
      problemSlug: "no-such-exercise",
    });
    expect(result.ok).toBe(false);
  });
});

describe("progress", () => {
  it("counts only this learner's designs", async () => {
    const forAlice = await getSystemDesignProgress(alice);
    expect(forAlice.total).toBeGreaterThan(0);
    expect(forAlice.started).toBeGreaterThanOrEqual(1);
    expect(forAlice.submitted).toBe(1);

    const forBob = await getSystemDesignProgress(bob);
    // Bob drafted but never successfully submitted.
    expect(forBob.submitted).toBe(0);
  });
});

describe("the AI reviewer's context", () => {
  it("never contains the reference architecture", async () => {
    // The single most important invariant in Phase 7. It is enforced
    // structurally — `loadSystemDesignContext` does not select
    // `architecture`, `tradeoffs` or `scalingNotes`, and
    // `SystemDesignContext` has no field that could hold them — but
    // "enforced by construction" is exactly the kind of guarantee that
    // quietly disappears when somebody adds one line to a `select`.
    const { loadContextBundle } = await import("./tutor");

    // Alice has submitted, so the reference IS unlocked for her in the UI.
    // The reviewer must still not receive it.
    const bundle = await loadContextBundle(
      { kind: "SYSTEM_DESIGN", problemSlug: slug },
      alice
    );
    expect(bundle?.kind).toBe("SYSTEM_DESIGN");

    const serialised = JSON.stringify(bundle);

    // Pull the real reference out of the database and assert none of its
    // distinctive text reached the bundle.
    const stored = await prisma.systemDesignProblem.findUnique({
      where: { slug },
      select: { architecture: true, tradeoffs: true, scalingNotes: true },
    });

    const referenceNodeLabels = (
      (stored!.architecture as { nodes?: { label?: string }[] })?.nodes ?? []
    )
      .map((n) => n.label)
      .filter((l): l is string => Boolean(l));

    // The reference design names components the learner never drew.
    const learnerDrew = ["Browser", "API", "Postgres"];
    const unique = referenceNodeLabels.filter((l) => !learnerDrew.includes(l));
    expect(unique.length, "fixture should have distinctive reference nodes")
      .toBeGreaterThan(0);

    for (const label of unique) {
      expect(serialised).not.toContain(label);
    }

    for (const tradeoff of (stored!.tradeoffs as { because?: string }[]) ?? []) {
      if (tradeoff.because) expect(serialised).not.toContain(tradeoff.because);
    }

    // And the bundle carries no field by those names at all.
    expect(serialised).not.toMatch(/"(architecture|tradeoffs|scalingNotes)":/);
  });
});
