import { expect, test, type Page } from "@playwright/test";

import { closeDb } from "./db";
import { finishSignup } from "./helpers";

/**
 * Journey 3: System Design.
 *
 * Lesson → exercise → workspace → save → submit → reference → AI review.
 *
 * The assertion that matters most is the negative one: the reference
 * architecture must not be on the page before the learner submits. It is
 * withheld in the service rather than hidden with CSS, so "not visible" is
 * checked as "not in the DOM".
 */

const PASSWORD = "forge-e2e-password";

const LESSON_URL =
  "/learn/system-design/system-design-foundations/foundations/what-scale-actually-means";
const EXERCISE_URL = "/system-design/short-link-service";

function uniqueEmail(tag: string): string {
  return `e2e-sd-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@codeforge.test`;
}

async function signUp(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Designer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);
  return email;
}

/** The problem page collapses below `lg`; so does the workspace column. */
function isNarrow(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

test.afterAll(async () => {
  await closeDb();
});

// ---------------------------------------------------------------------------

test("the system design track is reachable and its lessons render", async ({
  page,
}) => {
  await page.goto("/learn/system-design");
  await expect(
    page.getByRole("heading", { level: 1, name: "System Design" })
  ).toBeVisible();

  await page.goto(LESSON_URL);
  await expect(
    page.getByRole("heading", { level: 1, name: "What Scale Actually Means" })
  ).toBeVisible();

  // The lesson embeds an architecture diagram as data, not an image.
  await expect(page.getByRole("img").first()).toBeVisible();
  await expect(
    page.getByText("Describe this diagram in words").first()
  ).toBeVisible();
});

test("a diagram is readable as text, not only as a picture", async ({ page }) => {
  await page.goto(LESSON_URL);

  const details = page.getByText("Describe this diagram in words").first();
  await details.click();

  // The same prose the AI reviewer receives and a screen reader announces.
  // Scoped to the paragraph: the SVG's own <desc> carries the same text and
  // is deliberately not rendered.
  const prose = page.locator("details p").filter({ hasText: /Components \(\d+\)/ });
  await expect(prose.first()).toBeVisible();
  await expect(prose.first()).toContainText("Load Balancer");
});

test("an exercise withholds its reference architecture until submission", async ({
  page,
}) => {
  await signUp(page, "withhold");
  await page.goto(EXERCISE_URL);

  await expect(
    page.getByRole("heading", { level: 1, name: "Short Link Service" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Functional requirements", exact: true })
  ).toBeVisible();

  // Not merely hidden — absent from the DOM entirely.
  await expect(
    page.getByRole("heading", { name: "One reference architecture" })
  ).toHaveCount(0);
  await expect(page.getByText("Trade-offs behind it")).toHaveCount(0);
});

test("full journey: draw, save, submit, reveal, review", async ({ page }) => {
  test.slow();
  await signUp(page, "journey");
  await page.reload();

  await page.goto(EXERCISE_URL);
  // Scoped to `main`: under parallel load the dev server leaves a hidden
  // prerender copy of the page in the DOM. See README "Known limitations".
  const workspace = page.getByRole("main").getByTestId("design-workspace");
  await expect(workspace).toBeVisible({ timeout: 30_000 });

  // --- draw ---------------------------------------------------------------
  await workspace.getByRole("button", { name: "Client" }).click();
  await workspace.getByRole("button", { name: "API Server" }).click();
  await workspace.getByRole("button", { name: "Database" }).click();

  // --- connect ------------------------------------------------------------
  // Connect mode starts from the selected node and completes on the next
  // node clicked in the diagram.
  await workspace.getByRole("button", { name: /Connect two components/ }).click();
  // The node inside the SVG, not the palette chip that created it.
  await workspace.locator('g[role="button"][aria-label="API Server"]').click();

  await expect(
    workspace.getByRole("heading", { name: "Connections" })
  ).toBeVisible({ timeout: 15_000 });

  // --- rationale ----------------------------------------------------------
  await workspace
    .getByLabel("Why this design?")
    .fill("Reads dominate writes, so a cache sits in front of the database.");

  // --- autosave -----------------------------------------------------------
  await expect(workspace.getByText("Draft saved")).toBeVisible({ timeout: 20_000 });

  // A reload proves it reached the database rather than local state.
  await page.reload();
  await expect(
    page.getByRole("main").getByTestId("design-workspace").getByText(/Reads dominate writes/)
  ).toBeVisible({ timeout: 20_000 });

  // --- submit -------------------------------------------------------------
  await page
    .getByRole("main")
    .getByTestId("design-workspace")
    .getByRole("button", { name: "Submit design" })
    .click();

  await expect(
    page.getByRole("heading", { name: "One reference architecture" })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Trade-offs behind it")).toBeVisible();

  // --- AI review ----------------------------------------------------------
  await page.getByTestId("tutor-open").click();
  await page
    .getByRole("button", { name: "Review my architecture" })
    .first()
    .click();

  const transcript = page.getByTestId("tutor-transcript");
  await expect(
    transcript.getByText(/Request type: REVIEW_ARCHITECTURE/)
  ).toBeVisible({ timeout: 30_000 });
});

test("an empty design cannot be submitted to reveal the answer", async ({
  page,
}) => {
  await signUp(page, "empty");
  await page.reload();

  await page.goto(EXERCISE_URL);
  // Scoped to `main`: under parallel load the dev server leaves a hidden
  // prerender copy of the page in the DOM. See README "Known limitations".
  const workspace = page.getByRole("main").getByTestId("design-workspace");
  await workspace.getByRole("button", { name: "Submit design" }).click();

  await expect(workspace.getByRole("alert")).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "One reference architecture" })
  ).toHaveCount(0);
});

test("a signed-out visitor is asked to sign in rather than shown a broken editor", async ({
  page,
}) => {
  await page.goto(EXERCISE_URL);
  await expect(page.getByText("Sign in to draw and save a design.")).toBeVisible();
  await expect(page.getByTestId("design-workspace")).toHaveCount(0);
});

test("the workspace works on a phone without overflowing", async ({ page }) => {
  test.skip(!isNarrow(page), "This assertion is about the mobile layout.");
  test.slow();

  await signUp(page, "mobile");

  await page.goto(EXERCISE_URL);
  // Scoped to `main`: under parallel load the dev server leaves a hidden
  // prerender copy of the page in the DOM. See README "Known limitations".
  const workspace = page.getByRole("main").getByTestId("design-workspace");
  // The page carries the whole brief plus the editor; under parallel load
  // the default five seconds is not always enough for it to settle.
  await expect(workspace).toBeVisible({ timeout: 30_000 });

  await workspace.getByRole("button", { name: "Client" }).click();
  await workspace.getByRole("button", { name: "API Server" }).click();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(2);
});

test("existing DSA routes still work after the track generalisation", async ({
  page,
}) => {
  // /learn/dsa/* URLs were preserved exactly when the route became
  // /learn/[track]/*. This is the regression guard for that.
  await page.goto("/learn/dsa");
  await expect(
    page.getByRole("heading", { level: 1, name: "Data Structures & Algorithms" })
  ).toBeVisible();

  await page.goto(
    "/learn/dsa/dsa-foundations/complexity-analysis/why-complexity-matters"
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Why Complexity Matters" })
  ).toBeVisible();
});
