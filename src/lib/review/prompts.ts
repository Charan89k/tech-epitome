import type { EntityType, Track } from "@/generated/prisma/enums";
import { chapterHref } from "@/lib/tracks";

/**
 * Review prompts, derived from the curriculum that already exists.
 *
 * No separate bank of review questions is authored or stored. A pattern
 * already carries its recognition clues; a chapter already carries its key
 * takeaways; a problem already states what it teaches. Duplicating any of
 * that into a second table would mean two versions of the same idea drifting
 * apart the first time an author edits one.
 *
 * These are pure functions over content that the caller has already loaded,
 * which keeps them testable and keeps the queue free of per-item queries.
 *
 * A review card is not a chapter. Each answer is a handful of bullets — just
 * enough to check a recollection against, not enough to re-read the lesson.
 */

export type AnswerSection = {
  heading: string;
  items: string[];
};

export type ReviewPrompt = {
  /** What the learner is asked to recall, before anything is revealed. */
  question: string;
  /** Short label for the kind of recall, shown above the question. */
  kind: string;
  /** Revealed only after they commit to an attempt. */
  answer: AnswerSection[];
  /** One line of personal context, when the learner's history supplies it. */
  context?: string;
  /** Where to go to re-read the material properly. */
  href: string;
  /** Title of the underlying object. */
  title: string;
};

export type PatternContent = {
  slug: string;
  name: string;
  tagline: string;
  coreIdea: string;
  recognitionClues: string[];
  antiPatterns: string[];
  commonMistakes: string[];
};

export type ChapterContent = {
  slug: string;
  title: string;
  summary: string | null;
  keyTakeaways: string[];
  objectives: string[];
  sectionSlug: string;
  courseSlug: string;
  /** Needed to build the link: chapters now live under several tracks. */
  track: Track;
};

export type ProblemContent = {
  slug: string;
  number: number;
  title: string;
  learningObjective: string | null;
  expectedTime: string | null;
  expectedSpace: string | null;
  patternNames: string[];
  /** From the learner's own record, for the context line. */
  hintsRevealed: number;
  attempts: number;
};

/** Caps a list so a card stays a card. */
function trim(items: string[], max: number): string[] {
  return items.filter((item) => item.trim().length > 0).slice(0, max);
}

function section(heading: string, items: string[]): AnswerSection[] {
  const cleaned = items.filter((item) => item.trim().length > 0);
  return cleaned.length > 0 ? [{ heading, items: cleaned }] : [];
}

export function patternPrompt(pattern: PatternContent): ReviewPrompt {
  return {
    kind: "Pattern",
    title: pattern.name,
    question: `How do you recognise that a problem calls for ${pattern.name}, and what is the idea that makes it work?`,
    href: `/patterns/${pattern.slug}`,
    answer: [
      ...section("Recognition clues", trim(pattern.recognitionClues, 5)),
      ...section("Core idea", [pattern.coreIdea]),
      ...section("Not this pattern when", trim(pattern.antiPatterns, 2)),
      ...section("Easy to get wrong", trim(pattern.commonMistakes, 2)),
    ],
  };
}

export function chapterPrompt(chapter: ChapterContent): ReviewPrompt {
  return {
    kind: "Concept",
    title: chapter.title,
    question: `From memory: what were the key ideas in "${chapter.title}"?`,
    href: chapterHref(
      chapter.track,
      chapter.courseSlug,
      chapter.sectionSlug,
      chapter.slug
    ),
    answer: [
      ...section("Key takeaways", trim(chapter.keyTakeaways, 5)),
      ...section("You should be able to", trim(chapter.objectives, 3)),
    ],
  };
}

export function problemPrompt(problem: ProblemContent): ReviewPrompt {
  const complexity =
    problem.expectedTime || problem.expectedSpace
      ? [`${problem.expectedTime ?? "—"} time, ${problem.expectedSpace ?? "—"} space`]
      : [];

  // Context comes from the learner's own record. It is stated plainly rather
  // than dressed up as a judgement: needing three hints is information, not
  // a verdict.
  const context =
    problem.hintsRevealed > 0
      ? `Last time you opened ${problem.hintsRevealed} hint${problem.hintsRevealed === 1 ? "" : "s"} on this one.`
      : problem.attempts > 2
        ? `This one took you ${problem.attempts} attempts.`
        : undefined;

  return {
    kind: "Problem",
    title: problem.title,
    question: `Without opening the solution: how would you approach "${problem.title}", and why does that approach work?`,
    href: `/problems/${problem.slug}`,
    context,
    answer: [
      ...section("What it teaches", problem.learningObjective ? [problem.learningObjective] : []),
      ...section("Pattern", trim(problem.patternNames, 3)),
      ...section("Target complexity", complexity),
    ],
  };
}

/**
 * A card whose underlying content has been unpublished.
 *
 * Kept visible and gradeable rather than silently dropped: an item vanishing
 * from someone's queue with no explanation is worse than one that says what
 * happened.
 */
export function missingPrompt(entityType: EntityType): ReviewPrompt {
  return {
    kind: "Unavailable",
    title: "Content unavailable",
    question: "This item's content is no longer published.",
    href: "/review",
    answer: [
      {
        heading: "What happened",
        items: [
          `The ${entityType.toLowerCase().replace(/_/g, " ")} this card was built from has been unpublished. Rating it will remove it from your queue.`,
        ],
      },
    ],
  };
}
