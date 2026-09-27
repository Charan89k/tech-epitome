import "server-only";

import { getEnv } from "@/lib/env";
import type {
  AIProvider,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
} from "./types";
import { AIProviderUnavailableError } from "./types";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

/**
 * Anthropic, via the Messages API directly.
 *
 * Called over fetch rather than through the SDK: the surface used here is
 * two endpoints, and the SDK would add a dependency plus its own retry and
 * streaming behaviour to reason about. If that calculus changes, this is
 * the only file that has to.
 *
 * Anthropic takes the system prompt as a top-level field rather than a
 * message, so the conversation is split before it is sent.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  get defaultModel(): string {
    return getEnv().AI_MODEL;
  }

  private get apiKey(): string {
    const key = getEnv().AI_API_KEY;
    if (!key) {
      throw new AIProviderUnavailableError(this.name, "AI_API_KEY is not set");
    }
    return key;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(getEnv().AI_API_KEY);
  }

  private buildBody(options: GenerateOptions, stream: boolean) {
    const system = options.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");

    const messages = options.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content }));

    return {
      model: options.model ?? this.defaultModel,
      max_tokens: options.maxOutputTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      ...(system ? { system } : {}),
      messages,
      ...(stream ? { stream: true } : {}),
    };
  }

  private headers() {
    return {
      "content-type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": API_VERSION,
    };
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(options, false)),
      signal: options.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AIProviderUnavailableError(
        this.name,
        `HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`
      );
    }

    const payload = (await response.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
      stop_reason?: string;
      model?: string;
    };

    const text = (payload.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("");

    return {
      text,
      usage: {
        promptTokens: payload.usage?.input_tokens ?? 0,
        completionTokens: payload.usage?.output_tokens ?? 0,
      },
      model: payload.model ?? options.model ?? this.defaultModel,
      finishReason:
        payload.stop_reason === "max_tokens"
          ? "length"
          : payload.stop_reason === "end_turn" || payload.stop_reason === "stop_sequence"
            ? "stop"
            : "unknown",
    };
  }

  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(options, true)),
      signal: options.signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      throw new AIProviderUnavailableError(
        this.name,
        `HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let finishReason: GenerateResult["finishReason"] = "stop";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Server-sent events: records separated by a blank line.
      const records = buffer.split("\n\n");
      buffer = records.pop() ?? "";

      for (const record of records) {
        const dataLine = record
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (!dataLine) continue;

        try {
          const event = JSON.parse(dataLine.slice(5).trim()) as {
            type?: string;
            delta?: { text?: string; stop_reason?: string };
            message?: { usage?: { input_tokens?: number } };
            usage?: { output_tokens?: number };
          };

          if (event.type === "content_block_delta" && event.delta?.text) {
            yield { type: "text", text: event.delta.text };
          } else if (event.type === "message_start") {
            promptTokens = event.message?.usage?.input_tokens ?? 0;
          } else if (event.type === "message_delta") {
            completionTokens = event.usage?.output_tokens ?? completionTokens;
            if (event.delta?.stop_reason === "max_tokens") finishReason = "length";
          }
        } catch {
          // Ignore a partial or unrecognised event rather than failing the
          // whole stream over it.
        }
      }
    }

    yield {
      type: "done",
      usage: { promptTokens, completionTokens },
      finishReason,
    };
  }
}
