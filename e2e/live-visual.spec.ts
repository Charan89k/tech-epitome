import { expect, test, type Page } from "@playwright/test";

/**
 * The live visualizer, in a real browser.
 *
 * The learner's code runs in a worker — Python on Pyodide, JavaScript
 * instrumented — under the trace worker's own Content-Security-Policy. Unit
 * tests cover the tracer and the instrumenter; only a browser can show that
 * the worker loads, the policy admits it, and the picture follows the code.
 *
 * Python downloads Pyodide from its CDN on first use, hence the long
 * timeouts. No account is needed: problems and tracing are public.
 */

const SLUG = "compact-the-queue";

const PYTHON = `def compactQueue(tickets):
    write = 0
    for value in tickets:
        if value != 0:
            tickets[write] = value
            write += 1
    return write
`;

const JAVASCRIPT = `function compactQueue(tickets) {
  let write = 0;
  for (const value of tickets) {
    if (value !== 0) {
      tickets[write] = value;
      write++;
    }
  }
  return write;
}
`;

async function seedDraft(page: Page, language: "PYTHON" | "JAVASCRIPT", code: string) {
  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // A refused write just leaves the starter code, and the test fails loudly.
      }
    },
    [`tech-epitome:draft:${SLUG}:${language}`, code] as const
  );
}

test.describe("live visualizer", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 1024, "desktop layout");

  test("draws the example input before anything runs", async ({ page }) => {
    await page.goto(`/problems/${SLUG}`);
    // The statement's example carries the input as a picture.
    await expect(page.getByRole("region", { name: "tickets" }).first()).toBeVisible();
  });

  test("traces Python step by step and checks the output", async ({ page }) => {
    test.setTimeout(150_000);
    await seedDraft(page, "PYTHON", PYTHON);
    await page.goto(`/problems/${SLUG}`);

    await page.getByRole("button", { name: "Visualize" }).click();
    await expect(page.getByText(/Step \d+ of \d+/)).toBeVisible({ timeout: 120_000 });

    await page.getByRole("button", { name: "Last step" }).click();
    await expect(page.getByText("Matches", { exact: true })).toBeVisible();
    // The write pointer is drawn under the array.
    await expect(
      page.getByRole("region", { name: "tickets" }).getByText("write")
    ).toBeVisible();
  });

  test("traces JavaScript and steps backwards", async ({ page }) => {
    test.setTimeout(60_000);
    await seedDraft(page, "JAVASCRIPT", JAVASCRIPT);
    await page.goto(`/problems/${SLUG}`);

    await page.getByRole("combobox", { name: "Language" }).click();
    await page.getByRole("option", { name: "JavaScript" }).click();
    await page.getByRole("button", { name: "Visualize" }).click();

    const counter = page.getByTestId("trace-counter");
    await expect(counter).toHaveText(/^\d+\/\d+$/, { timeout: 30_000 });
    await page.getByRole("button", { name: "Last step" }).click();
    await expect(page.getByText("Matches", { exact: true })).toBeVisible();

    const [, total] = (await counter.textContent())!.split("/");
    await page.getByRole("button", { name: "Previous step" }).click();
    await expect(counter).toHaveText(`${Number(total) - 1}/${total}`);
  });
});
