import { z } from "zod";

/**
 * Input shapes for the campus workflows, validated at the action boundary
 * and again by the services that store them.
 */

export const CHOICE_TYPES = [
  "MULTIPLE_CHOICE",
  "MULTI_SELECT",
  "TRUE_FALSE",
  "CODE_OUTPUT",
  "COMPLEXITY",
] as const;

export const EXAM_LANGUAGES = ["PYTHON", "JAVASCRIPT", "JAVA", "CPP"] as const;

export const MAX_CODE_CHARS = 60_000;

const id = z.string().min(1).max(64);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const classSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: optionalText(2000),
});

export const classMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["STUDENT", "INSTRUCTOR"]),
});

export const assignmentSchema = z.object({
  /** "course:<id>", "chapter:<id>" or "problem:<id>". */
  target: z.string().regex(/^(course|chapter|problem):[A-Za-z0-9_-]{1,64}$/),
  instructions: optionalText(4000),
  dueAt: z.coerce.date().optional().nullable(),
});

export const bankSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: optionalText(2000),
});

export type ChoiceOption = { id: string; text: string };

/**
 * Options as typed by staff: one per line, correct ones prefixed with "*".
 * Ids are letters in order, so a stored answer reads as "b" or ["a","c"].
 */
export function parseOptionLines(text: string): {
  options: ChoiceOption[];
  correct: string[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const options: ChoiceOption[] = [];
  const correct: string[] = [];
  lines.forEach((line, i) => {
    const optionId = String.fromCharCode(97 + i);
    const isCorrect = line.startsWith("*");
    options.push({ id: optionId, text: (isCorrect ? line.slice(1) : line).trim() });
    if (isCorrect) correct.push(optionId);
  });
  return { options, correct };
}

const base = {
  category: z.string().trim().min(1).max(40),
  prompt: z.string().trim().min(1).max(8000),
  points: z.coerce.number().int().min(1).max(100),
  explanation: optionalText(4000),
};

export const bankQuestionSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("CHOICE"),
      type: z.enum(CHOICE_TYPES),
      code: optionalText(8000),
      optionLines: z.string().max(8000),
      ...base,
    })
    .transform((q, ctx) => {
      const { options, correct } = parseOptionLines(q.optionLines);
      if (options.length < 2 || options.length > 8) {
        ctx.addIssue({ code: "custom", message: "Give 2 to 8 options." });
        return z.NEVER;
      }
      if (options.some((o) => !o.text || o.text.length > 500)) {
        ctx.addIssue({ code: "custom", message: "Options must be 1-500 characters." });
        return z.NEVER;
      }
      const multi = q.type === "MULTI_SELECT";
      if (correct.length === 0 || (!multi && correct.length !== 1)) {
        ctx.addIssue({
          code: "custom",
          message: multi
            ? "Mark at least one correct option with *."
            : "Mark exactly one correct option with *.",
        });
        return z.NEVER;
      }
      return {
        kind: "CHOICE" as const,
        type: q.type,
        category: q.category,
        prompt: q.prompt,
        code: q.code,
        options,
        answer: multi ? correct : correct[0]!,
        explanation: q.explanation,
        points: q.points,
        problemSlug: null,
      };
    }),
  z
    .object({
      kind: z.literal("CODING"),
      problemSlug: z
        .string()
        .trim()
        .regex(/^[a-z0-9-]{1,120}$/),
      ...base,
    })
    .transform((q) => ({
      kind: "CODING" as const,
      type: null,
      category: q.category,
      prompt: q.prompt,
      code: null,
      options: [] as ChoiceOption[],
      answer: null,
      explanation: q.explanation,
      points: q.points,
      problemSlug: q.problemSlug,
    })),
]);

export type BankQuestionInput = z.output<typeof bankQuestionSchema>;

/** Datetime-local inputs carry no zone; the form sends the browser's offset. */
export const assessmentSettingsSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    instructions: z.string().trim().max(8000).default(""),
    opensAt: z.coerce.date().optional().nullable(),
    closesAt: z.coerce.date(),
    lateUntil: z.coerce.date().optional().nullable(),
    latePenaltyPercent: z.coerce.number().int().min(0).max(100).default(0),
    durationMinutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
    maxAttempts: z.coerce.number().int().min(1).max(10).default(1),
    scorePolicy: z.enum(["BEST", "LATEST"]).default("BEST"),
    showScoreOnSubmit: z.coerce.boolean().default(false),
  })
  .refine((s) => !s.opensAt || s.opensAt < s.closesAt, {
    message: "The exam must open before it closes.",
  })
  .refine((s) => !s.lateUntil || s.lateUntil > s.closesAt, {
    message: "The late window must end after the deadline.",
  });

export type AssessmentSettings = z.output<typeof assessmentSettingsSchema>;

export const itemSchema = z.object({
  questionId: id,
  points: z.coerce.number().int().min(1).max(100).optional(),
});

/** What a student may store as an answer, checked against the paper. */
export const choiceValueSchema = z.union([
  z.string().min(1).max(8),
  z.array(z.string().min(1).max(8)).max(8),
]);
export const codingValueSchema = z.object({
  language: z.enum(EXAM_LANGUAGES),
  code: z.string().max(MAX_CODE_CHARS),
});

export const saveAnswerSchema = z.object({
  attemptId: id,
  questionKey: z.string().min(1).max(16),
  value: z.unknown(),
  seq: z.number().int().min(1).max(1_000_000_000),
});

export const gradeSchema = z.object({
  points: z.coerce.number().min(0).max(100),
  feedback: optionalText(4000),
});
