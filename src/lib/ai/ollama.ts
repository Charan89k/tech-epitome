import "server-only";

import { getEnv } from "@/lib/env";
import type {
  AIProvider,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
} from "./types";
import { AIProviderUnavailableError } from "./types";

/**
 * Ollama, for a locally hosted model.
 *
 * Exists so the AI features are developable and testable without an API key
 * or a per-token cost. Quality is lower than a frontier model, which is
 * exactly why the provider is swappable rather than assumed.
 */
export class OllamaProvider implements AIProvider {
  readonly name = "ollama";

  get defaultModel(): string {
    return getEnv().OLLAMA_MODEL;
  }

  private get baseUrl(): string {
    return getEnv().OLLAMA_BASE_URL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: options.model ?? this.defaultModel,
        messages: options.messages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxOutputTokens ?? 1024,
        },
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new AIProviderUnavailableError(
        this.name,
        `HTTP ${response.status} from ${this.baseUrl}`
      );
    }

    const payload = (await response.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
      done_reason?: string;
    };

    return {
      text: payload.message?.content ?? "",
      usage: {
        promptTokens: payload.prompt_eval_count ?? 0,
        completionTokens: payload.eval_count ?? 0,
      },
      model: options.model ?? this.defaultModel,
      finishReason: payload.done_reason === "length" ? "length" : "stop",
    };
  }

  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: options.model ?? this.defaultModel,
        messages: options.messages,
        stream: true,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxOutputTokens ?? 1024,
        },
      }),
      signal: options.signal,
    });

    if (!response.ok || !response.body) {
      throw new AIProviderUnavailableError(
        this.name,
        `HTTP ${response.status} from ${this.baseUrl}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let promptTokens = 0;
    let completionTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Ollama streams newline-delimited JSON; a chunk can split a line.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line) as {
            message?: { content?: string };
            done?: boolean;
            prompt_eval_count?: number;
            eval_count?: number;
          };

          if (event.message?.content) {
            yield { type: "text", text: event.message.content };
          }
          if (event.done) {
            promptTokens = event.prompt_eval_count ?? promptTokens;
            completionTokens = event.eval_count ?? completionTokens;
          }
        } catch {
          // A malformed line is not worth aborting the stream over.
        }
      }
    }

    yield {
      type: "done",
      usage: { promptTokens, completionTokens },
      finishReason: "stop",
    };
  }
}
