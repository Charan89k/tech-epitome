import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getAIProvider, recordAIUsage } from "@/lib/ai";
import { AIProviderUnavailableError } from "@/lib/ai/types";
import { canAccess, FEATURES } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { assembleMessages } from "@/lib/tutor/context";
import { buildSystemPrompt, resolveHintLevel } from "@/lib/tutor/policy";
import { TUTOR_REQUEST_TYPES, type TutorStreamEvent } from "@/lib/tutor/types";
import {
  appendMessage,
  loadContextBundle,
  loadHistory,
  resolveConversation,
} from "@/services/tutor";

/**
 * The tutor's streaming endpoint.
 *
 * A route handler rather than a Server Action, for one reason: Server
 * Actions resolve to a value, and a tutor that returns its whole answer at
 * once after eight seconds of nothing is a tutor nobody waits for. This
 * streams server-sent events so the first sentence lands in well under a
 * second.
 *
 * The order of operations is the security model, and it is deliberate:
 * authenticate, authorize, rate limit, and only then spend money. Nothing
 * below the rate limiter can be reached by an anonymous or free-tier
 * request, and the provider is not constructed until every gate has passed.
 */

export const runtime = "nodejs";
// The response is a live stream; caching it would be meaningless at best.
export const dynamic = "force-dynamic";

const anchorSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("CHAPTER"),
    courseSlug: z.string().min(1).max(160),
    sectionSlug: z.string().min(1).max(160),
    chapterSlug: z.string().min(1).max(160),
  }),
  z.object({ kind: z.literal("PROBLEM"), problemSlug: z.string().min(1).max(160) }),
  z.object({
    kind: z.literal("SYSTEM_DESIGN"),
    problemSlug: z.string().min(1).max(160),
  }),
  z.object({ kind: z.literal("GLOBAL") }),
]);

const requestSchema = z.object({
  conversationId: z.string().min(1).max(64).optional(),
  requestType: z.enum(TUTOR_REQUEST_TYPES),
  anchor: anchorSchema,
  // Bounded for the same reason a submission is: a question is a question,
  // not a corpus.
  message: z.string().max(4_000).optional(),
  code: z
    .object({
      language: z.string().min(1).max(32),
      code: z.string().max(60_000),
      lastRun: z
        .object({
          mode: z.enum(["run", "submit"]),
          status: z.string().max(64),
          passed: z.number().int().min(0).max(10_000),
          total: z.number().int().min(0).max(10_000),
          errorMessage: z.string().max(20_000).nullish(),
        })
        .optional(),
    })
    .optional(),
});

function sse(event: TutorStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** A refusal before the stream opens, where a real status code still helps. */
function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "Sign in to use the tutor.");

  if (!canAccess(user, FEATURES.AI_TUTOR)) {
    return fail(403, "The AI tutor is part of Pro.");
  }

  const limited = await rateLimit(`tutor:${user.id}`, RATE_LIMITS.AI_MESSAGE);
  if (!limited.success) {
    const seconds = Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000));
    return fail(
      429,
      `That is a lot of questions at once. Try again in ${seconds} second${seconds === 1 ? "" : "s"}.`
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "That request was not in the expected shape.");
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "That request was not in the expected shape.");
  }
  const input = parsed.data;

  if (input.requestType === "GENERAL_QUESTION" && !input.message?.trim()) {
    return fail(400, "Ask a question first.");
  }

  const bundle = await loadContextBundle(input.anchor, user.id);
  if (!bundle) return fail(404, "That page is not available.");

  const conversation = await resolveConversation({
    userId: user.id,
    conversationId: input.conversationId,
    anchor: input.anchor,
    bundle,
  });
  // Null means the id named a conversation this user does not own. Answered
  // identically to one that never existed: no row, no signal.
  if (!conversation) return fail(404, "That conversation is not available.");

  const utterance = input.message?.trim() || defaultUtterance(input.requestType);

  const hintLevel = resolveHintLevel({
    requestType: input.requestType,
    currentLevel: conversation.hintLevel,
    message: input.message,
  });

  const history = await loadHistory(conversation.id, user.id);

  const systemPrompt = buildSystemPrompt({
    requestType: input.requestType,
    hintLevel,
    revealedHints: bundle.kind === "PROBLEM" ? bundle.revealedHints : undefined,
    totalAuthoredHints:
      bundle.kind === "PROBLEM" ? bundle.totalAuthoredHints : undefined,
  });

  const messages = assembleMessages({
    systemPrompt,
    bundle,
    code: input.code,
    history,
    utterance,
    requestType: input.requestType,
  });

  // The learner's turn is persisted before the model is called, so a
  // provider failure leaves a thread that still reads correctly rather than
  // one where their question vanished.
  const userMessageId = await appendMessage({
    conversationId: conversation.id,
    role: "USER",
    content: utterance,
    requestType: input.requestType,
    hintLevel,
  });

  const provider = getAIProvider();
  const model = provider.defaultModel;
  const startedAt = Date.now();

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      let usage = { promptTokens: 0, completionTokens: 0 };
      let ok = true;

      const send = (event: TutorStreamEvent) => {
        controller.enqueue(encoder.encode(sse(event)));
      };

      send({
        type: "meta",
        conversationId: conversation.id,
        messageId: userMessageId,
        hintLevel,
      });

      try {
        for await (const chunk of provider.stream({
          messages,
          maxOutputTokens: 1_200,
          temperature: 0.6,
          // Aborts the upstream call when the learner closes the panel or
          // navigates away, so a cancelled answer stops costing money.
          signal: request.signal,
        })) {
          if (chunk.type === "text") {
            answer += chunk.text;
            send({ type: "text", text: chunk.text });
          } else {
            usage = chunk.usage;
          }
        }

        send({ type: "done", hintLevel });
      } catch (error) {
        ok = false;
        const aborted =
          request.signal.aborted ||
          (error instanceof Error && error.name === "AbortError");

        if (!aborted) {
          // The provider's own message can carry a URL, a status body or a
          // key fragment. It goes to the server log; the learner gets a
          // sentence they can act on.
          console.error("[tutor] provider stream failed", error);
          send({
            type: "error",
            message:
              error instanceof AIProviderUnavailableError
                ? "The tutor is unavailable right now. Try again in a moment."
                : "Something went wrong generating that answer.",
            retryable: true,
          });
        }
      }

      // A partial answer is still worth keeping: the learner saw it, and a
      // reload that silently drops half a conversation is worse than a
      // short turn.
      if (answer.trim()) {
        try {
          await appendMessage({
            conversationId: conversation.id,
            role: "ASSISTANT",
            content: answer,
            requestType: input.requestType,
            hintLevel,
          });
        } catch (error) {
          console.error("[tutor] failed to persist answer", error);
        }
      }

      await recordAIUsage({
        userId: user.id,
        provider: provider.name,
        model,
        feature: "tutor",
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
      // Nginx and friends buffer by default, which would defeat the point.
      "x-accel-buffering": "no",
    },
  });
}

/** What a quick action says when the learner did not type anything. */
function defaultUtterance(requestType: (typeof TUTOR_REQUEST_TYPES)[number]): string {
  switch (requestType) {
    case "HINT":
      return "Give me a hint.";
    case "EXPLAIN_PROBLEM":
      return "Explain what this problem is asking.";
    case "EXPLAIN_CONCEPT":
      return "Explain this simply.";
    case "DEBUG_CODE":
      return "Why is my solution wrong?";
    case "ANALYZE_COMPLEXITY":
      return "Explain the time complexity.";
    case "COMPARE_APPROACHES":
      return "Is there another approach?";
    case "QUIZ_ME":
      return "Quiz me on this.";
    case "REVIEW_SOLUTION":
      return "Review my code.";
    case "REVIEW_ARCHITECTURE":
      return "Review the architecture I have drawn.";
    case "EXPLAIN_TRADEOFF":
      return "Explain the trade-off behind one of my choices.";
    case "CHECK_SCALABILITY":
      return "Where does my design break as traffic grows?";
    case "CHECK_FAILURE_MODES":
      return "What happens to my design when a component fails?";
    case "ASK_FOLLOWUP":
      return "Ask me a follow-up question about this design.";
    default:
      return "Help me with this.";
  }
}
