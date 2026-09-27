import { afterEach, describe, expect, it, vi } from "vitest";

import { getAIProvider, listAvailableProviders } from "./index";
import { MockProvider } from "./mock";
import { AIProviderUnavailableError } from "./types";

/**
 * Provider selection and the shape of the contract.
 *
 * The tutor never names a vendor; it asks the registry for "the configured
 * provider" and streams from whatever comes back. These tests pin that
 * indirection — that every registered adapter really implements the same
 * interface, that an unknown name fails loudly rather than falling back,
 * and that the test double cannot escape into production.
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("registry", () => {
  it("returns the adapter named, not the configured one", () => {
    expect(getAIProvider("ollama").name).toBe("ollama");
    expect(getAIProvider("anthropic").name).toBe("anthropic");
  });

  it("caches, so a provider is not rebuilt per request", () => {
    expect(getAIProvider("ollama")).toBe(getAIProvider("ollama"));
  });

  it("throws on an unknown provider rather than silently substituting one", () => {
    // Quietly answering with a different model than the operator chose is
    // worse than an error, because nobody finds out until the answers are.
    expect(() => getAIProvider("gpt-9")).toThrow(/Unknown AI provider/);
  });

  it("every registered adapter satisfies the streaming contract", async () => {
    const providers = await listAvailableProviders();
    expect(providers.length).toBeGreaterThanOrEqual(2);

    for (const { name } of providers) {
      const provider = getAIProvider(name);
      expect(typeof provider.generate).toBe("function");
      expect(typeof provider.stream).toBe("function");
      expect(typeof provider.isAvailable).toBe("function");
      expect(provider.defaultModel).toBeTruthy();
    }
  });

  it("reports both real providers regardless of which is configured", async () => {
    const names = (await listAvailableProviders()).map((p) => p.name);
    expect(names).toContain("ollama");
    expect(names).toContain("anthropic");
  });
});

describe("mock provider", () => {
  it("is registered outside production", () => {
    expect(getAIProvider("mock").name).toBe("mock");
  });

  it("refuses to construct in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => new MockProvider()).toThrow(AIProviderUnavailableError);
  });

  it("streams in several chunks so the UI's streaming path is exercised", async () => {
    const provider = new MockProvider();
    const chunks: string[] = [];
    let done = false;

    for await (const chunk of provider.stream({
      messages: [{ role: "user", content: "Learner's question (HINT):\nhelp" }],
    })) {
      if (chunk.type === "text") chunks.push(chunk.text);
      else done = true;
    }

    // A single chunk would pass even if the client waited for close.
    expect(chunks.length).toBeGreaterThan(1);
    expect(done).toBe(true);
    expect(chunks.join("")).toContain("Request type: HINT");
  });

  it("echoes the escalation rung so a test can assert the ladder moved", async () => {
    const provider = new MockProvider();
    const result = await provider.generate({
      messages: [
        { role: "system", content: "Escalation rung 3 of 4 (structural)." },
        { role: "user", content: "Learner's question (HINT):\nhelp" },
      ],
    });
    expect(result.text).toContain("Hint 3 of 4");
  });

  it("echoes the context it received", async () => {
    const provider = new MockProvider();
    const result = await provider.generate({
      messages: [
        {
          role: "user",
          content:
            "Problem #3: Longest Substring\nTests passed: 8/12\n" +
            "Learner's question (DEBUG_CODE):\nwhy does it fail",
        },
      ],
    });
    expect(result.text).toContain("Tests passed: 8/12");
    expect(result.text).toContain("Problem #3: Longest Substring");
  });

  it("honours an abort signal mid-stream", async () => {
    const provider = new MockProvider();
    const controller = new AbortController();

    const iterate = async () => {
      for await (const chunk of provider.stream({
        messages: [{ role: "user", content: "x".repeat(400) }],
        signal: controller.signal,
      })) {
        if (chunk.type === "text") controller.abort();
      }
    };

    // Cancellation must actually stop the provider, not merely hide output.
    await expect(iterate()).rejects.toThrow();
  });
});

describe("provider failures", () => {
  // `getEnv()` caches on first read and the registry caches instances, so
  // these stub the transport rather than the environment. That also keeps
  // the assertions independent of whether a local Ollama happens to be
  // running on the machine executing them.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports an unreachable Ollama as unavailable rather than throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    );

    // A health check that throws would take down any page rendering a
    // provider picker.
    await expect(getAIProvider("ollama").isAvailable()).resolves.toBe(false);
  });

  it("raises a typed error when a provider answers with an HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("upstream exploded", { status: 503 })
      )
    );

    await expect(
      getAIProvider("ollama").generate({
        messages: [{ role: "user", content: "hi" }],
      })
    ).rejects.toBeInstanceOf(AIProviderUnavailableError);
  });

  it("raises a typed error rather than leaking the upstream body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("x-api-key was rejected", { status: 401 })
      )
    );

    // Anthropic throws on a missing key before it ever reaches fetch, and
    // on a rejected key after; both must surface as the same typed error
    // so the route handler can render one safe sentence.
    await expect(
      getAIProvider("anthropic").generate({
        messages: [{ role: "user", content: "hi" }],
      })
    ).rejects.toBeInstanceOf(AIProviderUnavailableError);
  });
});
