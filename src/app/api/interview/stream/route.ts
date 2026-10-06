import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getAIProvider, recordAIUsage } from "@/lib/ai";
import { AIProviderUnavailableError } from "@/lib/ai/types";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import {
  boundTranscript,
  buildInterviewSystemPrompt,
  renderInterviewContext,
} from "@/lib/interview/policy";
import {
  defaultRequestFor,
  isLegalTransition,
  nextStage,
  type InterviewKind,
} from "@/lib/interview/types";
import { checkAiTurnQuota } from "@/lib/ai/quota";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import {
  appendTranscript,
  loadInterviewContext,
  setStage,
} from "@/services/interview";

/**
 * The AI interviewer.
 *
 * A second consumer of the same AI gateway as the tutor — the same
 * `getAIProvider`, `recordAIUsage`, rate limiter and entitlement check —
 * not a second AI framework. What differs is the policy, the context and
 * where the turns are persisted: an interview transcript is an
 * `InterviewMessage`, not an `AIMessage`, because it belongs to a
 * session with a lifecycle rather than to a conversation.
 *
 * The ordering here is the security model, and one part of it is
 * specific to interviews: **the client never sends the stage or the
 * request type**. It sends only what the candidate said. The server
 * reads the stored stage, derives the request type from it, and
 * refuses anything the state machine says is illegal. A candidate who
 * could post `{ requestType: "END_INTERVIEW" }` at will could skip
 * straight to the feedback, and an interview you can skip is not one.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  sessionId: z.string().min(1).max(64),
  /** What the candidate said. Empty is legal for the opening turn. */
  message: z.string().max(8_000).optional(),
  /** Their editor contents, sent so the interviewer can ask about it. */
  code: z.string().max(60_000).optional(),
  /** Candidate-initiated end. The only stage transition they may request. */
  end: z.boolean().optional(),
});

type StreamEvent =
  | { type: "meta"; stage: string; requestType: string }
  | { type: "text"; text: string }
  | { type: "done"; stage: string; ended: boolean }
  | { type: "error"; message: string; retryable: boolean };

function sse(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "Sign in to run a mock interview.");

  if (!canAccess(user, FEATURES.AI_MOCK_INTERVIEW)) {
    return fail(403, "Sign in to run a mock interview.");
  }

  const limited = await rateLimit(`interview:${user.id}`, RATE_LIMITS.AI_MESSAGE);
  if (!limited.success) {
    const seconds = Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000));
    return fail(429, `Too many turns at once. Try again in ${seconds}s.`);
  }

  const quota = await checkAiTurnQuota(user);
  if (!quota.ok) return fail(429, quota.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "That request was not in the expected shape.");
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail(400, "That request was not in the expected shape.");
  const input = parsed.data;

  // Scoped load: naming somebody else's session matches no row.
  const context = await loadInterviewContext(input.sessionId, user.id);
  if (!context) return fail(404, "That interview is not available.");

  if (context.stage === "ENDED") {
    return fail(409, "This interview has already finished.");
  }

  // The stage comes from the database; the request type is derived from
  // it. The only thing the candidate may choose is to stop.
  const kind = context.type as InterviewKind;
  const requestType = input.end
    ? "END_INTERVIEW"
    : defaultRequestFor(kind, context.stage);

  if (!isLegalTransition(kind, context.stage, requestType)) {
    return fail(409, "That is not a valid step in this interview right now.");
  }

  // Persist what the candidate said before calling the model, so a
  // provider failure leaves a transcript that still reads correctly.
  if (input.message?.trim()) {
    await appendTranscript({
      sessionId: input.sessionId,
      userId: user.id,
      role: "USER",
      content: input.message.trim(),
    });
  }

  const systemPrompt = buildInterviewSystemPrompt({
    requestType,
    stage: context.stage,
    type: kind,
    difficulty: context.difficulty,
  });

  // No `reference` — the interviewer must not know the solution while
  // the interview is running. `loadInterviewContext` does not select it
  // and nothing here supplies it.
  const contextBlock = renderInterviewContext({
    type: kind,
    difficulty: context.difficulty,
    stage: context.stage,
    problemTitle: context.problemTitle,
    problemStatement: context.problemStatement,
    code: input.code?.trim()
      ? { language: context.language, body: input.code }
      : undefined,
  });

  const transcript = boundTranscript(
    input.message?.trim()
      ? [...context.transcript, { role: "USER" as const, content: input.message.trim() }]
      : context.transcript
  );

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...transcript.map((turn) => ({
      role: turn.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: turn.content,
    })),
    {
      role: "user" as const,
      content: `${contextBlock}\n\nConduct this turn (${requestType}).`,
    },
  ];

  const provider = getAIProvider();
  const startedAt = Date.now();
  const encoder = new TextEncoder();
  const resolvedStage = nextStage(kind, context.stage, requestType);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      let usage = { promptTokens: 0, completionTokens: 0 };
      let ok = true;

      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(sse(event)));

      send({ type: "meta", stage: context.stage, requestType });

      try {
        for await (const chunk of provider.stream({
          messages,
          maxOutputTokens: 700,
          temperature: 0.7,
          signal: request.signal,
        })) {
          if (chunk.type === "text") {
            answer += chunk.text;
            send({ type: "text", text: chunk.text });
          } else {
            usage = chunk.usage;
          }
        }
      } catch (error) {
        ok = false;
        const aborted =
          request.signal.aborted ||
          (error instanceof Error && error.name === "AbortError");
        if (!aborted) {
          // The provider's message can carry a status body or a key
          // fragment; it goes to the log, not to the candidate.
          console.error("[interview] provider stream failed", error);
          send({
            type: "error",
            message:
              error instanceof AIProviderUnavailableError
                ? "The interviewer is unavailable right now. Try again in a moment."
                : "Something went wrong on that turn.",
            retryable: true,
          });
        }
      }

      if (answer.trim()) {
        try {
          await appendTranscript({
            sessionId: input.sessionId,
            userId: user.id,
            role: "ASSISTANT",
            content: answer,
          });
          // Only advance once the interviewer has actually spoken. A
          // failed turn must not silently move the interview on.
          await setStage({
            sessionId: input.sessionId,
            userId: user.id,
            stage: resolvedStage,
          });
        } catch (error) {
          console.error("[interview] failed to persist turn", error);
        }
      }

      send({
        type: "done",
        stage: answer.trim() ? resolvedStage : context.stage,
        ended: answer.trim() ? resolvedStage === "ENDED" : false,
      });

      await recordAIUsage({
        userId: user.id,
        provider: provider.name,
        model: provider.defaultModel,
        feature: "interview",
        usage,
        latencyMs: Date.now() - startedAt,
        success: ok,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
