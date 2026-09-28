import { expect, test, type Page } from "@playwright/test";
import { finishSignup } from "./helpers";

/**
 * "Start Mock Interview" — the whole path, for every interview type.
 *
 * The bug this guards against was not in the button. Difficulty was an
 * exact filter over published briefs, and the catalogue has no hard system
 * design brief and no hard low-level design brief, so choosing Hard for
 * either type found nothing and the form showed an error instead of
 * starting an interview. The form defaults to Medium, so the existing
 * coverage walked straight past it.
 *
 * This spec therefore drives the *offered* difficulties rather than the
 * default, and asserts an interview actually opens: a session id in the
 * URL, the room rendered, and the interviewer's first state on screen.
 *
 * The brief panel is deliberately NOT asserted here. It renders only once
 * the interviewer has taken its first turn, because presenting the problem
 * in its own words is that turn's whole job — so at INTRO its absence is
 * correct, and asserting it would be asserting the model, not the flow.
 */

const TYPES = [
  "Coding (DSA)",
  "Behavioural",
  "System design",
  "Low-level design",
] as const;

function uniqueEmail(tag: string): string {
  return `e2e-iv-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@techepitome.test`;
}

const PASSWORD = "forge-e2e-password";

async function signUp(page: Page, tag: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Interview Candidate");
  await page.getByLabel("Email").fill(uniqueEmail(tag));
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);
}

/** Selects a type and returns every difficulty the form offers for it. */
async function offeredDifficulties(page: Page, type: string): Promise<string[]> {
  await page.getByLabel("Interview type").click();
  await page.getByRole("option", { name: type, exact: true }).click();

  const difficulty = page.getByLabel("Difficulty");
  if ((await difficulty.count()) === 0) return []; // Behavioural has none.

  // Let the availability round trip settle before reading the options.
  await expect(difficulty).toBeVisible();
  await difficulty.click();
  const options = await page.getByRole("option").allInnerTexts();
  await page.keyboard.press("Escape");
  return options.map((text) => text.trim()).filter(Boolean);
}

test.describe("starting an interview", () => {
  test("every type starts at every difficulty the form offers", async ({ page }) => {
    test.slow();
    await signUp(page, "matrix");

    for (const type of TYPES) {
      await page.goto("/interviews");

      const levels = await offeredDifficulties(page, type);
      // Behavioural returns [] and is driven once with no difficulty.
      //
      // Driving the *offered* list is what makes this a regression test:
      // if the form ever advertises a level the catalogue cannot serve,
      // this loop starts it and fails. The service-level semantics of
      // availability are pinned in
      // src/services/interview-briefs.integration.test.ts, so they are not
      // re-driven through the browser here.
      const runs = levels.length > 0 ? levels : [null];

      for (const level of runs) {
        await page.goto("/interviews");
        await page.getByLabel("Interview type").click();
        await page.getByRole("option", { name: type, exact: true }).click();

        if (level) {
          await page.getByLabel("Difficulty").click();
          await page.getByRole("option", { name: level, exact: true }).click();
        }

        await page.getByRole("button", { name: "Start interview" }).click();

        // A session exists and we are in it, rather than sitting on the
        // form looking at an error.
        await page.waitForURL(/\/interviews\/[a-z0-9]+$/, { timeout: 30_000 });
        await expect(
          page.getByTestId("interview-room"),
          `${type} / ${level ?? "no difficulty"}`
        ).toBeVisible({ timeout: 30_000 });

        // The interviewer has an opening state: the machine's stepper is
        // rendered, which only happens once a stage exists on the session.
        await expect(page.getByLabel("Interview progress")).toBeVisible();
      }
    }
  });

  test("an interview survives a refresh", async ({ page }) => {
    await signUp(page, "refresh");
    await page.goto("/interviews");
    await page.getByRole("button", { name: "Start interview" }).click();
    await page.waitForURL(/\/interviews\/[a-z0-9]+$/, { timeout: 30_000 });

    const url = page.url();
    await page.reload();

    // Same session, still in progress - the stage lives on the server.
    expect(page.url()).toBe(url);
    await expect(page.getByTestId("interview-room")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Interview progress")).toBeVisible();
  });

  test("one candidate cannot open another's interview", async ({ browser }) => {
    // Ownership is enforced in the query that loads the session, so a
    // known id belonging to somebody else resolves to nothing.
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await signUp(ownerPage, "owner");
    await ownerPage.goto("/interviews");
    await ownerPage.getByRole("button", { name: "Start interview" }).click();
    await ownerPage.waitForURL(/\/interviews\/[a-z0-9]+$/, { timeout: 30_000 });
    const victimUrl = ownerPage.url();
    await ownerContext.close();

    const intruderContext = await browser.newContext();
    const intruderPage = await intruderContext.newPage();
    await signUp(intruderPage, "intruder");
    await intruderPage.goto(victimUrl);

    await expect(intruderPage.getByTestId("interview-room")).toHaveCount(0);
    await expect(intruderPage.getByLabel("Interview progress")).toHaveCount(0);
    await intruderContext.close();
  });
});
