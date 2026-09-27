import { expect, test, type Page } from "@playwright/test";

import { closeDb, makeAdmin, makeReviewsDue, reviewItemsFor } from "./db";

/**
 * Captures the screenshots and the demo recording used by the README.
 *
 * Not a test of anything — it drives the real application and saves what
 * it sees, so the media in the documentation is the product rather than a
 * mockup. Excluded from the normal suite by its own project in
 * `playwright.config.ts`; run it with `npm run capture:media`.
 *
 * Everything it shows is created through the real UI by a real account.
 */

const PASSWORD = "forge-e2e-password";
const SHOTS = "docs/screenshots";
const CHAPTER_URL =
  "/learn/dsa/dsa-foundations/complexity-analysis/why-complexity-matters";
const PROBLEM_URL = "/problems/running-altitude";

function uniqueEmail(tag: string): string {
  return `demo-${tag}-${Date.now()}@techepitome.test`;
}

async function shot(page: Page, name: string): Promise<void> {
  // A beat for fonts and any entrance transition to settle.
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

async function signUp(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  return email;
}

test.afterAll(async () => {
  await closeDb();
});

test("capture the product screenshots", async ({ page }) => {
  test.slow();

  // --- public surfaces ----------------------------------------------------
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "landing");

  await page.goto("/features");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "features");

  await page.goto("/signup");
  await expect(page.getByLabel("Email")).toBeVisible();
  await shot(page, "signup");

  // --- onboarding ---------------------------------------------------------
  const email = await signUp(page, "shots");
  await page.waitForURL(/\/(onboarding|dashboard)$/, { timeout: 30_000 });
  if (page.url().includes("onboarding")) {
    await expect(
      page.getByRole("heading", { name: "Before you start" })
    ).toBeVisible();
    await shot(page, "onboarding");

    await page.getByLabel("How much have you done before?").click();
    await page.getByRole("option", { name: "Working engineer" }).click();
    await page.getByLabel("What are you here for?").click();
    await page.getByRole("option", { name: "Preparing for interviews" }).click();
    await page.getByRole("button", { name: "Save and continue" }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
  }

  // --- learning -----------------------------------------------------------
  await page.goto(CHAPTER_URL);
  await expect(
    page.getByRole("main").locator("[data-block-index]").first()
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, "learning-chapter");

  // A real highlight, made through the real selection path.
  const madeHighlight = await page.evaluate(() => {
    const main = document.querySelector("main")!;
    const block = [...main.querySelectorAll("[data-block-index]")].find(
      (b) => (b.textContent ?? "").trim().length > 80
    );
    if (!block) return false;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode() as Text | null;
    while (node && node.data.trim().length < 60) node = walker.nextNode() as Text | null;
    if (!node) return false;
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, 48);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    block.dispatchEvent(new Event("pointerup", { bubbles: true }));
    return true;
  });

  if (madeHighlight) {
    const toolbar = page.locator("[data-highlight-toolbar]");
    await expect(toolbar).toBeVisible({ timeout: 10_000 });
    await shot(page, "highlight-toolbar");
    await toolbar.getByRole("button", { name: /Highlight in Amber/ }).click();
    await expect(page.getByRole("main").locator("mark").first()).toBeVisible({
      timeout: 20_000,
    });
    await shot(page, "highlight-applied");

    await page.goto("/dashboard/highlights");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "highlights-library");
  }

  // --- problem workspace --------------------------------------------------
  await page.goto(PROBLEM_URL);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(2_500); // Monaco
  await shot(page, "problem-workspace");

  // --- AI tutor -----------------------------------------------------------
  await page.goto("/ai-tutor");
  await expect(
    page.getByRole("heading", { name: "AI Tutor", exact: true })
  ).toBeVisible({ timeout: 30_000 });
  await page
    .getByLabel("Message the tutor")
    .filter({ visible: true })
    .fill("How do I recognise a sliding-window problem?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByTestId("tutor-transcript").getByText(/Request type:/)
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, "ai-tutor");

  // --- mock interview -----------------------------------------------------
  await page.goto("/interviews");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "interviews");

  await page.getByLabel("Interview type").click();
  await page.getByRole("option", { name: "System design" }).click();
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL(/\/interviews\/[a-z0-9]+$/, { timeout: 30_000 });
  await expect(page.getByTestId("interview-room")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Begin interview" }).click();
  await expect(
    page.getByTestId("interview-transcript").getByText("Interviewer").first()
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, "interview-room");

  // --- design tracks ------------------------------------------------------
  await page.goto("/system-design");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "system-design");

  await page.goto("/system-design/short-link-service");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(1_200);
  await shot(page, "system-design-workspace");

  await page.goto("/lld/parking-garage");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(1_200);
  await shot(page, "lld-workspace");

  // --- notes --------------------------------------------------------------
  await page.goto(PROBLEM_URL);
  await expect(page.getByRole("button", { name: "Add a note" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Add a note" }).click();
  await page
    .getByLabel("Your note")
    .fill("The running maximum only ever increases — no need to rescan.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Note saved")).toBeVisible({ timeout: 20_000 });
  await page.goto("/dashboard/notes");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await shot(page, "notes");

  // --- review, prep, profile, dashboard ------------------------------------
  if ((await reviewItemsFor(email)).length > 0) {
    await makeReviewsDue(email);
  }
  for (const [route, name] of [
    ["/review", "review"],
    ["/prepare/generalist-loop", "prepare"],
    ["/profile", "profile-achievements"],
    ["/dashboard", "dashboard"],
  ] as const) {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible({ timeout: 30_000 });
    await shot(page, name);
  }

  // --- admin --------------------------------------------------------------
  await makeAdmin(email);
  await page.reload();
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible({
    timeout: 30_000,
  });
  await shot(page, "admin");
});
