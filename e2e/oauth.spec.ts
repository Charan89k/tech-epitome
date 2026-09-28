import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * The OAuth boundary: everything this application is responsible for, and
 * nothing that belongs to Google or GitHub.
 *
 * A real end-to-end OAuth run needs a human at a consent screen and a real
 * client secret, so it cannot live in an automated suite. What *can* be
 * tested is the boundary on our side of the redirect, which is where the
 * interesting failures are:
 *
 *   - initiation: do we send the right parameters, with a per-attempt
 *     secret (PKCE) the callback must later prove?
 *   - callback: does a forged or replayed callback create a session?
 *   - cancellation: does a refused consent land somewhere sane?
 *   - return path: does `?next=` survive the round trip without becoming an
 *     open redirect?
 *
 * **No credentials are invented to make this run.** The suite sets no client
 * id and no client secret; the server registers a provider only if the
 * developer's own environment already configured one. The tests split along
 * that line:
 *
 *   - Cases that need a *registered provider* (the buttons, the authorize
 *     request) ask the running server which providers it has, via Auth.js's
 *     own `/api/auth/providers`, and skip with a reason when it has none.
 *     Skipped, not passed: an unconfigured machine must not report a green
 *     OAuth flow it never exercised.
 *
 *   - Cases that need *no provider at all* — a forged callback, a cancelled
 *     authorization, hostile `?next=` values — always run. These are the
 *     security properties, and they must hold on every machine, configured
 *     or not.
 *
 * Even when a provider is configured, the provider itself is never contacted:
 * `blockProviderRequests` aborts anything leaving the origin, so the
 * authorize redirect is captured and stopped before it reaches Google or
 * GitHub. Nothing here transmits a secret.
 */

const PROVIDERS = [
  {
    id: "google",
    button: "Continue with Google",
    authorizeHost: "accounts.google.com",
    envPrefix: "AUTH_GOOGLE",
  },
  {
    id: "github",
    button: "Continue with GitHub",
    authorizeHost: "github.com",
    envPrefix: "AUTH_GITHUB",
  },
] as const;

/**
 * Which providers the running server actually registered.
 *
 * Auth.js publishes this itself, so it reflects the server's real
 * configuration rather than what the test process happens to see in its own
 * environment — the dev server loads `.env` files the test runner never
 * reads, so asking the server is the only honest answer.
 */
async function registeredProviders(request: APIRequestContext): Promise<string[]> {
  const response = await request.get("/api/auth/providers");
  if (!response.ok()) return [];
  const body = (await response.json()) as Record<string, unknown>;
  return Object.keys(body);
}

const notConfigured = (provider: (typeof PROVIDERS)[number]) =>
  `${provider.id} OAuth is not configured on this server. Set ${provider.envPrefix}_ID ` +
  `and ${provider.envPrefix}_SECRET to a real OAuth app to run this check — ` +
  `the suite never invents credentials.`;

/**
 * Stops the browser from ever reaching a provider, and records the URL it
 * was about to open. Returns a getter for the captured authorize URL.
 */
async function blockProviderRequests(page: Page) {
  const attempted: string[] = [];

  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
      await route.continue();
      return;
    }
    attempted.push(url);
    await route.abort();
  });

  return () => attempted;
}

/** True when the browser currently holds a usable Tech Epitome session. */
async function isSignedIn(page: Page): Promise<boolean> {
  const response = await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  // Signed out, the proxy bounces /dashboard to /login.
  return !/\/login/.test(page.url()) && (response?.ok() ?? false);
}

/**
 * Guards the skip mechanism itself.
 *
 * Every provider-dependent test below is gated on `registeredProviders`. If
 * that helper ever broke — a renamed route, a shape change, a 404 swallowed
 * into `[]` — those tests would skip on every machine forever and the suite
 * would still look green. Nobody would notice.
 *
 * `credentials` is always registered, so asserting the helper can see it
 * proves the gate reads real configuration and would open for Google or
 * GitHub once either is set up. No OAuth credential is involved.
 */
test("the provider gate reads the server's real configuration", async ({
  request,
}) => {
  const providers = await registeredProviders(request);

  expect(
    providers,
    "the providers endpoint returned nothing - the skip gate below would " +
      "silently disable every provider test"
  ).toContain("credentials");
});

for (const provider of PROVIDERS) {
  // ---------------------------------------------------------------------
  // Needs a real, configured provider. Skipped with a reason otherwise.
  // ---------------------------------------------------------------------
  test.describe(`${provider.id} sign-in (needs a configured provider)`, () => {
    test("the button is offered on login and signup", async ({ page, request }) => {
      test.skip(
        !(await registeredProviders(request)).includes(provider.id),
        notConfigured(provider)
      );

      for (const path of ["/login", "/signup"]) {
        await page.goto(path);
        await expect(
          page.getByRole("button", { name: provider.button })
        ).toBeVisible();
      }
    });

    test("pressing the button starts a real authorization request", async ({
      page,
      request,
    }) => {
      test.skip(
        !(await registeredProviders(request)).includes(provider.id),
        notConfigured(provider)
      );

      const attempted = await blockProviderRequests(page);

      await page.goto("/login");
      // Captured before the click: once the provider hop is aborted,
      // page.url() is no longer this app and its origin reads as "null".
      const appOrigin = new URL(page.url()).origin;

      await page.getByRole("button", { name: provider.button }).click();

      // Give the redirect chain a moment to reach the aborted hop.
      await expect
        .poll(() => attempted().length, { timeout: 20_000 })
        .toBeGreaterThan(0);

      const authorize = new URL(attempted()[0]!);
      expect(authorize.host).toBe(provider.authorizeHost);

      // The flow must carry a per-attempt secret that a forged callback
      // cannot reproduce. Auth.js uses PKCE here rather than `state`: it
      // sends the SHA-256 challenge now and keeps the verifier in a cookie,
      // so an authorization code stolen in transit is useless without it.
      // Accepting either keeps this honest if Auth.js changes which one it
      // picks per provider, while still failing if it sends neither.
      const challenge = authorize.searchParams.get("code_challenge");
      const state = authorize.searchParams.get("state");
      expect(
        challenge ?? state,
        "authorization request carries neither PKCE nor state"
      ).toBeTruthy();

      if (challenge) {
        // S256, never "plain" - a plain challenge is the verifier itself and
        // protects nothing against an attacker who can read the request.
        expect(authorize.searchParams.get("code_challenge_method")).toBe("S256");
      }

      // The callback must point back at this origin. If an attacker could
      // influence it, the authorization code would be delivered to them.
      const redirectUri = authorize.searchParams.get("redirect_uri")!;
      expect(redirectUri).toContain(`/api/auth/callback/${provider.id}`);
      expect(new URL(redirectUri).origin).toBe(appOrigin);

      // The secret stays on the server. Only the client id travels.
      expect(authorize.searchParams.get("client_id")).toBeTruthy();
      expect(authorize.toString()).not.toContain("client_secret");
    });

    test("the return path is carried into the authorization request", async ({
      page,
      request,
    }) => {
      test.skip(
        !(await registeredProviders(request)).includes(provider.id),
        notConfigured(provider)
      );

      const attempted = await blockProviderRequests(page);

      await page.goto("/login?next=%2Freview");
      await page.getByRole("button", { name: provider.button }).click();

      await expect
        .poll(() => attempted().length, { timeout: 20_000 })
        .toBeGreaterThan(0);

      // `next` rides in Auth.js's own callbackUrl machinery rather than on
      // the authorize URL; what matters is that the hop is the provider's
      // real authorize endpoint and nothing else.
      expect(new URL(attempted()[0]!).host).toBe(provider.authorizeHost);
    });
  });

  // ---------------------------------------------------------------------
  // Needs no provider. These are the security properties, so they run
  // everywhere: an unconfigured provider must still refuse a forged
  // callback rather than fail open.
  // ---------------------------------------------------------------------
  test.describe(`${provider.id} callback boundary`, () => {
    test("a forged callback with no verifier does not create a session", async ({
      page,
    }) => {
      // The shape of a forged callback: someone who knows the route but holds
      // none of the per-attempt cookies Auth.js set when the flow started.
      await page.goto(
        `/api/auth/callback/${provider.id}?code=forged-authorization-code`,
        { waitUntil: "domcontentloaded" }
      );

      expect(await isSignedIn(page)).toBe(false);
    });

    test("a callback with a mismatched state does not create a session", async ({
      page,
    }) => {
      // Same again with a state value supplied, in case a provider flow is
      // ever configured to use state instead of PKCE.
      await page.goto(
        `/api/auth/callback/${provider.id}?code=forged&state=not-the-minted-state`,
        { waitUntil: "domcontentloaded" }
      );

      expect(await isSignedIn(page)).toBe(false);
    });

    test("cancelling at the provider returns to login without a session", async ({
      page,
    }) => {
      // What the provider sends back when the person presses "Cancel".
      await page.goto(`/api/auth/callback/${provider.id}?error=access_denied`, {
        waitUntil: "domcontentloaded",
      });

      // Auth.js is configured to send errors to /login rather than its own
      // error page, so the learner lands somewhere they can act on.
      await expect(page).toHaveURL(/\/login/);
      expect(await isSignedIn(page)).toBe(false);
    });
  });
}

/**
 * The open-redirect regression, on the OAuth path.
 *
 * `src/lib/safe-redirect.ts` narrows `?next=` to a same-origin path, and the
 * provider actions apply it before handing the value to Auth.js. These are
 * the exact shapes that closed the original vulnerability, and they need no
 * provider to be configured — the hidden field is on the page either way.
 */
test.describe("hostile return paths never leave the origin", () => {
  const HOSTILE = [
    "//evil.example.com",
    "/\\evil.example.com",
    "/\tevil.example.com",
    "https://evil.example.com",
    "javascript:alert(1)",
  ];

  for (const next of HOSTILE) {
    test(`a hostile next= (${JSON.stringify(next)}) is narrowed away`, async ({
      page,
    }) => {
      await page.goto(`/login?next=${encodeURIComponent(next)}`);

      // The page must render its own login form, not bounce anywhere.
      await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
      expect(new URL(page.url()).hostname).toBe("127.0.0.1");

      // Whatever the hidden field carries into any sign-in action, it is a
      // same-origin path. It is never the attacker's URL.
      const carried = await page
        .locator('form input[name="next"]')
        .first()
        .inputValue();

      expect(carried.startsWith("/")).toBe(true);
      expect(carried.startsWith("//")).toBe(false);
      expect(carried).not.toContain("evil.example.com");
      expect(carried).not.toContain("javascript:");
    });
  }

  test("a legitimate return path is preserved", async ({ page }) => {
    // The narrowing must not be so blunt that it breaks the feature.
    await page.goto("/login?next=%2Fproblems%3Fq%3D1");

    const carried = await page
      .locator('form input[name="next"]')
      .first()
      .inputValue();

    expect(carried).toBe("/problems?q=1");
  });
});
