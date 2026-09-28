import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The real Auth.js configuration, not a stand-in.
 *
 * `authConfig` reads `process.env` at module load to decide which providers
 * exist, so every case here sets the environment and then imports the module
 * fresh. `vi.resetModules()` is what makes that honest: without it the first
 * import wins and every later case silently asserts against it.
 *
 * This file deliberately exercises the edge-safe half (`config.ts`). The full
 * configuration in `index.ts` pulls in Prisma and the argon2 native addon,
 * neither of which loads under jsdom, and neither of which this file is
 * about.
 */

const OAUTH_ENV = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
] as const;

/** Loads a fresh `authConfig` with exactly the given OAuth variables set. */
async function loadConfig(vars: Partial<Record<(typeof OAUTH_ENV)[number], string>>) {
  vi.resetModules();
  for (const key of OAUTH_ENV) vi.stubEnv(key, vars[key] ?? "");
  const { authConfig } = await import("./config");
  return authConfig;
}

/**
 * Provider entries are already-resolved objects in this config (nothing here
 * registers a lazily-invoked provider), so the id is read straight off them.
 */
type ResolvedProvider = {
  id: string;
  options?: { allowDangerousEmailAccountLinking?: boolean };
};

const resolve = (config: Awaited<ReturnType<typeof loadConfig>>) =>
  config.providers as unknown as ResolvedProvider[];

const providerIds = (config: Awaited<ReturnType<typeof loadConfig>>) =>
  resolve(config).map((p) => p.id);

/**
 * Marker strings, not credentials.
 *
 * These only ever reach `process.env` inside this vitest process so the
 * conditional registration in `config.ts` has something non-empty to read.
 * Nothing here is sent anywhere: this file builds a config object and
 * inspects it, and no test in it opens a socket. Testing "registers Google
 * only when both values are present" is impossible without *some* value, and
 * the assertion under test is about the branch, not the string.
 *
 * The end-to-end suite is the opposite case and is handled the opposite way:
 * there a value would have to be a working credential to mean anything, so
 * `e2e/oauth.spec.ts` supplies none and skips instead.
 */
const BOTH = {
  AUTH_GOOGLE_ID: "not-a-credential-google-id",
  AUTH_GOOGLE_SECRET: "not-a-credential-google-secret",
  AUTH_GITHUB_ID: "not-a-credential-github-id",
  AUTH_GITHUB_SECRET: "not-a-credential-github-secret",
};

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "a".repeat(32));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("OAuth provider registration", () => {
  it("registers no OAuth provider when nothing is configured", async () => {
    expect(providerIds(await loadConfig({}))).toEqual([]);
  });

  it("registers Google only when both Google values are present", async () => {
    expect(
      providerIds(
        await loadConfig({
          AUTH_GOOGLE_ID: BOTH.AUTH_GOOGLE_ID,
          AUTH_GOOGLE_SECRET: BOTH.AUTH_GOOGLE_SECRET,
        })
      )
    ).toEqual(["google"]);
  });

  it("registers GitHub only when both GitHub values are present", async () => {
    expect(
      providerIds(
        await loadConfig({
          AUTH_GITHUB_ID: BOTH.AUTH_GITHUB_ID,
          AUTH_GITHUB_SECRET: BOTH.AUTH_GITHUB_SECRET,
        })
      )
    ).toEqual(["github"]);
  });

  it("registers both when both are configured", async () => {
    expect(providerIds(await loadConfig(BOTH))).toEqual(["google", "github"]);
  });

  it("does not register a provider with an id but no secret", async () => {
    // A half-configured provider is the dangerous case: the button would
    // render and every click would dead-end at the provider.
    expect(
      providerIds(await loadConfig({ AUTH_GITHUB_ID: BOTH.AUTH_GITHUB_ID }))
    ).toEqual([]);
    expect(
      providerIds(await loadConfig({ AUTH_GOOGLE_SECRET: BOTH.AUTH_GOOGLE_SECRET }))
    ).toEqual([]);
  });

  it("the providers are independent of each other", async () => {
    // GitHub configured while Google is not must not disable GitHub.
    const ids = providerIds(
      await loadConfig({
        AUTH_GITHUB_ID: BOTH.AUTH_GITHUB_ID,
        AUTH_GITHUB_SECRET: BOTH.AUTH_GITHUB_SECRET,
        AUTH_GOOGLE_ID: BOTH.AUTH_GOOGLE_ID,
      })
    );
    expect(ids).toEqual(["github"]);
  });
});

describe("account linking policy", () => {
  it("never links an OAuth identity to an existing account by email alone", async () => {
    // This is the whole of the account-takeover defence. A provider email is
    // an address the provider vouches for, not one the person proved to us,
    // so matching it against an existing account is not proof of ownership.
    const config = await loadConfig(BOTH);
    expect(config.providers).toHaveLength(2);

    for (const provider of resolve(config)) {
      // Auth.js keeps the caller's overrides on `options` and merges them
      // into the provider at init; the top-level property is undefined even
      // when the option was passed, so asserting there would pass whatever
      // the value actually was.
      expect(
        provider.options?.allowDangerousEmailAccountLinking,
        `${provider.id} must not auto-link on email`
      ).toBe(false);
    }
  });
});

describe("signIn callback", () => {
  const signIn = async () => (await loadConfig(BOTH)).callbacks.signIn;

  it("refuses an OAuth sign-in that carries no email", async () => {
    // User.email is non-null and unique; without this the adapter throws a
    // Prisma constraint error and the learner sees a 500.
    const callback = await signIn();
    expect(
      await callback({
        user: { id: "u1", email: null },
        account: { provider: "github", type: "oauth", providerAccountId: "1" },
      } as never)
    ).toBe(false);
  });

  it("refuses an OIDC sign-in that carries no email", async () => {
    const callback = await signIn();
    expect(
      await callback({
        user: { id: "u1", email: undefined },
        account: { provider: "google", type: "oidc", providerAccountId: "1" },
      } as never)
    ).toBe(false);
  });

  it("allows an OAuth sign-in that carries an email", async () => {
    const callback = await signIn();
    expect(
      await callback({
        user: { id: "u1", email: "learner@example.com" },
        account: { provider: "github", type: "oauth", providerAccountId: "1" },
      } as never)
    ).toBe(true);
  });

  it("leaves credentials sign-in alone", async () => {
    // Credentials has already proved the address; the guard is for providers.
    const callback = await signIn();
    expect(
      await callback({
        user: { id: "u1", email: "learner@example.com" },
        account: { provider: "credentials", type: "credentials" },
      } as never)
    ).toBe(true);
  });
});

describe("session strategy", () => {
  it("issues JWT sessions, which is what makes credentials and OAuth agree", async () => {
    const config = await loadConfig(BOTH);
    expect(config.session.strategy).toBe("jwt");
  });

  it("sends sign-in errors back to the login page rather than an Auth.js page", async () => {
    const config = await loadConfig(BOTH);
    expect(config.pages.signIn).toBe("/login");
    expect(config.pages.error).toBe("/login");
  });
});
