import "server-only";

import { cache } from "react";

import type { AccessTier, Difficulty, Language } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { parseClassDiagram } from "@/lib/class-diagram/schema";
import type { ClassDiagram } from "@/lib/class-diagram/types";

/**
 * LLD exercises and the learner's own designs.
 *
 * Two rules this module exists to enforce, both in the service rather
 * than in a page so a future route cannot forget them:
 *
 *   1. The reference class design and reference implementation are
 *      invisible until the learner submits their own. An exercise whose
 *      answer is on the page is a worked example.
 *   2. Only the prefix of the hint ladder the learner has actually
 *      unlocked is ever loaded. The server decides which hint comes next
 *      from the stored counter, so the ladder cannot be skipped by
 *      asking for hint 4 directly.
 *
 * Mirrors `services/system-design.ts` deliberately — same shape, same
 * guarantees, so there is one pattern to audit rather than two.
 */

export type LLDListItem = {
  slug: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  access: AccessTier;
  designPatterns: string[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
};

export async function listLLDProblems(userId?: string): Promise<LLDListItem[]> {
  const problems = await prisma.lLDProblem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      tagline: true,
      difficulty: true,
      access: true,
      designPatterns: true,
    },
  });

  // One query for every submission rather than one per exercise.
  const submissions = userId
    ? await prisma.lLDSubmission.findMany({
        where: { userId, problemId: { in: problems.map((p) => p.id) } },
        select: { problemId: true, status: true },
      })
    : [];
  const byProblem = new Map(submissions.map((s) => [s.problemId, s.status]));

  return problems.map((problem) => ({
    slug: problem.slug,
    title: problem.title,
    tagline: problem.tagline,
    difficulty: problem.difficulty,
    access: problem.access,
    designPatterns: problem.designPatterns,
    status: byProblem.get(problem.id) ?? "NOT_STARTED",
  }));
}

export type LLDEntity = { name: string; responsibility: string };

export type LLDDetail = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  access: AccessTier;
  requirements: string[];
  constraints: string[];
  objectives: string[];
  principles: string[];
  designPatterns: string[];
  extensions: string[];
  /** Named things the brief expects to exist, with their responsibility. */
  entities: LLDEntity[];
  /** How many hints exist, so the UI can show "2 of 4" without the bodies. */
  totalHints: number;
  /** Only the ones the learner has opened. Never the whole ladder. */
  revealedHints: string[];
  /**
   * Reference material. Null until the learner submits — decided here,
   * not by the page.
   */
  reference: {
    classDiagram: ClassDiagram;
    code: Record<string, string>;
    tradeoffs: { decision: string; chose: string; over: string; because: string }[];
  } | null;
  submission: {
    classDiagram: ClassDiagram;
    code: string;
    language: Language;
    rationale: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    submittedAt: Date | null;
    hintsRevealed: number;
  } | null;
};

export const getLLDProblem = cache(
  async (slug: string, userId?: string): Promise<LLDDetail | null> => {
    const problem = await prisma.lLDProblem.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        difficulty: true,
        access: true,
        requirements: true,
        constraints: true,
        objectives: true,
        principles: true,
        designPatterns: true,
        extensions: true,
        entities: true,
        hints: true,
        classDiagram: true,
        code: true,
        tradeoffs: true,
      },
    });

    if (!problem) return null;

    const submission = userId
      ? await prisma.lLDSubmission.findUnique({
          where: { userId_problemId: { userId, problemId: problem.id } },
          select: {
            classDiagram: true,
            code: true,
            language: true,
            rationale: true,
            status: true,
            submittedAt: true,
            hintsRevealed: true,
          },
        })
      : null;

    const hasSubmitted = Boolean(submission?.submittedAt);
    const revealed = submission?.hintsRevealed ?? 0;

    return {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      tagline: problem.tagline,
      difficulty: problem.difficulty,
      access: problem.access,
      requirements: problem.requirements,
      constraints: problem.constraints,
      objectives: problem.objectives,
      principles: problem.principles,
      designPatterns: problem.designPatterns,
      extensions: problem.extensions,
      entities: (problem.entities ?? []) as LLDEntity[],
      totalHints: problem.hints.length,
      // Strictly the unlocked prefix. An unopened hint is withheld
      // content and never leaves the server.
      revealedHints: problem.hints.slice(0, revealed),
      reference: hasSubmitted
        ? {
            classDiagram: parseClassDiagram(problem.classDiagram, `lld:${slug}`),
            code: (problem.code ?? {}) as Record<string, string>,
            tradeoffs: (problem.tradeoffs ?? []) as NonNullable<
              LLDDetail["reference"]
            >["tradeoffs"],
          }
        : null,
      submission: submission
        ? {
            classDiagram: parseClassDiagram(
              submission.classDiagram,
              `lld-submission:${slug}`
            ),
            code: submission.code,
            language: submission.language,
            rationale: submission.rationale,
            status: submission.status,
            submittedAt: submission.submittedAt,
            hintsRevealed: submission.hintsRevealed,
          }
        : null,
    };
  }
);

/** Counts for the dashboard. Aggregates only, no rows. */
export async function getLLDProgress(userId: string): Promise<{
  total: number;
  started: number;
  submitted: number;
}> {
  const [total, started, submitted] = await Promise.all([
    prisma.lLDProblem.count({ where: { status: "PUBLISHED" } }),
    prisma.lLDSubmission.count({ where: { userId } }),
    prisma.lLDSubmission.count({ where: { userId, status: "COMPLETED" } }),
  ]);
  return { total, started, submitted };
}

export async function saveLLDDesign(params: {
  userId: string;
  problemSlug: string;
  classDiagram: ClassDiagram;
  code: string;
  language: Language;
  rationale: string;
}): Promise<boolean> {
  const problem = await prisma.lLDProblem.findFirst({
    where: { slug: params.problemSlug, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!problem) return false;

  await prisma.lLDSubmission.upsert({
    where: {
      userId_problemId: { userId: params.userId, problemId: problem.id },
    },
    create: {
      userId: params.userId,
      problemId: problem.id,
      classDiagram: params.classDiagram,
      code: params.code,
      language: params.language,
      rationale: params.rationale,
      status: "IN_PROGRESS",
    },
    // `status` and `hintsRevealed` are deliberately not written here:
    // editing a submitted design must not un-submit it, and autosave
    // must not be able to rewind the hint counter.
    update: {
      classDiagram: params.classDiagram,
      code: params.code,
      language: params.language,
      rationale: params.rationale,
    },
  });

  return true;
}

/**
 * Reveals the next hint.
 *
 * The server picks which one from the stored counter, so the ladder
 * cannot be skipped — the same rule the DSA hint ladder enforces, for
 * the same reason: the escalation is the teaching device.
 */
export async function revealLLDHint(params: {
  userId: string;
  problemSlug: string;
}): Promise<
  { ok: true; index: number; body: string; remaining: number } | { ok: false; reason: string }
> {
  const problem = await prisma.lLDProblem.findFirst({
    where: { slug: params.problemSlug, status: "PUBLISHED" },
    select: { id: true, hints: true },
  });
  if (!problem) return { ok: false, reason: "That exercise is not available." };
  if (problem.hints.length === 0) {
    return { ok: false, reason: "This exercise has no hints." };
  }

  const existing = await prisma.lLDSubmission.findUnique({
    where: {
      userId_problemId: { userId: params.userId, problemId: problem.id },
    },
    select: { hintsRevealed: true },
  });

  const already = existing?.hintsRevealed ?? 0;
  if (already >= problem.hints.length) {
    return { ok: false, reason: "You have already opened every hint." };
  }

  const next = problem.hints[already]!;

  await prisma.lLDSubmission.upsert({
    where: {
      userId_problemId: { userId: params.userId, problemId: problem.id },
    },
    create: {
      userId: params.userId,
      problemId: problem.id,
      status: "IN_PROGRESS",
      hintsRevealed: 1,
    },
    update: { hintsRevealed: already + 1 },
  });

  return {
    ok: true,
    index: already + 1,
    body: next,
    remaining: problem.hints.length - (already + 1),
  };
}

/**
 * Submits a design, which is what unlocks the reference.
 *
 * The bar is deliberately structural rather than qualitative: enough
 * types to constitute a design, and at least one relationship, so the
 * learner has actually expressed how the pieces fit. Submitting an empty
 * canvas to reveal the answer is the one way to turn this exercise back
 * into a worked example.
 */
export async function submitLLDDesign(params: {
  userId: string;
  problemSlug: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const problem = await prisma.lLDProblem.findFirst({
    where: { slug: params.problemSlug, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!problem) return { ok: false, reason: "That exercise is not available." };

  const existing = await prisma.lLDSubmission.findUnique({
    where: {
      userId_problemId: { userId: params.userId, problemId: problem.id },
    },
    select: { classDiagram: true },
  });

  const diagram = parseClassDiagram(existing?.classDiagram, "lld-submit");
  if (diagram.types.length < 3) {
    return {
      ok: false,
      reason: "Add at least three types before submitting — a design needs more than a couple of classes.",
    };
  }
  if (diagram.relationships.length < 1) {
    return {
      ok: false,
      reason: "Connect your types so the relationships between them are explicit.",
    };
  }

  await prisma.lLDSubmission.update({
    where: {
      userId_problemId: { userId: params.userId, problemId: problem.id },
    },
    data: { status: "COMPLETED", submittedAt: new Date() },
  });

  return { ok: true };
}
