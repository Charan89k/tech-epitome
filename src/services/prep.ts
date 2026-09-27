import "server-only";

import type { Difficulty, ProblemStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

/**
 * Interview preparation tracks.
 *
 * A track is a shape of interview loop — not an employer. See
 * `src/data/prep/tracks.ts` for why, and for the rule that every
 * recommendation carries its provenance and its reason.
 *
 * Progress is computed from the learner's own rows and nothing else. A
 * track's completion is the fraction of its recommended problems they
 * have actually solved, so a signed-out visitor sees the plan with no
 * progress rather than a fabricated zero-of-something.
 */

export type PrepStage = { name: string; detail: string };
export type PrepRoadmapStep = { title: string; detail: string; weeks: string };

/** Shown next to every recommendation so a reader can discount it. */
export type Provenance = {
  source: string;
  sourceUrl: string | null;
  reportedAt: Date;
  confidence: number;
  rationale: string;
};

export type PrepTrackSummary = {
  slug: string;
  name: string;
  blurb: string;
  focusAreas: string[];
  problemCount: number;
  designCount: number;
  /** Null when signed out: no user, no progress, and no pretending. */
  solved: number | null;
};

export type PrepTrackDetail = {
  slug: string;
  name: string;
  blurb: string;
  focusAreas: string[];
  interviewStages: PrepStage[];
  roadmap: PrepRoadmapStep[];
  problems: {
    slug: string;
    number: number;
    title: string;
    difficulty: Difficulty;
    status: ProblemStatus;
    provenance: Provenance;
  }[];
  systemDesign: {
    slug: string;
    title: string;
    tagline: string;
    difficulty: Difficulty;
    submitted: boolean;
    provenance: Provenance;
  }[];
  progress: { solved: number; total: number } | null;
};

function asStages(value: unknown): PrepStage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    const stage = row as Record<string, unknown>;
    return typeof stage?.name === "string" && typeof stage?.detail === "string"
      ? [{ name: stage.name, detail: stage.detail }]
      : [];
  });
}

function asRoadmap(value: unknown): PrepRoadmapStep[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    const step = row as Record<string, unknown>;
    return typeof step?.title === "string" &&
      typeof step?.detail === "string" &&
      typeof step?.weeks === "string"
      ? [{ title: step.title, detail: step.detail, weeks: step.weeks }]
      : [];
  });
}

export async function listPrepTracks(
  userId?: string
): Promise<PrepTrackSummary[]> {
  const tracks = await prisma.prepTrack.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      slug: true,
      name: true,
      blurb: true,
      focusAreas: true,
      _count: { select: { problems: true, systemDesignTopics: true } },
      problems: { select: { problemId: true } },
    },
  });

  if (!userId) {
    return tracks.map((track) => ({
      slug: track.slug,
      name: track.name,
      blurb: track.blurb,
      focusAreas: track.focusAreas,
      problemCount: track._count.problems,
      designCount: track._count.systemDesignTopics,
      solved: null,
    }));
  }

  // One query for every track's solved problems rather than one per
  // track: the number of tracks is small but the pattern is not.
  const solvedIds = new Set(
    (
      await prisma.userProblemProgress.findMany({
        where: {
          userId,
          status: "SOLVED",
          problemId: {
            in: [...new Set(tracks.flatMap((t) => t.problems.map((p) => p.problemId)))],
          },
        },
        select: { problemId: true },
      })
    ).map((row) => row.problemId)
  );

  return tracks.map((track) => ({
    slug: track.slug,
    name: track.name,
    blurb: track.blurb,
    focusAreas: track.focusAreas,
    problemCount: track._count.problems,
    designCount: track._count.systemDesignTopics,
    solved: track.problems.filter((p) => solvedIds.has(p.problemId)).length,
  }));
}

export async function getPrepTrack(
  slug: string,
  userId?: string
): Promise<PrepTrackDetail | null> {
  const track = await prisma.prepTrack.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      slug: true,
      name: true,
      blurb: true,
      focusAreas: true,
      interviewStages: true,
      roadmap: true,
      problems: {
        orderBy: { confidence: "desc" },
        select: {
          source: true,
          sourceUrl: true,
          reportedAt: true,
          confidence: true,
          rationale: true,
          problem: {
            // Statement, solutions and test cases are deliberately absent:
            // this is a reading list, not a problem page.
            select: {
              slug: true,
              number: true,
              title: true,
              difficulty: true,
              status: true,
              progress: userId
                ? { where: { userId }, select: { status: true }, take: 1 }
                : false,
            },
          },
        },
      },
      systemDesignTopics: {
        orderBy: { confidence: "desc" },
        select: {
          source: true,
          sourceUrl: true,
          reportedAt: true,
          confidence: true,
          rationale: true,
          problem: {
            select: {
              slug: true,
              title: true,
              tagline: true,
              difficulty: true,
              status: true,
              submissions: userId
                ? { where: { userId }, select: { submittedAt: true }, take: 1 }
                : false,
            },
          },
        },
      },
    },
  });

  if (!track) return null;

  // A retired problem must not appear on a track as a dead link.
  const problems = track.problems
    .filter((row) => row.problem.status === "PUBLISHED")
    .map((row) => ({
      slug: row.problem.slug,
      number: row.problem.number,
      title: row.problem.title,
      difficulty: row.problem.difficulty,
      status: row.problem.progress?.[0]?.status ?? ("NOT_STARTED" as const),
      provenance: {
        source: row.source,
        sourceUrl: row.sourceUrl,
        reportedAt: row.reportedAt,
        confidence: row.confidence,
        rationale: row.rationale,
      },
    }));

  const systemDesign = track.systemDesignTopics
    .filter((row) => row.problem.status === "PUBLISHED")
    .map((row) => ({
      slug: row.problem.slug,
      title: row.problem.title,
      tagline: row.problem.tagline,
      difficulty: row.problem.difficulty,
      submitted: Boolean(
        row.problem.submissions && row.problem.submissions[0]?.submittedAt
      ),
      provenance: {
        source: row.source,
        sourceUrl: row.sourceUrl,
        reportedAt: row.reportedAt,
        confidence: row.confidence,
        rationale: row.rationale,
      },
    }));

  return {
    slug: track.slug,
    name: track.name,
    blurb: track.blurb,
    focusAreas: track.focusAreas,
    interviewStages: asStages(track.interviewStages),
    roadmap: asRoadmap(track.roadmap),
    problems,
    systemDesign,
    progress: userId
      ? {
          solved: problems.filter((p) => p.status === "SOLVED").length,
          total: problems.length,
        }
      : null,
  };
}

export async function listPrepTrackSlugs(): Promise<string[]> {
  const rows = await prisma.prepTrack.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
    orderBy: { order: "asc" },
  });
  return rows.map((row) => row.slug);
}
