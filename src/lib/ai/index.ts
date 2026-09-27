import "server-only";

import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { AnthropicProvider } from "./anthropic";
import { MockProvider } from "./mock";
import { OllamaProvider } from "./ollama";
import type { AIProvider, TokenUsage } from "./types";

export * from "./types";

/**
 * Provider registry.
 *
 * Both real adapters are registered; which one runs is a per-deployment
 * setting and, later, a per-user preference. Nothing above this layer names
 * a vendor.
 *
 * `mock` is the deterministic test double. It is registered only outside
 * production, and `MockProvider` refuses to construct there as well — two
 * independent guards, because canned text served to a paying learner would
 * be indistinguishable from a working product until somebody read it.
 */
const PROVIDERS: Record<string, () => AIProvider> = {
  ollama: () => new OllamaProvider(),
  anthropic: () => new AnthropicProvider(),
  ...(process.env.NODE_ENV === "production"
    ? {}
    : { mock: () => new MockProvider() }),
};

export type ProviderName = keyof typeof PROVIDERS;

const cache = new Map<string, AIProvider>();

/**
 * Returns the configured provider, or a named one.
 *
 * Deliberately does not fall back to a different provider when the
 * configured one is unavailable: silently answering with a weaker model
 * than the operator chose is worse than a clear error, because nobody finds
 * out until the answers are bad.
 */
export function getAIProvider(name?: string): AIProvider {
  const selected = name ?? getEnv().AI_PROVIDER;
  const factory = PROVIDERS[selected];

  if (!factory) {
    throw new Error(
      `Unknown AI provider "${selected}". Available: ${Object.keys(PROVIDERS).join(", ")}.`
    );
  }

  let provider = cache.get(selected);
  if (!provider) {
    provider = factory();
    cache.set(selected, provider);
  }
  return provider;
}

/** Which providers are actually usable right now. For a settings screen. */
export async function listAvailableProviders(): Promise<
  { name: string; available: boolean; model: string }[]
> {
  return Promise.all(
    Object.keys(PROVIDERS).map(async (name) => {
      const provider = getAIProvider(name);
      return {
        name,
        available: await provider.isAvailable(),
        model: provider.defaultModel,
      };
    })
  );
}

/**
 * Records a call against the usage ledger.
 *
 * Written from the first call rather than added when billing arrives, so
 * there is real history to meter against instead of a backfill. Costs are
 * stored as integer tenth-of-cents; floats accumulate error across millions
 * of rows.
 */
export async function recordAIUsage(params: {
  userId: string;
  provider: string;
  model: string;
  /** Which product surface made the call: "tutor", "interview", "quiz-gen". */
  feature: string;
  usage: TokenUsage;
  latencyMs: number;
  success: boolean;
  costMilliCents?: number;
}): Promise<void> {
  try {
    await prisma.aIUsageRecord.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        model: params.model,
        feature: params.feature,
        promptTokens: params.usage.promptTokens,
        completionTokens: params.usage.completionTokens,
        costMilliCents: params.costMilliCents ?? 0,
        latencyMs: params.latencyMs,
        success: params.success,
      },
    });
  } catch (error) {
    // Metering must never break the feature it is metering.
    console.error("[ai] failed to record usage", error);
  }
}
