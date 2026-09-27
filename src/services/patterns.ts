import "server-only";

import { cache } from "react";

import type { AccessTier, Difficulty, Track } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

/**
 * Pattern library reads.
 *
 * Patterns are first-class entities rather than tags, because recognition is
 * the thing the product teaches. Each read therefore carries the mastery
 * figure for the signed-in user: the library doubles as a map of what they
 * can and cannot yet spot.
 */

export type PatternSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  difficulty: Difficulty;
  access: AccessTier;
  problemCount: number;
  /** 0-100, or null when the user has never attempted this pattern. */
  mastery: number | null;
  solved: number;
};

export const listPatterns = cache(
  async (userId?: string): Promise<PatternSummary[]> => {
    const patterns = await prisma.pattern.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        difficulty: true,
        access: true,
        _count: { select: { problems: true } },
      },
    });

    const mastery = userId
      ? await prisma.userPatternMastery.findMany({
          where: { userId },
          select: { patternId: true, score: true, solved: true, attempts: true },
        })
      : [];
    const byPattern = new Map(mastery.map((row) => [row.patternId, row]));

    return patterns.map((pattern) => {
      const row = byPattern.get(pattern.id);
      return {
        id: pattern.id,
        slug: pattern.slug,
        name: pattern.name,
        tagline: pattern.tagline,
        difficulty: pattern.difficulty,
        access: pattern.access,
        problemCount: pattern._count.problems,
        // Null rather than 0 for an unattempted pattern: "not started" and
        // "tried and struggled" are different things and must look different.
        mastery: row && row.attempts > 0 ? row.score : null,
        solved: row?.solved ?? 0,
      };
    });
  }
);

export type PatternDetail = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  recognitionClues: string[];
  antiPatterns: string[];
  coreIdea: string;
  templateCode: Record<string, string>;
  commonMistakes: string[];
  timeComplexity: string | null;
  spaceComplexity: string | null;
  difficulty: Difficulty;
  access: AccessTier;
  mastery: number | null;
  problems: {
    slug: string;
    number: number;
    title: string;
    difficulty: Difficulty;
    isPrimary: boolean;
    status: "NOT_STARTED" | "ATTEMPTED" | "SOLVED";
  }[];
  chapters: {
    slug: string;
    title: string;
    sectionSlug: string;
    courseSlug: string;
    track: Track;
  }[];
};

export const getPattern = cache(
  async (slug: string, userId?: string): Promise<PatternDetail | null> => {
    const pattern = await prisma.pattern.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        recognitionClues: true,
        antiPatterns: true,
        coreIdea: true,
        templateCode: true,
        commonMistakes: true,
        timeComplexity: true,
        spaceComplexity: true,
        difficulty: true,
        access: true,
        problems: {
          orderBy: [{ isPrimary: "desc" }],
          select: {
            isPrimary: true,
            problem: {
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
        chapters: {
          select: {
            chapter: {
              select: {
                slug: true,
                title: true,
                section: {
                  select: {
                    slug: true,
                    course: { select: { slug: true, track: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pattern) return null;

    const mastery = userId
      ? await prisma.userPatternMastery.findUnique({
          where: { userId_patternId: { userId, patternId: pattern.id } },
          select: { score: true, attempts: true },
        })
      : null;

    return {
      id: pattern.id,
      slug: pattern.slug,
      name: pattern.name,
      tagline: pattern.tagline,
      description: pattern.description,
      recognitionClues: pattern.recognitionClues,
      antiPatterns: pattern.antiPatterns,
      coreIdea: pattern.coreIdea,
      templateCode: (pattern.templateCode ?? {}) as Record<string, string>,
      commonMistakes: pattern.commonMistakes,
      timeComplexity: pattern.timeComplexity,
      spaceComplexity: pattern.spaceComplexity,
      difficulty: pattern.difficulty,
      access: pattern.access,
      mastery: mastery && mastery.attempts > 0 ? mastery.score : null,
      problems: pattern.problems
        .filter((row) => row.problem.status === "PUBLISHED")
        .map((row) => ({
          slug: row.problem.slug,
          number: row.problem.number,
          title: row.problem.title,
          difficulty: row.problem.difficulty,
          isPrimary: row.isPrimary,
          status:
            (Array.isArray(row.problem.progress)
              ? row.problem.progress[0]?.status
              : undefined) ?? "NOT_STARTED",
        }))
        .sort((a, b) => a.number - b.number),
      chapters: pattern.chapters.map((row) => ({
        slug: row.chapter.slug,
        title: row.chapter.title,
        sectionSlug: row.chapter.section.slug,
        courseSlug: row.chapter.section.course.slug,
        track: row.chapter.section.course.track,
      })),
    };
  }
);
