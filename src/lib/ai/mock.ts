import "server-only";

import type {
  AIProvider,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
} from "./types";
import { AIProviderUnavailableError } from "./types";

/**
 * A deterministic provider, for tests.
 *
 * The end-to-end suite has to prove that the tutor streams, that it
 * escalates hints one rung at a time, and that it received the learner's
 * failing test — none of which can be asserted against a real model, whose
 * whole job is to answer differently every time. Mocking at the provider
 * boundary rather than at `fetch` means the assertions still travel through
 * the real route handler, the real authorization, the real rate limiter,
 * the real context builder and the real persistence path. Only the token
 * source is fake.
 *
 * It is also why CI needs no API key and no Ollama.
 *
 * SAFETY: this provider refuses to instantiate in production. A misdirected
 * `AI_PROVIDER=mock` on a real deployment fails loudly at the first call
 * rather than silently serving canned text to paying users.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock";
  readonly defaultModel = "mock-tutor-v1";

  constructor() {
    if (process.env.NODE_ENV === "production") {
      throw new AIProviderUnavailableError(
        this.name,
        "the mock provider cannot be used in production"
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    return process.env.NODE_ENV !== "production";
  }

  /**
   * Echoes back enough of the prompt for a test to assert on what the
   * context builder actually sent, then answers in the tutor's voice.
   *
   * The echo is bounded and appears only under a heading, so a test can
   * look for "Tests passed: 8/12" without the response becoming an
   * unreadable dump of the whole prompt.
   */
  private compose(options: GenerateOptions): string {
    const system = options.messages.find((m) => m.role === "system")?.content ?? "";
    const last = [...options.messages].reverse().find((m) => m.role === "user");
    const prompt = last?.content ?? "";

    const rung = /Escalation rung (\d) of (\d)/.exec(system);
    const requestType = /Learner's question \(([A-Z_]+)\):/.exec(prompt)?.[1] ?? "GENERAL_QUESTION";

    const lines: string[] = [];

    if (rung) {
      lines.push(
        `Hint ${rung[1]} of ${rung[2]}. What condition must always hold for the ` +
          `values you are currently tracking?`
      );
    } else {
      lines.push(
        `Let's work through this together. What do you already know has to be ` +
          `true here?`
      );
    }

    lines.push("", `Request type: ${requestType}`);

    // A compact, assertable record of the context that arrived.
    const facts = [
      /Problem #\d+: .+/.exec(prompt)?.[0],
      /Chapter: .+/.exec(prompt)?.[0],
      /Patterns: .+/.exec(prompt)?.[0],
      /Language: [A-Za-z+#]+/.exec(prompt)?.[0],
      /Tests passed: \d+\/\d+/.exec(prompt)?.[0],
      /Status: [A-Z_]+/.exec(prompt)?.[0],
      /Authored hints opened: \d+ of \d+/.exec(prompt)?.[0],
    ].filter(Boolean) as string[];

    if (facts.length) {
      lines.push("", "Context received:", ...facts.map((f) => `- ${f}`));
    }

    lines.push("", "```python", "# your turn", "```");

    return lines.join("\n");
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const text = this.compose(options);
    return {
      text,
      usage: { promptTokens: 100, completionTokens: text.length },
      model: options.model ?? this.defaultModel,
      finishReason: "stop",
    };
  }

  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const text = this.compose(options);

    // Emitted in several chunks so the UI's streaming path is genuinely
    // exercised: a single chunk would pass even if the client waited for
    // the stream to close before rendering anything.
    const parts = text.match(/[\s\S]{1,40}/g) ?? [text];

    for (const part of parts) {
      options.signal?.throwIfAborted();
      yield { type: "text", text: part };
      // A real gap, so a test can observe a partial response mid-flight.
      await new Promise((resolve) => setTimeout(resolve, 8));
    }

    yield {
      type: "done",
      usage: { promptTokens: 100, completionTokens: text.length },
      finishReason: "stop",
    };
  }
}
