/**
 * The AI provider contract.
 *
 * Phase 2 builds the abstraction and nothing else — the tutor, the mock
 * interviewer and the rest are later phases. What matters now is that the
 * application never talks to a vendor SDK directly, so switching providers
 * later is one adapter rather than a grep.
 *
 * The database models (AIConversation, AIMessage, AIUsageRecord) already
 * exist, so usage has somewhere to go from the first call rather than
 * needing a backfill once billing matters.
 */

export type AIRole = "system" | "user" | "assistant";

export type AIMessage = {
  role: AIRole;
  content: string;
};

export type GenerateOptions = {
  messages: AIMessage[];
  /** Overrides the provider's configured default. */
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  /** Aborts an in-flight request when the client disconnects. */
  signal?: AbortSignal;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
};

export type GenerateResult = {
  text: string;
  usage: TokenUsage;
  model: string;
  /** Why generation stopped: useful for detecting a truncated answer. */
  finishReason: "stop" | "length" | "content_filter" | "error" | "unknown";
};

/** One chunk of a streamed response. */
export type StreamChunk =
  | { type: "text"; text: string }
  | { type: "done"; usage: TokenUsage; finishReason: GenerateResult["finishReason"] };

export interface AIProvider {
  /** Stable identifier, recorded against every usage row. */
  readonly name: string;
  /** Default model, used when a call does not specify one. */
  readonly defaultModel: string;
  /** Whether the provider is configured and reachable. */
  isAvailable(): Promise<boolean>;
  /** A single completion. */
  generate(options: GenerateOptions): Promise<GenerateResult>;
  /** The same, streamed. Every provider must support this — the tutor
   *  is unusable if answers arrive all at once after ten seconds. */
  stream(options: GenerateOptions): AsyncIterable<StreamChunk>;
}

/** Raised when a provider is selected but not usable. */
export class AIProviderUnavailableError extends Error {
  constructor(provider: string, reason: string) {
    super(`AI provider "${provider}" is unavailable: ${reason}`);
    this.name = "AIProviderUnavailableError";
  }
}
