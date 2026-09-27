import { expect, test, type Page } from "@playwright/test";

import { closeDb } from "./db";
import { finishSignup } from "./helpers";

/**
 * Tech Epitome is free, proven rather than asserted.
 *
 * One ordinary account — nothing bought, no role, no flag — opens every
 * surface in the product and is never shown a price. The check is
 * deliberately blunt: it reads the whole rendered page and fails on any
 * word from the monetization vocabulary, so a paywall reintroduced
 * anywhere fails here even if nobody thinks to write a test for it.
 *
 * The one thing a learner can be asked for is an account. That is not a
 * price, and the copy that asks says so.
 */

const PASSWORD = "forge-e2e-password";

/**
 * Phrases that must never appear to a signed-in learner.
 *
 * Narrower than it first looks, and deliberately so. Bare "payment",
 * "billing" and "checkout" are *not* here: Tech Epitome teaches design, and
 * its own parking-garage exercise asks the learner to model a fee
 * policy. Failing on those would make this a thesaurus test that
 * eventually gets weakened or deleted — which is worse than a slightly
 * narrower one that stays trustworthy.
 *
 * "plan" is absent for the same reason: "a plan" is what `/prepare`
 * hands out.
 *
 * "pricing" came out for the same reason — the same exercise asks the
 * learner to put a pricing rule behind an interface. The thing "pricing"
 * was there to catch is a *link* to a paywall, and that is checked
 * structurally below, which is both stronger and immune to vocabulary.
 *
 * What is left is the vocabulary a paywall actually uses. A
 * reintroduced one says at least one of these.
 */
const FORBIDDEN = [
  "upgrade",
  "subscribe",
  "subscription",
  "premium",
  "paid plan",
  "free trial",
  "credit card",
  "per month",
  "/mo",
  // The specific commercial phrasings, since the bare nouns are allowed.
  "payment method",
  "billing details",
  "proceed to checkout",
];

/** Every surface an ordinary account is entitled to reach. */
const ROUTES = [
  "/dashboard",
  "/learn/dsa",
  "/learn/dsa/dsa-foundations",
  "/learn/dsa/dsa-foundations/complexity-analysis/why-complexity-matters",
  "/learn/system-design",
  "/learn/lld",
  "/patterns",
  "/patterns/sliding-window",
  "/problems",
  "/problems/running-altitude",
  "/visualize",
  "/visualize/binary-search",
  "/system-design",
  "/system-design/short-link-service",
  "/lld",
  "/lld/parking-garage",
  "/review",
  "/interviews",
  "/prepare",
  "/prepare/generalist-loop",
  "/ai-tutor",
  "/dashboard/notes",
  "/dashboard/bookmarks",
  "/dashboard/highlights",
  "/profile",
  "/settings",
  "/onboarding",
] as const;

function uniqueEmail(tag: string): string {
  return `e2e-free-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@techepitome.test`;
}

async function signUp(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Ordinary Learner");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);
  return email;
}

test.afterAll(async () => {
  await closeDb();
});

// ---------------------------------------------------------------------------

test("an ordinary account reaches every surface, and is never asked to pay", async ({
  page,
}) => {
  test.slow();
  await signUp(page, "all");

  for (const route of ROUTES) {
    const response = await page.goto(route);

    // Reachable: not a 402, not a 403, not a redirect to a sales page.
    expect(response?.status(), `${route} status`).toBeLessThan(400);
    expect(page.url(), `${route} redirected`).not.toMatch(/pricing|upgrade|billing/);

    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const word of FORBIDDEN) {
      expect(body, `"${word}" appears on ${route}`).not.toContain(word);
    }

    // Structural, and the part that actually matters: nothing anywhere
    // links to a paywall. Immune to the domain vocabulary a design
    // curriculum legitimately uses.
    const hrefs = await page.locator("a[href]").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href") ?? "")
    );
    for (const href of hrefs) {
      expect(href, `${route} links to ${href}`).not.toMatch(
        /pricing|billing|checkout|upgrade|subscribe|plans?$/i
      );
    }
  }
});

test("every interview type can be started by an ordinary account", async ({
  page,
}) => {
  test.slow();
  await signUp(page, "interviews");

  for (const type of [
    "Coding (DSA)",
    "Behavioural",
    "System design",
    "Low-level design",
  ]) {
    await page.goto("/interviews");
    await page.getByLabel("Interview type").click();
    await page.getByRole("option", { name: type }).click();
    await page.getByRole("button", { name: "Start interview" }).click();

    // A session opened, rather than a refusal or an offer.
    await page.waitForURL(/\/interviews\/[a-z0-9]+$/, { timeout: 30_000 });
    await expect(page.getByTestId("interview-room"), type).toBeVisible({
      timeout: 30_000,
    });
  }
});

test("the AI tutor opens for an ordinary account", async ({ page }) => {
  await signUp(page, "tutor");

  await page.goto("/ai-tutor");
  await expect(
    page.getByRole("heading", { name: "AI Tutor", exact: true })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Message the tutor")).toBeVisible();
});

test("the public site never advertises a price", async ({ page }) => {
  // Signed out, including the page that replaced /pricing.
  for (const route of ["/", "/features", "/login", "/signup"]) {
    await page.goto(route);
    const body = (await page.locator("body").innerText()).toLowerCase();

    for (const word of [
      "upgrade",
      "subscribe",
      "free trial",
      "checkout",
      "credit card",
      "per month",
      "/mo",
    ]) {
      expect(body, `"${word}" appears on ${route}`).not.toContain(word);
    }
  }

  // The features page says what the model is, in as many words.
  await page.goto("/features");
  const features = (await page.locator("body").innerText()).toLowerCase();
  expect(features).toContain("there is no price");
});

test("the old pricing URL redirects instead of 404ing", async ({ page }) => {
  const response = await page.goto("/pricing");
  expect(response?.status()).toBe(200);
  expect(page.url()).toMatch(/\/features$/);
});

test("no payment or billing endpoint exists", async ({ page }) => {
  await signUp(page, "endpoints");

  for (const path of [
    "/api/checkout",
    "/api/billing",
    "/api/stripe",
    "/api/webhooks/stripe",
    "/api/subscription",
  ]) {
    const response = await page.request.post(path, { failOnStatusCode: false });
    expect(response.status(), path).toBe(404);
  }
});
