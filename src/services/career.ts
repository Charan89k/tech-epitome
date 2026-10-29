import "server-only";

import {
  summarizeEvaluations,
  type CareerSummary,
  type DimensionHistory,
} from "@/lib/career/summary";
import { prisma } from "@/lib/db";
import { DIMENSION_LABELS, MACHINES, type InterviewKind } from "@/lib/interview/types";
import { segmentForTrack } from "@/lib/tracks";

/**
 * Interview insights and what to practise next, for the signed-in learner
 * only. Everything comes from their own rows: written feedback they
 * received, problems they solved, designs they submitted. A learner with
 * no feedback gets no strengths or weaknesses, not placeholders.
 *
 * Recommendations point only at content that exists and is published,
 * and each one says which feedback it answers.
 */

export type Recommendation = {
  title: string;
  href: string;
  /** Why this, in terms of the learner's own feedback. */
  reason: string;
};

export type CareerOverview = {
  summary: CareerSummary;
  history: {
    problemsSolved: number;
    chaptersCompleted: number;
    designsSubmitted: number;
    interviewsCompleted: number;
  };
  recommendations: Recommendation[];
};

const DSA_DIMENSIONS = new Set([
  "problemUnderstanding",
  "approach",
  "correctness",
  "complexityReasoning",
  "codeQuality",
  "testing",
  "followUps",
]);

function because(type: InterviewKind, weak: DimensionHistory[]): string {
  const names = weak.map((h) => DIMENSION_LABELS[h.dimension].toLowerCase());
  return `Your latest ${MACHINES[type].label.toLowerCase()} feedback rated ${names.join(", ")} as developing.`;
}

async function dsaRecommendations(
  userId: string,
  weak: DimensionHistory[]
): Promise<Recommendation[]> {
  const reason = because("DSA", weak);
  const out: Recommendation[] = [];

  // The patterns the learner has done least well on, from their own
  // submissions, each with a published problem they have not solved.
  const mastery = await prisma.userPatternMastery.findMany({
    where: { userId, attempts: { gt: 0 } },
    orderBy: { score: "asc" },
    take: 2,
    select: { pattern: { select: { id: true, slug: true, name: true } } },
  });
  for (const { pattern } of mastery) {
    out.push({
      title: `Pattern: ${pattern.name}`,
      href: `/patterns/${pattern.slug}`,
      reason,
    });
    const problem = await prisma.problem.findFirst({
      where: {
        status: "PUBLISHED",
        patterns: { some: { patternId: pattern.id } },
        progress: { none: { userId, status: "SOLVED" } },
      },
      orderBy: { number: "asc" },
      select: { slug: true, title: true },
    });
    if (problem)
      out.push({ title: problem.title, href: `/problems/${problem.slug}`, reason });
  }
  if (out.length === 0) {
    const problems = await prisma.problem.findMany({
      where: { status: "PUBLISHED", progress: { none: { userId, status: "SOLVED" } } },
      orderBy: { number: "asc" },
      take: 2,
      select: { slug: true, title: true },
    });
    out.push(
      ...problems.map((p) => ({ title: p.title, href: `/problems/${p.slug}`, reason }))
    );
  }

  if (weak.some((h) => h.dimension === "complexityReasoning")) {
    const chapter = await prisma.chapter.findFirst({
      where: {
        status: "PUBLISHED",
        title: { contains: "complexity", mode: "insensitive" },
      },
      orderBy: { order: "asc" },
      select: {
        slug: true,
        title: true,
        section: {
          select: { slug: true, course: { select: { slug: true, track: true } } },
        },
      },
    });
    if (chapter) {
      const course = chapter.section.course;
      out.push({
        title: `Lesson: ${chapter.title}`,
        href: `/learn/${segmentForTrack(course.track)}/${course.slug}/${chapter.section.slug}/${chapter.slug}`,
        reason: "Your feedback rated complexity reasoning as developing.",
      });
    }
  }
  return out;
}

async function designRecommendations(
  userId: string,
  type: "SYSTEM_DESIGN" | "LLD",
  weak: DimensionHistory[]
): Promise<Recommendation[]> {
  const reason = because(type, weak);
  const where = { status: "PUBLISHED" as const, submissions: { none: { userId } } };
  const select = { slug: true, title: true };
  const rows =
    type === "SYSTEM_DESIGN"
      ? await prisma.systemDesignProblem.findMany({ where, select, take: 2 })
      : await prisma.lLDProblem.findMany({ where, select, take: 2 });
  const base = type === "SYSTEM_DESIGN" ? "/system-design" : "/lld";
  return rows.map((r) => ({ title: r.title, href: `${base}/${r.slug}`, reason }));
}

export async function getCareerOverview(userId: string): Promise<CareerOverview> {
  const evaluated = await prisma.interviewSession.findMany({
    where: { userId, evaluation: { isNot: null } },
    select: {
      type: true,
      startedAt: true,
      evaluation: { select: { dimensions: true } },
    },
  });
  const summary = summarizeEvaluations(
    evaluated.map((s) => ({
      type: s.type as InterviewKind,
      at: s.startedAt,
      dimensions: Array.isArray(s.evaluation?.dimensions)
        ? (s.evaluation.dimensions as { dimension: string; band: string }[])
        : [],
    }))
  );

  const [problemsSolved, chaptersCompleted, sd, lld, interviewsCompleted] =
    await Promise.all([
      prisma.userProblemProgress.count({ where: { userId, status: "SOLVED" } }),
      prisma.userChapterProgress.count({ where: { userId, status: "COMPLETED" } }),
      prisma.systemDesignSubmission.count({ where: { userId } }),
      prisma.lLDSubmission.count({ where: { userId } }),
      prisma.interviewSession.count({ where: { userId, status: "COMPLETED" } }),
    ]);

  const weakBy = (type: InterviewKind) =>
    summary.improvements.filter((h) => h.type === type);
  const recommendations: Recommendation[] = [];
  const dsaWeak = weakBy("DSA").filter((h) => DSA_DIMENSIONS.has(h.dimension));
  if (dsaWeak.length)
    recommendations.push(...(await dsaRecommendations(userId, dsaWeak)));
  for (const type of ["SYSTEM_DESIGN", "LLD"] as const) {
    const weak = weakBy(type);
    if (weak.length) {
      recommendations.push(...(await designRecommendations(userId, type, weak)));
    }
  }
  const behavioural = weakBy("BEHAVIORAL");
  if (behavioural.length) {
    recommendations.push({
      title: "Another behavioural mock interview",
      href: "/interviews",
      reason: because("BEHAVIORAL", behavioural),
    });
  }

  return {
    summary,
    history: {
      problemsSolved,
      chaptersCompleted,
      designsSubmitted: sd + lld,
      interviewsCompleted,
    },
    // Distinct by link, in priority order.
    recommendations: recommendations.filter(
      (r, i) => recommendations.findIndex((x) => x.href === r.href) === i
    ),
  };
}
