import "server-only";

import { getEnv } from "@/lib/env";
import { ConsoleEmailProvider } from "./console";
import { ResendProvider } from "./resend";
import type { EmailProvider } from "./types";

export * from "./types";
export { ConsoleEmailProvider, RejectingEmailProvider } from "./console";
export { ResendProvider } from "./resend";

/**
 * Email provider registry.
 *
 * Mirrors `src/lib/ai/index.ts`: the application never names a vendor,
 * and the selection is a per-deployment setting.
 *
 * `console` is registered only outside production, and the provider
 * itself refuses to construct there — two independent guards, because a
 * deployment silently logging its mail instead of sending it looks
 * completely healthy from the inside.
 */
const PROVIDERS: Record<string, () => EmailProvider> = {
  resend: () => {
    const env = getEnv();
    return new ResendProvider(env.RESEND_API_KEY, env.EMAIL_FROM);
  },
  ...(process.env.NODE_ENV === "production"
    ? {}
    : { console: () => new ConsoleEmailProvider() }),
};

let override: EmailProvider | null = null;

/** Test seam. Installing a provider here bypasses the registry. */
export function setEmailProvider(provider: EmailProvider | null): void {
  override = provider;
}

const cache = new Map<string, EmailProvider>();

/**
 * The configured provider.
 *
 * Deliberately does not fall back to a different one when the configured
 * provider is unavailable: quietly switching to `console` in production
 * would turn every unsent notification into a log line nobody reads.
 * An unconfigured provider returns `skipped` from `send`, which the
 * caller records — the failure is visible either way.
 */
export function getEmailProvider(name?: string): EmailProvider {
  if (override) return override;

  const selected = name ?? getEnv().EMAIL_PROVIDER;
  const factory = PROVIDERS[selected];

  if (!factory) {
    throw new Error(
      `Unknown email provider "${selected}". Available: ${Object.keys(
        PROVIDERS
      ).join(", ")}.`
    );
  }

  let provider = cache.get(selected);
  if (!provider) {
    provider = factory();
    cache.set(selected, provider);
  }
  return provider;
}

/** Clears the cached provider. Only for tests that change the environment. */
export function resetEmailProviderForTests(): void {
  cache.clear();
  override = null;
}

/**
 * Whether this deployment can send mail at all.
 *
 * Read by the settings page, so a learner is told the truth about what
 * their email preference will actually do rather than being offered a
 * toggle for a channel that does not exist here.
 */
export function emailIsConfigured(): boolean {
  try {
    return getEmailProvider().isConfigured();
  } catch {
    return false;
  }
}
