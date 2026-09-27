"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Difficulty, InterviewType, Language } from "@/generated/prisma/enums";
import { getAIProvider, recordAIUsage } from "@/lib/ai";
import { recordEvent } from "@/lib/analytics";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { requireUserOrThrow } from "@/lib/auth/session";
import {
  boundTranscript,
  buildFeedbackSystemPrompt,
  renderInterviewContext,
} from "@/lib/interview/policy";
import { EVALUATION_DIMENSIONS, RATING_BANDS } from "@/lib/interview/types";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import {
  createInterview,
  loadFeedbackContext,
  saveFeedback,
  saveInterviewCode,
  setStage,
} from "@/services/interview";

/**
 * Interview mutations.
 *
 * Same contract as everywhere else: authenticate, check the
 * entitlement, rate limit, validate, and never accept a user id from
 * the client. What is specific here is that **no action accepts an
 * interview stage** — the order of an interview is server-owned, and
 * the only transition a candidate may request is ending it.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const createSchema = z.object({
  type: z.nativeEnum(InterviewType),
  difficulty: z.nativeEnum(Difficulty),
  language: z.nativeEnum(Language),
});

export async function createInterviewAction(
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUserOrThrow();
  if (!canAccess(user, FEATURES.AI_MOCK_INTERVIEW)) {
    return { ok: false, error: "Mock interviews are part of Pro." };
  }

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  // Creating a session is cheap but it picks a problem and writes a
  // row; without a limit a loop could fill the table.
  const limited = await rateLimit(`interview-new:${user.id}`, RATE_LIMITS.CODE_SUBMIT);
  if (!limited.success) {
    return { ok: false, error: "Slow down a moment before starting another." };
  }

  const result = await createInterview({
    userId: user.id,
    type: parsed.data.type,
    difficulty: parsed.data.difficulty,
    language: parsed.data.language,
  });
  if (!result.ok) return { ok: false, error: result.reason };

  await recordEvent(user.id, "interview_started", {
    type: parsed.data.type,
    difficulty: parsed.data.difficulty,
  });

  revalidatePath("/interviews");
  return { ok: true, data: { id: result.id } };
}

const codeSchema = z.object({
  sessionId: z.string().min(1).max(64),
  code: z.string().max(60_000),
  language: z.nativeEnum(Language),
});

export async function saveInterviewCodeAction(
  raw: unknown
): Promise<ActionResult> {
  const user = await requireUserOrThrow();

  const parsed = codeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That request was not in the expected shape." };
  }

  const limited = await rateLimit(`interview-code:${user.id}`, RATE_LIMITS.REVIEW_GRADE);
  if (!limited.success) {
    return { ok: false, error: "Saving too quickly. Pause for a moment." };
  }

  // Scoped update — a session id belonging to somebody else matches no
  // row and the write is a no-op rather than a leak.
  const saved = await saveInterviewCode({
    sessionId: parsed.data.sessionId,
    userId: user.id,
    code: parsed.data.code,
    language: parsed.data.language,
  });

  if (!saved) return { ok: false, error: "That interview is not available." };
  return { ok: true, data: undefined };
}

/** Ends the interview. The one stage transition a candidate may ask for. */
export async function endInterviewAction(
  sessionId: string
): Promise<ActionResult> {
  const user = await requireUserOrThrow();
  await setStage({ sessionId, userId: user.id, stage: "ENDED" });
  revalidatePath(`/interviews/${sessionId}`);
  revalidatePath("/interviews");
  return { ok: true, data: undefined };
}

/**
 * The shape the feedback model must return.
 *
 * Validated rather than trusted: this is a language model's output
 * being written to the database, so an unexpected band or a missing
 * evidence string has to fail here rather than surface as a broken
 * report. `.catch` is deliberately absent — a malformed response is an
 * error worth showing, not something to paper over with defaults.
 */
const feedbackSchema = z.object({
  dimensions: z
    .array(
      z.object({
        dimension: z.enum(EVALUATION_DIMENSIONS),
        band: z.enum(RATING_BANDS),
        evidence: z.string().min(1).max(600),
      })
    )
    .min(1)
    .max(EVALUATION_DIMENSIONS.length),
  strengths: z.array(z.string().min(1).max(400)).max(6),
  improvements: z.array(z.string().min(1).max(400)).max(6),
  summary: z.string().min(1).max(2_000),
});

/**
 * Generates the written feedback.
 *
 * This is the only place the reference solution enters an AI context,
 * and `loadFeedbackContext` refuses unless the interview has actually
 * ended — so there is no ordering in which the interviewer could have
 * seen it.
 */
export async function generateFeedbackAction(
  sessionId: string
): Promise<ActionResult<{ generated: true }>> {
  const user = await requireUserOrThrow();
  if (!canAccess(user, FEATURES.AI_MOCK_INTERVIEW)) {
    return { ok: false, error: "Mock interviews are part of Pro." };
  }

  const limited = await rateLimit(`interview-feedback:${user.id}`, RATE_LIMITS.AI_MESSAGE);
  if (!limited.success) {
    return { ok: false, error: "Too many requests. Try again shortly." };
  }

  const context = await loadFeedbackContext(sessionId, user.id);
  if (!context) {
    return {
      ok: false,
      error: "Feedback is available once the interview has finished.",
    };
  }

  if (context.transcript.length === 0) {
    return {
      ok: false,
      error: "There is no transcript to review — this interview never started.",
    };
  }

  const contextBlock = renderInterviewContext({
    type: context.type,
    difficulty: context.difficulty,
    stage: context.stage,
    problemTitle: context.problemTitle,
    problemStatement: context.problemStatement,
    code: context.code ? { language: context.language, body: context.code } : undefined,
    reference: context.reference,
  });

  const transcript = boundTranscript(context.transcript)
    .map((turn) => `${turn.role === "USER" ? "Candidate" : "Interviewer"}: ${turn.content}`)
    .join("\n\n");

  const provider = getAIProvider();
  const startedAt = Date.now();

  let raw: string;
  try {
    const result = await provider.generate({
      messages: [
        { role: "system", content: buildFeedbackSystemPrompt() },
        {
          role: "user",
          content:
            `${contextBlock}\n\n<<<TRANSCRIPT>>>\n${transcript}\n<<<END_TRANSCRIPT>>>\n\n` +
            `Assess these dimensions: ${EVALUATION_DIMENSIONS.join(", ")}.\n` +
            `Bands: ${RATING_BANDS.join(", ")}.\n` +
            `Return JSON: { dimensions: [{dimension, band, evidence}], strengths: [], improvements: [], summary }`,
        },
      ],
      maxOutputTokens: 1_600,
      temperature: 0.4,
    });
    raw = result.text;

    await recordAIUsage({
      userId: user.id,
      provider: provider.name,
      model: provider.defaultModel,
      feature: "interview-feedback",
      usage: result.usage,
      latencyMs: Date.now() - startedAt,
      success: true,
    });
  } catch (error) {
    console.error("[interview] feedback generation failed", error);
    await recordAIUsage({
      userId: user.id,
      provider: provider.name,
      model: provider.defaultModel,
      feature: "interview-feedback",
      usage: { promptTokens: 0, completionTokens: 0 },
      latencyMs: Date.now() - startedAt,
      success: false,
    });
    return { ok: false, error: "Could not generate feedback. Try again shortly." };
  }

  // Models sometimes wrap JSON in a fence despite being told not to.
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    return {
      ok: false,
      error: "The feedback came back in an unexpected format. Try again.",
    };
  }

  const validated = feedbackSchema.safeParse(parsedJson);
  if (!validated.success) {
    return {
      ok: false,
      error: "The feedback came back in an unexpected format. Try again.",
    };
  }

  const saved = await saveFeedback({
    sessionId,
    userId: user.id,
    dimensions: validated.data.dimensions,
    strengths: validated.data.strengths,
    improvements: validated.data.improvements,
    summary: validated.data.summary,
  });
  if (!saved) return { ok: false, error: "That interview is not available." };

  await recordEvent(user.id, "interview_completed", { sessionId });

  revalidatePath(`/interviews/${sessionId}`);
  revalidatePath("/interviews");
  return { ok: true, data: { generated: true } };
}
