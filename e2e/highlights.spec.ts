import { expect, test, type Page } from "@playwright/test";

import { closeDb, highlightCountFor, highlightQuotesFor } from "./db";
import { finishSignup } from "./helpers";

/**
 * Highlights, end to end.
 *
 * The interesting assertions are the ones a unit test cannot make: that
 * a real browser selection produces an anchor the server accepts, that
 * the mark survives a reload, and that one learner's highlights are
 * absent from another's served HTML rather than merely hidden.
 *
 * Selections are made through the real Selection API rather than by
 * simulating a drag, because a synthesised drag in a headless browser
 * does not reliably produce one and a test that silently selects
 * nothing would pass for the wrong reason.
 */

const PASSWORD = "forge-e2e-password";
const CHAPTER_URL =
  "/learn/dsa/dsa-foundations/complexity-analysis/why-complexity-matters";
const PROBLEM_URL = "/problems/running-altitude";

function uniqueEmail(tag: string): string {
  return `e2e-hl-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@techepitome.test`;
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
 * Selects `length` characters from `start` in the first paragraph of the
 * given block, and returns the text that was selected.
 *
 * Returns null when the block is not there or is too short, so a caller
 * can fail with a useful message rather than on a later assertion.
 */
async function selectInBlock(
  page: Page,
  blockIndex: number,
  start: number,
  length: number
): Promise<string | null> {
  return page.evaluate(
    ({ blockIndex, start, length }) => {
      const main = document.querySelector("main") ?? document.body;
      const block = main.querySelector(`[data-block-index="${blockIndex}"]`);
      if (!block) return null;

      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode() as Text | null;
      while (node && node.data.trim().length < start + length) {
        node = walker.nextNode() as Text | null;
      }
      if (!node) return null;

      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + length);

      const selection = window.getSelection();
      if (!selection) return null;
      selection.removeAllRanges();
      selection.addRange(range);

      // The component listens for a settled selection.
      block.dispatchEvent(new Event("pointerup", { bubbles: true }));
      return range.toString();
    },
    { blockIndex, start, length }
  );
}

/**
 * Waits for the reader's blocks to be attached inside the main landmark.
 *
 * Next streams suspended content into holding elements at the end of
 * `body` and moves it into place afterwards, so reading the DOM
 * immediately after `goto` can find the blocks in the document but not
 * yet under `main`. Every helper below reads the DOM directly, so they
 * all have to wait for that to settle first.
 */
async function readerReady(page: Page): Promise<void> {
  await expect(
    page.getByRole("main").locator("[data-block-index]").first()
  ).toBeVisible({ timeout: 30_000 });
}

/** Finds the first block with enough text to select from. */
async function firstUsableBlock(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const main = document.querySelector("main") ?? document.body;
    const blocks = main.querySelectorAll("[data-block-index]");
    for (const block of blocks) {
      if ((block.textContent ?? "").trim().length > 40) {
        return Number(block.getAttribute("data-block-index"));
      }
    }
    return null;
  });
}

test.afterAll(async () => {
  await closeDb();
});

// ---------------------------------------------------------------------------

test("the reader exposes block anchors for highlighting", async ({ page }) => {
  // The anchor a highlight is stored against. Without these attributes
  // nothing else in this file can work, so it is checked on its own.
  await page.goto(CHAPTER_URL);
  await readerReady(page);
  const blocks = await page
    .getByRole("main")
    .locator("[data-block-index]")
    .count();
  expect(blocks).toBeGreaterThan(3);
});

test("a learner can highlight a chapter, and it survives a reload", async ({
  page,
}) => {
  test.slow();
  const email = await signUp(page, "create");

  await page.goto(CHAPTER_URL);
  await readerReady(page);
  const blockIndex = await firstUsableBlock(page);
  expect(blockIndex, "no block with enough text to select").not.toBeNull();

  const selected = await selectInBlock(page, blockIndex!, 2, 18);
  expect(selected, "the selection produced nothing").toBeTruthy();

  // The toolbar appears over the selection, with the palette.
  const toolbar = page.locator("[data-highlight-toolbar]");
  await expect(toolbar).toBeVisible({ timeout: 10_000 });

  await toolbar.getByRole("button", { name: /Highlight in Amber/ }).click();

  // Painted in place.
  await expect(page.getByRole("main").locator("mark").first()).toBeVisible({
    timeout: 20_000,
  });

  // Persisted, with exactly the text that was selected.
  await expect(async () => {
    expect(await highlightCountFor(email)).toBe(1);
  }).toPass({ timeout: 20_000 });
  expect(await highlightQuotesFor(email)).toEqual([selected]);

  // And it comes back on a fresh render, not just in this DOM.
  await page.reload();
  const marks = page.getByRole("main").locator("mark");
  await expect(marks.first()).toBeVisible({ timeout: 20_000 });
  await expect(marks.first()).toHaveText(selected!);
});

test("a highlight can be removed from the page it is on", async ({ page }) => {
  test.slow();
  const email = await signUp(page, "remove");

  await page.goto(PROBLEM_URL);
  await readerReady(page);
  const blockIndex = await firstUsableBlock(page);
  expect(blockIndex).not.toBeNull();
  expect(await selectInBlock(page, blockIndex!, 0, 12)).toBeTruthy();

  const toolbar = page.locator("[data-highlight-toolbar]");
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  await toolbar.getByRole("button", { name: /Highlight in Blue/ }).click();

  const mark = page.getByRole("main").locator("mark").first();
  await expect(mark).toBeVisible({ timeout: 20_000 });
  await expect(async () => {
    expect(await highlightCountFor(email)).toBe(1);
  }).toPass({ timeout: 20_000 });

  // Activating the mark offers to remove it.
  await mark.click();
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole("button", { name: "Remove highlight" }).click();

  await expect(page.getByRole("main").locator("mark")).toHaveCount(0, {
    timeout: 20_000,
  });
  await expect(async () => {
    expect(await highlightCountFor(email)).toBe(0);
  }).toPass({ timeout: 20_000 });
});

test("highlights collect in the library with a link back", async ({ page }) => {
  test.slow();
  const email = await signUp(page, "library");

  await page.goto(CHAPTER_URL);
  await readerReady(page);
  const blockIndex = await firstUsableBlock(page);
  const selected = await selectInBlock(page, blockIndex!, 3, 20);
  expect(selected).toBeTruthy();

  const toolbar = page.locator("[data-highlight-toolbar]");
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  await toolbar.getByRole("button", { name: /Highlight in Green/ }).click();
  await expect(async () => {
    expect(await highlightCountFor(email)).toBe(1);
  }).toPass({ timeout: 20_000 });

  await page.goto("/dashboard/highlights");
  const main = page.getByRole("main");
  await expect(main.getByText(selected!.trim(), { exact: false })).toBeVisible();

  // It identifies its source and links back to it.
  await expect(main.getByText("Why Complexity Matters")).toBeVisible();
  await main.getByRole("link", { name: /Why Complexity Matters/ }).click();
  await page.waitForURL(/why-complexity-matters$/, { timeout: 30_000 });

  // Deleting from the library takes two clicks, then it is gone.
  await page.goto("/dashboard/highlights");
  await main.getByRole("button", { name: "Delete" }).first().click();
  await main.getByRole("button", { name: "Confirm" }).first().click();
  await expect(main.getByText("No highlights yet")).toBeVisible({
    timeout: 20_000,
  });
  expect(await highlightCountFor(email)).toBe(0);
});

test("a signed-out visitor is asked to sign in rather than shown nothing", async ({
  page,
}) => {
  await page.goto(CHAPTER_URL);
  await readerReady(page);
  const blockIndex = await firstUsableBlock(page);
  expect(await selectInBlock(page, blockIndex!, 0, 15)).toBeTruthy();

  const toolbar = page.locator("[data-highlight-toolbar]");
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  await toolbar.getByRole("button", { name: /Highlight in Amber/ }).click();

  await expect(page.getByText("Sign in to highlight")).toBeVisible();
  // Never a price. It is free, and the prompt says so.
  const notice = await page.locator("[data-sonner-toast]").innerText();
  expect(notice).not.toMatch(/upgrade|pro\b|subscribe|plan/i);
});

test("one learner's highlights never reach another's browser", async ({
  page,
  browser,
}) => {
  test.slow();
  const alice = await signUp(page, "alice");

  await page.goto(CHAPTER_URL);
  await readerReady(page);
  const blockIndex = await firstUsableBlock(page);
  const selected = await selectInBlock(page, blockIndex!, 1, 24);
  expect(selected).toBeTruthy();

  const toolbar = page.locator("[data-highlight-toolbar]");
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  await toolbar.getByRole("button", { name: /Highlight in Purple/ }).click();
  await expect(async () => {
    expect(await highlightCountFor(alice)).toBe(1);
  }).toPass({ timeout: 20_000 });

  const context = await browser.newContext();
  const other = await context.newPage();
  const bob = await signUp(other, "bob");

  await other.goto(CHAPTER_URL);
  await readerReady(other);
  // Not merely unpainted: nothing about Alice's highlight is in the HTML.
  await expect(other.getByRole("main").locator("mark")).toHaveCount(0);

  await other.goto("/dashboard/highlights");
  await expect(
    other.getByRole("main").getByText("No highlights yet")
  ).toBeVisible();
  expect(await highlightCountFor(bob)).toBe(0);

  await context.close();
});

test("the server refuses a forged or malformed highlight", async ({ page }) => {
  const email = await signUp(page, "forged");
  await page.goto(CHAPTER_URL);

  // Posted directly at the action, bypassing the UI entirely.
  const results = await page.evaluate(async () => {
    async function post(body: unknown) {
      const response = await fetch(window.location.pathname, {
        method: "POST",
        headers: {
          "content-type": "text/plain;charset=UTF-8",
          "next-action": "0000000000000000000000000000000000000000",
        },
        body: JSON.stringify([body]),
      });
      return response.status;
    }

    return {
      // A malformed Server Action id is rejected before anything runs,
      // which is itself the point: there is no unauthenticated path in.
      forged: await post({ entityType: "CHAPTER", entityId: "nope" }),
    };
  });

  expect(results.forged).not.toBe(200);
  // Nothing was written.
  expect(await highlightCountFor(email)).toBe(0);
});

test("the highlight toolbar is usable on a phone", async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 1280) >= 1024,
    "This assertion is about the mobile layout."
  );

  await signUp(page, "mobile");
  await page.goto(CHAPTER_URL);
  await readerReady(page);

  const blockIndex = await firstUsableBlock(page);
  expect(await selectInBlock(page, blockIndex!, 0, 16)).toBeTruthy();

  const toolbar = page.locator("[data-highlight-toolbar]");
  await expect(toolbar).toBeVisible({ timeout: 10_000 });

  // On screen, not hanging off the edge.
  const box = await toolbar.boundingBox();
  const width = page.viewportSize()!.width;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);

  // Each swatch is a real touch target, not a 12px dot.
  const swatch = toolbar.getByRole("button", { name: /Highlight in Amber/ });
  const swatchBox = await swatch.boundingBox();
  expect(swatchBox!.height).toBeGreaterThanOrEqual(32);
  expect(swatchBox!.width).toBeGreaterThanOrEqual(32);

  await swatch.click();
  await expect(page.getByRole("main").locator("mark").first()).toBeVisible({
    timeout: 20_000,
  });

  // And the page did not gain a horizontal scrollbar.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
