import { expect, test, type Page } from "@playwright/test";

/**
 * Run with custom input, through the real editor, server action, harness
 * and executor.
 *
 * Signed out on purpose: Run is open to visitors, and the custom input
 * must follow the same rules for them — validated against the signature,
 * run through the problem's own harness, reported as output not a verdict.
 */

function isNarrow(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

async function showPane(page: Page, pane: "Code" | "Results") {
  if (!isNarrow(page)) return;
  await page.getByRole("tab", { name: pane }).click();
}

async function typeSolution(page: Page, source: string) {
  await showPane(page, "Code");
  await expect(page.locator(".monaco-editor").first()).toBeVisible({ timeout: 60_000 });
  // One line, inserted rather than typed, so neither auto-indent nor
  // bracket auto-close can change it (see learning-loop.spec.ts).
  await page.locator(".monaco-editor .view-lines").first().click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText(source);
}

async function useCustomInput(page: Page, input: string) {
  await showPane(page, "Results");
  await page.getByLabel("Run with custom input").click();
  const box = page.getByRole("textbox", { name: "Custom input" });
  await expect(box).toBeVisible();
  await box.fill(input);
}

test("runs the learner's function on their own input and shows its output", async ({
  page,
}) => {
  test.slow();
  await page.goto("/problems/running-altitude");
  await typeSolution(page, "def highestAltitude(changes): return sum(changes) * 10");
  await useCustomInput(page, "1 2 3");

  // The format hint comes from the problem's signature.
  await expect(page.getByText(/one line of space-separated integers/)).toBeVisible();

  await showPane(page, "Code");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await showPane(page, "Results");

  await expect(page.getByText("Finished").first()).toBeVisible({ timeout: 180_000 });
  await expect(page.getByText("Custom input", { exact: true })).toBeVisible();
  await expect(page.getByText("60", { exact: true })).toBeVisible();
  // No expected value exists for a custom input, and none is invented.
  await expect(page.getByText("Expected", { exact: true })).toHaveCount(0);
});

test("refuses input that does not match the problem's format", async ({ page }) => {
  test.slow();
  await page.goto("/problems/running-altitude");
  await typeSolution(page, "def highestAltitude(changes): return 0");
  await useCustomInput(page, "1 two 3");

  await showPane(page, "Code");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await showPane(page, "Results");

  await expect(page.getByText(/Line 1 \(changes\): expected space-separated integers/)).toBeVisible({
    timeout: 60_000,
  });
});
