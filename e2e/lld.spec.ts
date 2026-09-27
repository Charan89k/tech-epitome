import { expect, test, type Page } from "@playwright/test";

import { closeDb } from "./db";
import { finishSignup } from "./helpers";

/**
 * Journey 4: Low-Level Design.
 *
 * Locators are scoped to `main` throughout. Under parallel load the
 * Next dev server leaves a hidden prerender copy of the page in the
 * DOM, so an unscoped `getByTestId` intermittently matches twice.
 *
 * Track → chapter → exercise → design classes → relate them → save →
 * reload → validate → submit → reference → AI review.
 *
 * The assertions that matter most are the negative ones: the reference
 * design and the unopened hints must not be on the page before the
 * learner earns them. Both are withheld in the service rather than
 * hidden with CSS, so "not visible" is checked as "not in the DOM".
 */

const PASSWORD = "forge-e2e-password";

const LESSON_URL =
  "/learn/lld/low-level-design/foundations/what-low-level-design-is";
const EXERCISE_URL = "/lld/parking-garage";

function uniqueEmail(tag: string): string {
  return `e2e-lld-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@techepitome.test`;
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

function isNarrow(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

/** The workspace becomes tabs below `lg`; select one. */
async function showPane(page: Page, pane: "Design" | "Edit" | "Code") {
  if (!isNarrow(page)) return;
  await page.getByRole("tab", { name: pane }).click();
}

/**
 * Waits until autosave has run and gone quiet.
 *
 * Two traps this avoids, both hit on the way to this version. The status
 * line already reads "Draft saved" from an earlier autosave, so
 * asserting on that text passes before the newest edit is written. And
 * waiting for a single POST can match a save that was already in flight.
 * Requiring a save *and* a beat of silence covers both; reloading before
 * that simply loses the edit to the 900ms debounce.
 */
async function waitForAutosave(page: Page, fill: () => Promise<void>) {
  let lastSaveAt = 0;
  const onResponse = (response: { request: () => { method: () => string } }) => {
    if (response.request().method() === "POST") lastSaveAt = Date.now();
  };
  page.on("response", onResponse);

  await fill();

  await expect
    .poll(() => lastSaveAt !== 0 && Date.now() - lastSaveAt > 1_500, {
      timeout: 30_000,
      intervals: [400],
    })
    .toBe(true);

  page.off("response", onResponse);
}

test.afterAll(async () => {
  await closeDb();
});

// ---------------------------------------------------------------------------

test("the LLD track is reachable and its lessons render", async ({ page }) => {
  await page.goto("/learn/lld");
  await expect(
    page.getByRole("heading", { level: 1, name: "Low-Level Design" })
  ).toBeVisible();

  await page.goto(LESSON_URL);
  await expect(
    page.getByRole("heading", { level: 1, name: "What Low-Level Design Is" })
  ).toBeVisible();
  // Scoped to the heading: the table of contents links to the same text.
  await expect(
    page.getByRole("heading", { name: "The layer in between" })
  ).toBeVisible();
});

test("an exercise withholds its reference design and its hints", async ({
  page,
}) => {
  await signUp(page, "withhold");
  await page.goto(EXERCISE_URL);

  await expect(
    page.getByRole("heading", { level: 1, name: "Parking Garage" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Requirements", exact: true })
  ).toBeVisible();

  // Absent from the DOM entirely, not merely hidden.
  await expect(
    page.getByRole("heading", { name: "One reference design" })
  ).toHaveCount(0);
  await expect(page.getByText("Trade-offs behind it")).toHaveCount(0);

  // The hint count is public; the bodies are not.
  await showPane(page, "Edit");
  await expect(page.getByText("0/4")).toBeVisible();
  await expect(page.getByText(/list the nouns in the requirements/i)).toHaveCount(0);
});

test("no reference material reaches the browser before submission", async ({
  page,
}) => {
  // The strongest form of the secrecy check: not "is the heading
  // visible" but "is the text anywhere in what the server sent". The
  // exercise page is a Server Component that serialises props into the
  // RSC payload, so a reference field passed by mistake would be in the
  // HTML even with nothing rendered.
  await signUp(page, "payload");
  await page.reload();
  await page.goto(EXERCISE_URL);
  await expect(page.getByRole("main").getByTestId("lld-workspace")).toBeVisible({ timeout: 30_000 });

  const html = await page.content();

  // Phrases that exist ONLY in the withheld reference for this exercise.
  //
  // Note what is deliberately absent from this list: "FeePolicy". That
  // name is a candidate entity in the public brief — the exercise tells
  // you the concept exists and asks you to design it — so finding it in
  // the payload is correct, not a leak. The reference's *concrete*
  // vocabulary is what must not appear.
  for (const secret of [
    "HourlyFeePolicy",
    "GarageFullException",
    "ratePerHour",
    "the seam: a rule, not a method",
  ]) {
    expect(html, `"${secret}" must not reach the browser pre-submission`).not.toContain(
      secret
    );
  }

  // Nor may an unopened hint.
  expect(html).not.toContain("list the nouns in the requirements");
  expect(html).not.toContain("Consider a FeePolicy interface");

  // And the field names themselves should be absent from the payload.
  for (const field of ['\\"tradeoffs\\"', '\\"classDiagram\\":{\\"types\\"']) {
    expect(html).not.toContain(field);
  }

  // Sanity: the public brief IS there, so this test would notice if the
  // page simply failed to render.
  expect(html).toContain("Park a vehicle in a space that fits it");
});

test("full journey: design, relate, save, reload, submit, review", async ({
  page,
}) => {
  test.slow();
  await signUp(page, "journey");
  await page.reload();

  await page.goto(EXERCISE_URL);
  const workspace = page.getByRole("main").getByTestId("lld-workspace");
  await expect(workspace).toBeVisible({ timeout: 30_000 });

  // --- add types ----------------------------------------------------------
  await showPane(page, "Design");
  await workspace.getByRole("button", { name: "Abstract class" }).click();
  await workspace.getByRole("button", { name: "Class", exact: true }).click();
  await workspace.getByRole("button", { name: "Interface" }).click();

  // --- rename one via the inspector ---------------------------------------
  await showPane(page, "Edit");
  const inspector = page.getByTestId("lld-inspector");
  await expect(inspector).toBeVisible({ timeout: 15_000 });
  await inspector.getByLabel("Type name").fill("FeePolicy");

  // --- add a method -------------------------------------------------------
  await inspector.getByRole("button", { name: "Add" }).nth(1).click();
  await expect(inspector.getByLabel("Method name")).toBeVisible();

  // --- relate two types ---------------------------------------------------
  await showPane(page, "Design");
  await workspace.getByRole("button", { name: /Connect two types/ }).click();
  await workspace.locator('g[role="button"]').first().click();

  await expect(
    workspace.getByRole("heading", { name: "Relationships" })
  ).toBeVisible({ timeout: 15_000 });

  // --- rationale ----------------------------------------------------------
  await showPane(page, "Edit");

  await waitForAutosave(page, () =>
    page
      .getByLabel("Why this design?")
      .fill(
        "Pricing is the requirement most likely to change, so it sits behind an interface."
      )
  );

  // A reload proves it reached the database rather than local state.
  await page.reload();
  await showPane(page, "Edit");
  await expect(page.getByLabel("Why this design?")).toHaveValue(
    /most likely to change/,
    { timeout: 20_000 }
  );

  // --- diagnostics are real, and are not a score --------------------------
  await showPane(page, "Design");
  const diagnostics = page.getByTestId("lld-diagnostics");
  await expect(diagnostics).toBeVisible({ timeout: 15_000 });
  await expect(diagnostics).toContainText(/Problem|Consider|Good/);
  await expect(diagnostics).not.toContainText(/score/i);

  // --- hint ladder --------------------------------------------------------
  await showPane(page, "Edit");
  await page.getByRole("button", { name: /Show a hint/ }).click();
  await expect(page.getByText("Hint 1")).toBeVisible({ timeout: 20_000 });
  // Hint 2 must not appear until it is asked for.
  await expect(page.getByText("Hint 2")).toHaveCount(0);

  // --- submit -------------------------------------------------------------
  await page.getByRole("button", { name: "Submit design" }).click();
  await expect(
    page.getByRole("heading", { name: "One reference design" })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Trade-offs behind it")).toBeVisible();

  // --- AI review ----------------------------------------------------------
  await page.getByTestId("tutor-open").click();
  await page.getByRole("button", { name: "Review my design" }).first().click();

  const transcript = page.getByTestId("tutor-transcript");
  await expect(transcript.getByText(/Request type: REVIEW_DESIGN/)).toBeVisible({
    timeout: 30_000,
  });
});

test("a design that is barely started cannot be submitted", async ({ page }) => {
  await signUp(page, "empty");
  await page.reload();

  await page.goto(EXERCISE_URL);
  const workspace = page.getByRole("main").getByTestId("lld-workspace");
  await expect(workspace).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Submit design" }).click();

  await expect(page.getByRole("alert")).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: "One reference design" })
  ).toHaveCount(0);
});

test("a class diagram is readable as text, not only as a picture", async ({
  page,
}) => {
  await signUp(page, "a11y");
  await page.reload();

  await page.goto(EXERCISE_URL);
  const workspace = page.getByRole("main").getByTestId("lld-workspace");
  await expect(workspace).toBeVisible({ timeout: 30_000 });

  await showPane(page, "Design");
  await workspace.getByRole("button", { name: "Class", exact: true }).click();
  await workspace.getByRole("button", { name: "Interface" }).click();

  // The SVG's accessible description is structural prose, not "a diagram".
  const svg = workspace.getByRole("img").first();
  const described = await svg.getAttribute("aria-labelledby");
  expect(described).toBeTruthy();

  const desc = workspace.locator("desc").first();
  await expect(desc).toContainText(/This design has/);
  await expect(desc).toContainText(/class/);
});

test("a signed-out visitor is asked to sign in rather than shown a broken editor", async ({
  page,
}) => {
  await page.goto(EXERCISE_URL);
  await expect(page.getByText("Sign in to design and save.")).toBeVisible();
  await expect(page.getByRole("main").getByTestId("lld-workspace")).toHaveCount(0);
});

test("one learner cannot reach another's LLD design", async ({ page, browser }) => {
  // Two signups, two upgrades and two workspace loads do not fit in the
  // default budget.
  test.slow();

  // Alice saves a design with a distinctive rationale.
  await signUp(page, "alice");
  await page.reload();
  await page.goto(EXERCISE_URL);

  const workspace = page.getByRole("main").getByTestId("lld-workspace");
  await expect(workspace).toBeVisible({ timeout: 30_000 });
  await showPane(page, "Design");
  await workspace.getByRole("button", { name: "Class", exact: true }).click();
  await showPane(page, "Edit");
  await waitForAutosave(page, () =>
    page.getByLabel("Why this design?").fill("alices-private-rationale")
  );

  // Bob opens the same exercise in a separate browser context.
  const context = await browser.newContext();
  const bobPage = await context.newPage();
  await signUp(bobPage, "bob");
  await bobPage.reload();
  await bobPage.goto(EXERCISE_URL);

  await expect(bobPage.getByRole("main").getByTestId("lld-workspace")).toBeVisible({ timeout: 30_000 });
  // Nothing of Alice's reaches Bob's page — the submission is keyed on
  // (userId, problemId) and there is no way to name hers.
  await expect(bobPage.getByText("alices-private-rationale")).toHaveCount(0);

  await context.close();
});

test("the workspace works on a phone without overflowing", async ({ page }) => {
  test.skip(!isNarrow(page), "This assertion is about the mobile layout.");
  test.slow();

  await signUp(page, "mobile");
  await page.goto(EXERCISE_URL);

  const workspace = page.getByRole("main").getByTestId("lld-workspace");
  await expect(workspace).toBeVisible({ timeout: 30_000 });

  // Mobile gets tabs rather than a squeezed three-column grid.
  await expect(page.getByRole("tab", { name: "Design" })).toBeVisible({
    timeout: 20_000,
  });
  await workspace.getByRole("button", { name: "Class", exact: true }).click();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(2);
});

test("existing tracks still work alongside LLD", async ({ page }) => {
  // Regression guard for the shared track routing.
  await page.goto("/learn/dsa");
  await expect(
    page.getByRole("heading", { level: 1, name: "Data Structures & Algorithms" })
  ).toBeVisible();

  await page.goto("/learn/system-design");
  await expect(
    page.getByRole("heading", { level: 1, name: "System Design" })
  ).toBeVisible();
});
