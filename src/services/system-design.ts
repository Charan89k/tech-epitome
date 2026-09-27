import "server-only";

import { cache } from "react";

import type { AccessTier, Difficulty } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { parseDiagram } from "@/lib/diagram/schema";
import type { Diagram } from "@/lib/diagram/types";

/**
 * System-design exercises and the learner's own designs.
 *
 * Follows the same rule as every other service here: pages never query
 * Prisma directly, the `status: PUBLISHED` filter lives in one place, and
 * anything user-owned is filtered on `userId` inside the same query that
 * finds the row.
 *
 * The one rule specific to this module: **the reference architecture is
 * never loaded into a list or a detail view before the learner submits.**
 * An exercise whose answer is visible from the index page is a worked
 * example, not an exercise.
 */

export type SystemDesignListItem = {
  slug: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  access: AccessTier;
  /** The learner's own state, when signed in. */
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
};

export async function listSystemDesignProblems(
  userId?: string
): Promise<SystemDesignListItem[]> {
  const problems = await prisma.systemDesignProblem.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      tagline: true,
      difficulty: true,
      access: true,
    },
  });

  // One query for every submission rather than one per problem: the list
  // is short today but this is exactly the shape that becomes an N+1.
  const submissions = userId
    ? await prisma.systemDesignSubmission.findMany({
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
    status: byProblem.get(problem.id) ?? "NOT_STARTED",
  }));
}

export type SystemDesignDetail = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  access: AccessTier;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  scaleEstimate: Record<string, string>;
  apiDesign: { method: string; path: string; purpose: string }[];
  dataModel: { name: string; fields: string; notes?: string }[];
  bottlenecks: string[];
  /** Prompts the learner should be able to answer. Not answers. */
  discussionAreas: string[];
  followUps: string[];
  /**
   * Reference material. Null until the learner has submitted — the service
   * decides this, not the page, so a forgotten check in one route cannot
   * leak the answer.
   */
  reference: {
    architecture: Diagram;
    tradeoffs: { decision: string; chose: string; over: string; because: string }[];
    scalingNotes: { stage: string; problem: string; response: string }[];
  } | null;
  submission: {
    diagram: Diagram;
    notes: string;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    submittedAt: Date | null;
  } | null;
};

/**
 * One exercise, with the learner's design and — only once they have
 * submitted — the reference.
 */
export const getSystemDesignProblem = cache(
  async (slug: string, userId?: string): Promise<SystemDesignDetail | null> => {
    const problem = await prisma.systemDesignProblem.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        difficulty: true,
        access: true,
        functionalRequirements: true,
        nonFunctionalRequirements: true,
        scaleEstimate: true,
        apiDesign: true,
        dataModel: true,
        architecture: true,
        bottlenecks: true,
        scalingNotes: true,
        tradeoffs: true,
      },
    });

    if (!problem) return null;

    const submission = userId
      ? await prisma.systemDesignSubmission.findUnique({
          where: { userId_problemId: { userId, problemId: problem.id } },
          select: { diagram: true, notes: true, status: true, submittedAt: true },
        })
      : null;

    const hasSubmitted = Boolean(submission?.submittedAt);

    const scale = (problem.scaleEstimate ?? {}) as Record<string, string>;
    const api = (problem.apiDesign ?? []) as SystemDesignDetail["apiDesign"];
    const data = (problem.dataModel ?? []) as SystemDesignDetail["dataModel"];
    const tradeoffs = (problem.tradeoffs ?? []) as NonNullable<
      SystemDesignDetail["reference"]
    >["tradeoffs"];
    const scaling = (problem.scalingNotes ?? []) as NonNullable<
      SystemDesignDetail["reference"]
    >["scalingNotes"];

    return {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      tagline: problem.tagline,
      difficulty: problem.difficulty,
      access: problem.access,
      functionalRequirements: problem.functionalRequirements,
      nonFunctionalRequirements: problem.nonFunctionalRequirements,
      scaleEstimate: scale,
      apiDesign: api,
      dataModel: data,
      bottlenecks: problem.bottlenecks,
      // Derived from the reference rather than authored twice: the areas a
      // learner should cover are exactly the decisions the reference made,
      // stated as questions instead of answers.
      discussionAreas: tradeoffs.map((t) => t.decision),
      followUps: problem.bottlenecks.map(
        (b) => `What happens to the design when ${b.charAt(0).toLowerCase()}${b.slice(1)}`
      ),
      reference: hasSubmitted
        ? {
            architecture: parseDiagram(problem.architecture, `sd:${slug}`),
            tradeoffs,
            scalingNotes: scaling,
          }
        : null,
      submission: submission
        ? {
            diagram: parseDiagram(submission.diagram, `sd-submission:${slug}`),
            notes: submission.notes,
            status: submission.status,
            submittedAt: submission.submittedAt,
          }
        : null,
    };
  }
);

/** Counts for the dashboard. Cheap: two aggregate queries, no rows. */
export async function getSystemDesignProgress(userId: string): Promise<{
  total: number;
  started: number;
  submitted: number;
}> {
  const [total, started, submitted] = await Promise.all([
    prisma.systemDesignProblem.count({ where: { status: "PUBLISHED" } }),
    prisma.systemDesignSubmission.count({ where: { userId } }),
    prisma.systemDesignSubmission.count({
      where: { userId, status: "COMPLETED" },
    }),
  ]);
  return { total, started, submitted };
}

/**
 * Saves a draft design.
 *
 * Upsert on (userId, problemId) so autosave never creates a second row,
 * and the diagram is validated by the caller before it arrives here.
 */
export async function saveDesign(params: {
  userId: string;
  problemSlug: string;
  diagram: Diagram;
  notes: string;
}): Promise<boolean> {
  const problem = await prisma.systemDesignProblem.findFirst({
    where: { slug: params.problemSlug, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!problem) return false;

  await prisma.systemDesignSubmission.upsert({
    where: {
      userId_problemId: { userId: params.userId, problemId: problem.id },
    },
    create: {
      userId: params.userId,
      problemId: problem.id,
      diagram: params.diagram,
      notes: params.notes,
      status: "IN_PROGRESS",
    },
    // `status` is deliberately not reset here: editing a submitted design
    // should not un-submit it and take the reference away again.
    update: { diagram: params.diagram, notes: params.notes },
  });

  return true;
}

/**
 * Submits a design, which is what unlocks the reference architecture.
 *
 * Returns false when there is nothing to submit. Requiring at least a
 * couple of components is not busywork — submitting an empty canvas to
 * reveal the answer is the one way to turn this exercise back into a
 * worked example.
 */
export async function submitDesign(params: {
  userId: string;
  problemSlug: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const problem = await prisma.systemDesignProblem.findFirst({
    where: { slug: params.problemSlug, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!problem) return { ok: false, reason: "That exercise is not available." };

  const existing = await prisma.systemDesignSubmission.findUnique({
    where: {
      userId_problemId: { userId: params.userId, problemId: problem.id },
    },
    select: { diagram: true },
  });

  const diagram = parseDiagram(existing?.diagram, "submit");
  if (diagram.nodes.length < 2) {
    return {
      ok: false,
      reason: "Add at least two components and connect them before submitting.",
    };
  }
  if (diagram.edges.length < 1) {
    return {
      ok: false,
      reason: "Connect your components so the request path is clear.",
    };
  }

  await prisma.systemDesignSubmission.update({
    where: {
      userId_problemId: { userId: params.userId, problemId: problem.id },
    },
    data: { status: "COMPLETED", submittedAt: new Date() },
  });

  return { ok: true };
}
