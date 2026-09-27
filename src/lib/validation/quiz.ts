import { z } from "zod";

/**
 * Quiz submission shape.
 *
 * Deliberately narrow: a map from question id to one option id or a list of
 * them. Notably absent is any notion of a score — that is computed server
 * side, and accepting one from the client would make the whole quiz
 * advisory.
 */
export const quizSubmissionSchema = z.object({
  quizSlug: z.string().min(1).max(120),
  answers: z.record(
    z.string().min(1).max(64),
    z.union([z.string().min(1).max(64), z.array(z.string().min(1).max(64)).max(12)])
  ),
});

export type QuizSubmissionInput = z.infer<typeof quizSubmissionSchema>;
