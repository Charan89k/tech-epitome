import { expect, test, type Page } from "@playwright/test";

import { closeDb, dueAtMs, makeReviewsDue, reviewItemsFor } from "./db";
import { finishSignup } from "./helpers";

/**
 * The spaced-revision loop, end to end.
 *
 *   complete a chapter → a review item exists → it becomes due →
 *   dashboard shows it → recall prompt → reveal → grade →
 *   rescheduled → gone from the queue → dashboard agrees
 *
 * Review items are deliberately scheduled for the day after they are
 * created, so the tests backdate them through the database — the one thing
 * a browser cannot do. Everything else goes through the UI.
 */

const PASSWORD = "forge-e2e-password";

function uniqueEmail(tag: string): string {
  return `e2e-review-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@techepitome.test`;
}

async function signUp(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Review Learner");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);
  return email;
}

/** The problem page collapses to tabs below the `lg` breakpoint. */
function isNarrow(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

/** Selects a problem-page pane, which is only a tab on narrow viewports. */
async function showPane(page: Page, pane: "Problem" | "Code" | "Results") {
  if (!isNarrow(page)) return;
  await page.getByRole("tab", { name: pane }).click();
}

async function completeAChapter(page: Page): Promise<void> {
  await page.goto("/learn/dsa/dsa-foundations/complexity-analysis/why-complexity-matters");
  await expect(
    page.getByRole("heading", { level: 1, name: "Why Complexity Matters" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark chapter complete" }).click();
  await expect(
    page.getByRole("button", { name: "Mark as not complete" })
  ).toBeVisible({ timeout: 30_000 });
}

test.afterAll(async () => {
  await closeDb();
});

test("a completed chapter becomes a review that can be recalled and rescheduled", async ({
  page,
}) => {
  test.slow();
  const email = await signUp(page, "loop");

  // ---- Nothing scheduled yet -------------------------------------------
  await page.goto("/review");
  await expect(page.getByText("Nothing scheduled for review yet")).toBeVisible();

  // ---- Completing a chapter schedules its key ideas ---------------------
  await completeAChapter(page);

  const created = await reviewItemsFor(email);
  expect(created).toHaveLength(1);
  expect(created[0]!.entityType).toBe("CHAPTER");
  expect(created[0]!.stage).toBe("NEW");
  // Scheduled for tomorrow, not now.
  expect(dueAtMs(created[0]!)).toBeGreaterThan(Date.now());

  // Nothing is due yet, and the page says so differently from "nothing
  // tracked" — the learner has work scheduled, just not right now.
  await page.goto("/review");
  await expect(
    page.getByRole("heading", { name: "Nothing due right now" })
  ).toBeVisible();

  // ---- A day passes ------------------------------------------------------
  expect(await makeReviewsDue(email, 1)).toBe(1);

  // ---- The dashboard surfaces it ----------------------------------------
  await page.goto("/dashboard");
  const dueCard = page.getByRole("link", { name: /Due for review/ });
  await expect(dueCard).toBeVisible();
  await expect(dueCard).toContainText("1 item");

  await dueCard.click();
  await page.waitForURL("**/review", { timeout: 30_000 });

  // ---- Recall comes before the answer -----------------------------------
  await expect(page.getByText("Concept")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: /From memory/ })
  ).toBeVisible();

  // The answer must not be on the page before it is asked for.
  await expect(page.getByText("Key takeaways")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Recalled/ })).toHaveCount(0);

  await page.getByRole("button", { name: /Show answer/ }).click();
  await expect(page.getByText("Key takeaways")).toBeVisible();

  // ---- Grading reschedules ----------------------------------------------
  await page.getByRole("button", { name: /Recalled/ }).click();
  await expect(
    page.getByRole("heading", { name: "Session complete" })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("1 review done")).toBeVisible();

  const graded = await reviewItemsFor(email);
  expect(graded).toHaveLength(1);
  expect(graded[0]!.stage).toBe("REVIEW");
  expect(graded[0]!.repetitions).toBe(1);
  expect(graded[0]!.totalReviews).toBe(1);
  expect(graded[0]!.lastGrade).toBe("GOOD");
  // Pushed into the future, so it leaves the queue.
  expect(dueAtMs(graded[0]!)).toBeGreaterThan(Date.now());

  // ---- It is gone from the queue, and the dashboard agrees --------------
  await page.goto("/review");
  await expect(
    page.getByRole("heading", { name: "Nothing due right now" })
  ).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /Due for review/ })).toHaveCount(0);
});

test("solving a problem schedules both the problem and its pattern", async ({
  page,
}) => {
  test.slow();
  const email = await signUp(page, "solve");

  await page.goto("/problems/running-altitude");
  await showPane(page, "Code");
  await expect(page.locator(".monaco-editor").first()).toBeVisible({ timeout: 60_000 });

  await page.evaluate((source) => {
    const monaco = (
      window as unknown as {
        monaco: { editor: { getModels: () => { setValue: (v: string) => void }[] } };
      }
    ).monaco;
    monaco.editor.getModels()[0]!.setValue(source);
  }, [
    "def highestAltitude(changes):",
    "    altitude = 0",
    "    highest = 0",
    "    for change in changes:",
    "        altitude += change",
    "        if altitude > highest:",
    "            highest = altitude",
    "    return highest",
  ].join("\n"));

  await page.getByRole("button", { name: "Submit" }).click();
  await showPane(page, "Results");
  await expect(page.getByText("8/8 tests")).toBeVisible({ timeout: 180_000 });

  // The problem and the pattern it teaches are different things worth
  // remembering, so both are scheduled.
  const items = await reviewItemsFor(email);
  const types = items.map((item) => item.entityType).sort();
  expect(types).toEqual(["PATTERN", "PROBLEM"]);
});

test("re-completing a chapter does not create a duplicate or reset the schedule", async ({
  page,
}) => {
  test.slow();
  const email = await signUp(page, "dupe");

  await completeAChapter(page);
  await makeReviewsDue(email, 1);

  // Grade it once so it has a schedule worth protecting.
  await page.goto("/review");
  await page.getByRole("button", { name: /Show answer/ }).click();
  await page.getByRole("button", { name: /Effortless/ }).click();
  await expect(
    page.getByRole("heading", { name: "Session complete" })
  ).toBeVisible({ timeout: 30_000 });

  const afterGrading = await reviewItemsFor(email);
  expect(afterGrading).toHaveLength(1);
  const scheduled = afterGrading[0]!;

  // Un-complete and re-complete the same chapter.
  await page.goto("/learn/dsa/dsa-foundations/complexity-analysis/why-complexity-matters");
  await page.getByRole("button", { name: "Mark as not complete" }).click();
  await expect(
    page.getByRole("button", { name: "Mark chapter complete" })
  ).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Mark chapter complete" }).click();
  await expect(
    page.getByRole("button", { name: "Mark as not complete" })
  ).toBeVisible({ timeout: 30_000 });

  const afterRecompletion = await reviewItemsFor(email);
  expect(afterRecompletion).toHaveLength(1);
  expect(afterRecompletion[0]!.id).toBe(scheduled.id);
  expect(afterRecompletion[0]!.dueAtIso).toBe(scheduled.dueAtIso);
  expect(afterRecompletion[0]!.intervalDays).toBe(scheduled.intervalDays);
});

test("a forgotten card comes back before the session ends", async ({ page }) => {
  test.slow();
  const email = await signUp(page, "forgot");

  await completeAChapter(page);
  await makeReviewsDue(email, 1);

  await page.goto("/review");
  await expect(page.getByText("1 of 1")).toBeVisible();

  await page.getByRole("button", { name: /Show answer/ }).click();
  await page.getByRole("button", { name: /Forgot/ }).click();

  // Requeued rather than dismissed: the session grows by one.
  await expect(page.getByText("2 of 2")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Back before the end of this session/)).toBeVisible();

  const items = await reviewItemsFor(email);
  expect(items[0]!.lapses).toBe(1);
  expect(items[0]!.stage).toBe("LEARNING");

  // Finish it properly the second time.
  await page.getByRole("button", { name: /Show answer/ }).click();
  await page.getByRole("button", { name: /Recalled/ }).click();
  await expect(
    page.getByRole("heading", { name: "Session complete" })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("2 reviews done")).toBeVisible();
});

test("one learner cannot reach another's review queue", async ({ page, browser }) => {
  test.slow();

  // Alice builds up a review item.
  const aliceEmail = await signUp(page, "alice");
  await completeAChapter(page);
  await makeReviewsDue(aliceEmail, 1);

  const aliceItems = await reviewItemsFor(aliceEmail);
  expect(aliceItems).toHaveLength(1);
  const aliceItemId = aliceItems[0]!.id;
  const aliceDueAt = aliceItems[0]!.dueAtIso;

  // Bob signs in fresh, in his own browser context.
  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  try {
    await signUp(bobPage, "bob");

    // Bob's queue is empty; Alice's card is not in it.
    await bobPage.goto("/review");
    await expect(bobPage.getByText("Nothing scheduled for review yet")).toBeVisible();

    const body = await bobPage.locator("body").innerText();
    expect(body).not.toContain(aliceItemId);

    // Bob's dashboard shows no due items either.
    await bobPage.goto("/dashboard");
    await expect(
      bobPage.getByRole("link", { name: /Due for review/ })
    ).toHaveCount(0);
  } finally {
    await bobContext.close();
  }

  // Alice's item is untouched.
  const after = await reviewItemsFor(aliceEmail);
  expect(after[0]!.dueAtIso).toBe(aliceDueAt);
  expect(after[0]!.totalReviews).toBe(0);
});

test("the review page works on a phone", async ({ page }) => {
  test.slow();
  const email = await signUp(page, "mobile");

  await completeAChapter(page);
  await makeReviewsDue(email, 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/review");

  // Reveal and rate, entirely through touch-sized controls.
  const reveal = page.getByRole("button", { name: /Show answer/ });
  await expect(reveal).toBeVisible();

  const revealBox = await reveal.boundingBox();
  expect(revealBox!.height).toBeGreaterThanOrEqual(36);

  await reveal.click();
  await expect(page.getByText("Key takeaways")).toBeVisible();

  const good = page.getByRole("button", { name: /Recalled/ });
  const goodBox = await good.boundingBox();
  expect(goodBox!.height, "rating controls must be touch-sized").toBeGreaterThanOrEqual(
    40
  );

  // No horizontal overflow at phone width.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, `overflows by ${overflow}px`).toBeLessThanOrEqual(2);

  await good.click();
  await expect(
    page.getByRole("heading", { name: "Session complete" })
  ).toBeVisible({ timeout: 30_000 });
});
