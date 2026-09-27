import "server-only";

import { cache } from "react";

import type { QuestionType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { answersMatch, scorePercent } from "./quiz-scoring";

/**
 * Quiz reads and scoring.
 *
 * The correct answer never leaves the server before submission. The client
 * receives prompts and options only; `answer` is stripped by the shape of
 * the select, not by deleting a field afterwards, so it cannot be
 * reintroduced by accident.
 */

export type QuizOption = { id: string; text: string };

export type QuizQuestionView = {
  id: string;
  type: QuestionType;
  order: number;
  prompt: string;
  code: string | null;
  options: QuizOption[];
  points: number;
};

export type QuizView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  passScore: number;
  questions: QuizQuestionView[];
  /** The signed-in user's most recent completed attempt, if any. */
  lastAttempt: {
    score: number;
    maxScore: number;
    passed: boolean;
    completedAt: Date;
  } | null;
};

export const getQuiz = cache(
  async (slug: string, userId?: string): Promise<QuizView | null> => {
    const quiz = await prisma.quiz.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        passScore: true,
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            type: true,
            order: true,
            prompt: true,
            code: true,
            options: true,
            points: true,
            // `answer` and `explanation` are deliberately absent.
          },
        },
      },
    });

    if (!quiz) return null;

    const lastAttempt = userId
      ? await prisma.quizAttempt.findFirst({
          where: { userId, quizId: quiz.id, completedAt: { not: null } },
          orderBy: { completedAt: "desc" },
          select: { score: true, maxScore: true, passed: true, completedAt: true },
        })
      : null;

    return {
      ...quiz,
      questions: quiz.questions.map((question) => ({
        ...question,
        options: (question.options as QuizOption[]) ?? [],
      })),
      lastAttempt:
        lastAttempt && lastAttempt.completedAt
          ? {
              score: lastAttempt.score,
              maxScore: lastAttempt.maxScore,
              passed: lastAttempt.passed,
              completedAt: lastAttempt.completedAt,
            }
          : null,
    };
  }
);

export type GradedQuestion = {
  questionId: string;
  correct: boolean;
  /** The correct option id(s), revealed only after submission. */
  correctAnswer: string | string[];
  submitted: string | string[] | null;
  explanation: string;
};

export type QuizResult = {
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  graded: GradedQuestion[];
};

/**
 * Grades a submission and records the attempt.
 *
 * Scoring happens here, on the server, against the stored answers. A client
 * that posts a score is simply ignored — it is not part of the input.
 */
export async function gradeQuiz(
  userId: string,
  quizSlug: string,
  submitted: Record<string, string | string[]>
): Promise<QuizResult | null> {
  const quiz = await prisma.quiz.findFirst({
    where: { slug: quizSlug, status: "PUBLISHED" },
    select: {
      id: true,
      passScore: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          answer: true,
          explanation: true,
          points: true,
        },
      },
    },
  });

  if (!quiz) return null;

  let score = 0;
  let maxScore = 0;
  const graded: GradedQuestion[] = [];

  for (const question of quiz.questions) {
    maxScore += question.points;

    const expected = question.answer as string | string[];
    const given = submitted[question.id] ?? null;
    const correct = answersMatch(expected, given);

    if (correct) score += question.points;

    graded.push({
      questionId: question.id,
      correct,
      correctAnswer: expected,
      submitted: given,
      explanation: question.explanation,
    });
  }

  const percent = scorePercent(score, maxScore);
  const passed = percent >= quiz.passScore;

  await prisma.quizAttempt.create({
    data: {
      userId,
      quizId: quiz.id,
      answers: submitted as object,
      score,
      maxScore,
      passed,
      completedAt: new Date(),
    },
  });

  return { score, maxScore, percent, passed, graded };
}
