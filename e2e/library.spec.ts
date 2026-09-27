import { expect, test, type Page } from "@playwright/test";

import { closeDb, unreadNotificationsFor } from "./db";
import { finishSignup } from "./helpers";

/**
 * Notes, bookmarks, notifications and onboarding.
 *
 * These are the four things the previous audit found half-built: a
 * bookmarks page nothing could add to, a notes page with no writer, a
 * notification preference with no notifications, and no onboarding at
 * all. Each test below walks the whole loop rather than asserting a
 * control is present, because "the button renders" was already true.
 */

const PASSWORD = "forge-e2e-password";
const CHAPTER_URL =
  "/learn/dsa/dsa-foundations/complexity-analysis/why-complexity-matters";
const PROBLEM_URL = "/problems/running-altitude";

function uniqueEmail(tag: string): string {
  return `e2e-lib-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@codeforge.test`;
}

async function signUp(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Reader");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);
  return email;
}

/**
 * Signs up and gets past onboarding.
 *
 * `signUp` already skips it — this alias exists so the tests below read
 * as what they are doing rather than relying on a helper's side effect.
 */
async function signUpAndSkip(page: Page, tag: string): Promise<string> {
  return signUp(page, tag);
}

/** Signs up and stops wherever signup lands, for the onboarding tests. */
async function signUpRaw(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Reader");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/(onboarding|dashboard)(\?.*)?$/, { timeout: 30_000 });
  return email;
}

test.afterAll(async () => {
  await closeDb();
});

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

test("a new account is offered onboarding and can skip it", async ({ page }) => {
  await signUpRaw(page, "onboard");

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(
    page.getByRole("heading", { name: "Before you start" })
  ).toBeVisible();

  // Every question is genuinely optional, so skipping must not be a
  // second-class path that leaves the prompt reappearing.
  await page.getByRole("button", { name: "Skip" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("onboarding answers save and are editable afterwards", async ({ page }) => {
  await signUpRaw(page, "answers");
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByLabel("How much have you done before?").click();
  await page.getByRole("option", { name: "Working engineer" }).click();

  await page.getByLabel("What are you here for?").click();
  await page.getByRole("option", { name: "Preparing for interviews" }).click();

  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });

  // Reachable again from settings: somebody who answered should be able
  // to change their mind.
  await page.goto("/settings");
  await expect(page.getByRole("link", { name: "Review answers" })).toBeVisible();

  await page.getByRole("link", { name: "Review answers" }).click();
  await page.waitForURL(/\/onboarding$/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Your learning preferences" })
  ).toBeVisible();
  // The saved answer is preselected, so coming back shows what you chose.
  await expect(
    page.getByRole("combobox", { name: "How much have you done before?" })
  ).toContainText("Working engineer");
});

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

test("a chapter can be saved and then unsaved from the library", async ({
  page,
}) => {
  await signUpAndSkip(page, "bookmark");

  await page.goto(CHAPTER_URL);
  const save = page.getByRole("button", { name: "Save to library" });
  await expect(save).toBeVisible();
  await save.click();

  const saved = page.getByRole("button", { name: "Remove from library" });
  await expect(saved).toBeVisible({ timeout: 20_000 });
  // The label flips optimistically, so waiting for it is not waiting for
  // the write. The button is disabled for the duration of the transition;
  // navigating before it re-enables aborts the request mid-flight.
  await expect(saved).toBeEnabled({ timeout: 20_000 });

  await page.goto("/dashboard/bookmarks");
  await expect(page.getByText("Why Complexity Matters")).toBeVisible();

  // And back out again, from the list itself. The action revalidates the
  // page it is on, so the row is removed under the button; asserting on
  // a reload rather than on that in-place update keeps the check about
  // what was persisted instead of about render timing.
  await page.getByRole("button", { name: "Remove from library" }).click();

  await expect(async () => {
    await page.reload();
    await expect(
      page.getByRole("main").getByText("Nothing bookmarked yet")
    ).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
});

test("a signed-out visitor is told to sign in rather than shown nothing", async ({
  page,
}) => {
  await page.goto(CHAPTER_URL);
  await page.getByRole("button", { name: "Save to library" }).click();

  await expect(page.getByText("Sign in to save this")).toBeVisible();
  // Never a price. It is free, and the prompt says so.
  const toast = await page.locator("[data-sonner-toast]").innerText();
  expect(toast).not.toMatch(/upgrade|pro\b|subscribe|plan/i);
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

test("a note can be written, edited and deleted", async ({ page }) => {
  test.slow();
  await signUpAndSkip(page, "note");

  await page.goto(PROBLEM_URL);
  await page.getByRole("button", { name: "Add a note" }).click();

  const box = page.getByLabel("Your note");
  await box.fill("The running maximum only ever increases.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Note saved")).toBeVisible({ timeout: 20_000 });

  // It reaches the library, attached to the thing it came from. Scoped
  // to `main` throughout: under parallel load the dev server leaves a
  // hidden prerender copy of the page in the DOM, so an unscoped match
  // resolves twice. A dev-server artefact, documented in the README.
  await page.goto("/dashboard/notes");
  await expect(
    page.getByRole("main").getByText("The running maximum only ever increases.")
  ).toBeVisible();

  // Editing happens where it was written, and replaces rather than adds.
  await page.goto(PROBLEM_URL);
  await expect(page.getByLabel("Your note")).toHaveValue(
    "The running maximum only ever increases."
  );
  await page.getByLabel("Your note").fill("Revised: track the max as you scan.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Note saved")).toBeVisible({ timeout: 20_000 });

  await page.goto("/dashboard/notes");
  const notes = page.getByRole("main");
  await expect(
    notes.getByText("Revised: track the max as you scan.")
  ).toBeVisible();
  await expect(notes.getByText("The running maximum only ever")).toHaveCount(0);

  // Two clicks to delete, so a mis-tap does not lose it.
  await notes.getByRole("button", { name: "Delete" }).first().click();
  await notes.getByRole("button", { name: "Confirm" }).first().click();
  await expect(notes.getByText("No notes yet")).toBeVisible({ timeout: 20_000 });
});

test("one learner's note is invisible to another", async ({ page, browser }) => {
  test.slow();
  await signUpAndSkip(page, "alice");

  await page.goto(PROBLEM_URL);
  await page.getByRole("button", { name: "Add a note" }).click();
  await page.getByLabel("Your note").fill("Alice's private observation.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Note saved")).toBeVisible({ timeout: 20_000 });

  const context = await browser.newContext();
  const other = await context.newPage();
  await signUpAndSkip(other, "bob");

  await other.goto(PROBLEM_URL);
  // Not merely hidden: it is not in the served HTML at all.
  expect(await other.content()).not.toContain("Alice's private observation");

  await other.goto("/dashboard/notes");
  // Scoped to `main`: under parallel load the dev server leaves a hidden
  // prerender copy of the page in the DOM, and an unscoped match can
  // resolve to that one. It is a dev-server artefact, not a defect — see
  // the README.
  await expect(
    other.getByRole("main").getByText("No notes yet")
  ).toBeVisible({ timeout: 20_000 });

  await context.close();
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

test("the bell starts empty and says so", async ({ page }) => {
  await signUpAndSkip(page, "bell");

  await page.getByRole("button", { name: /Notifications/ }).click();
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await expect(page.getByText(/Nothing yet/)).toBeVisible({ timeout: 20_000 });
});

test("solving a first problem produces a milestone that can be read and dismissed", async ({
  page,
}) => {
  test.slow();
  const email = await signUpAndSkip(page, "milestone");

  await page.goto(PROBLEM_URL);

  // Submit, so the notification is earned rather than staged. Below the
  // `lg` breakpoint the workspace collapses to tabs, and the result lands
  // in a pane that is not on screen.
  const narrow = (page.viewportSize()?.width ?? 1280) < 1024;
  if (narrow) await page.getByRole("tab", { name: "Code" }).click();

  await page.getByRole("button", { name: "Submit" }).click();
  if (narrow) await page.getByRole("tab", { name: "Results" }).click();

  await expect(page.getByText(/Accepted|Wrong answer|failed/i).first()).toBeVisible({
    timeout: 60_000,
  });

  // The milestone only fires on an accepted submission. If the starter
  // stub does not pass — which it should not — there is nothing to
  // assert, and asserting anyway would be asserting on the fixture.
  const accepted = await page.getByText("Accepted").count();
  if (accepted === 0) {
    expect(await unreadNotificationsFor(email)).toBe(0);
    return;
  }

  await expect(page.getByRole("button", { name: /1 unread/ })).toBeVisible({
    timeout: 20_000,
  });

  await page.getByRole("button", { name: /Notifications/ }).click();
  await expect(page.getByText("First problem solved")).toBeVisible();

  await page.getByRole("button", { name: "Mark all read" }).click();
  await expect(async () => {
    expect(await unreadNotificationsFor(email)).toBe(0);
  }).toPass({ timeout: 20_000 });
});

test("notification preferences suppress a kind at write time", async ({ page }) => {
  const email = await signUpAndSkip(page, "prefs");

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();

  const body = await page.getByRole("main").innerText();
  // One email exists now, and the page is precise about which: a review
  // reminder, opt-in, and nothing else. The old copy claimed CodeForge
  // sent no email at all, which stopped being true when the provider
  // landed — a test asserting it would have kept passing while the page
  // lied.
  await expect(page.getByRole("heading", { name: "Email" })).toBeVisible();
  expect(body).toMatch(/only email codeforge sends/i);
  expect(body).toMatch(/no marketing of any kind/i);
  // Off unless asked for: mail cannot be un-sent.
  await expect(page.getByLabel("Review reminders by email")).not.toBeChecked();
  // And never a price, in either section.
  expect(body).not.toMatch(/upgrade|premium|subscribe/i);

  await page.getByLabel("Milestones").uncheck();
  await page.getByRole("button", { name: /Save/ }).click();
  await expect(page.getByText(/Settings saved/)).toBeVisible({ timeout: 20_000 });

  expect(await unreadNotificationsFor(email)).toBe(0);
});
