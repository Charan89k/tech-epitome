import { expect, test, type Page } from "@playwright/test";

/**
 * The SQL playground, against the real PostgreSQL build in a browser worker.
 * Signed out on purpose: no account and no server are involved.
 */
async function ready(page: Page) {
  await page.goto("/sql");
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeEnabled({
    timeout: 120_000,
  });
  await expect(page.locator(".monaco-editor").first()).toBeVisible({ timeout: 60_000 });
}

async function setQuery(page: Page, sql: string) {
  await page.locator(".monaco-editor .view-lines").first().click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText(sql);
}

const run = (page: Page) =>
  page.getByRole("button", { name: "Run", exact: true }).click();
const output = (page: Page) => page.getByRole("region", { name: "Output" });

test("runs a query, reports errors, and resets changed data", async ({ page }) => {
  test.slow();
  await ready(page);
  await expect(
    page.getByRole("region", { name: "Tables" }).getByText("books", { exact: true })
  ).toBeVisible();

  await run(page);
  await expect(output(page).getByText("8 rows")).toBeVisible();
  await expect(
    output(page).getByRole("cell", { name: "A Short Walk North" })
  ).toBeVisible();

  await setQuery(page, "SELECT nope FROM books;");
  await run(page);
  await expect(output(page).getByRole("alert")).toContainText(
    'column "nope" does not exist'
  );

  await setQuery(page, "DELETE FROM loans;");
  await run(page);
  await expect(output(page).getByText("9 rows changed")).toBeVisible();

  await setQuery(page, "SELECT * FROM loans;");
  await run(page);
  await expect(output(page).getByText("0 rows")).toBeVisible();

  await page.getByRole("button", { name: "Reset data" }).click();
  await expect(output(page).getByText("back to its starting state")).toBeVisible({
    timeout: 120_000,
  });
  await run(page);
  await expect(output(page).getByText("9 rows")).toBeVisible();
});

test("an exercise refuses a wrong answer, accepts a right one, and remembers it", async ({
  page,
}) => {
  test.slow();
  await ready(page);

  await page.getByRole("button", { name: /Science titles/ }).click();
  await setQuery(page, "SELECT title FROM books;");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Expected 3 rows, got 8.")).toBeVisible();

  await setQuery(page, "SELECT title AS name FROM books WHERE genre = 'Science';");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Solved")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Solved")).toBeVisible({ timeout: 120_000 });
});

test("a runaway query is stopped and the playground recovers", async ({ page }) => {
  test.slow();
  await ready(page);

  await setQuery(page, "SELECT count(*) FROM generate_series(1, 1000000000000);");
  await run(page);
  await expect(output(page).getByText("ran for over 10 seconds")).toBeVisible({
    timeout: 150_000,
  });
  await setQuery(page, "SELECT 1 + 1 AS two;");
  await run(page);
  await expect(
    output(page).getByRole("cell", { name: "2", exact: true })
  ).toBeVisible();
});

test("queries never leave the browser", async ({ page }) => {
  test.slow();
  await ready(page);
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") posts.push(request.url());
  });

  await setQuery(page, "SELECT 'private text' AS note;");
  await run(page);
  await expect(output(page).getByRole("cell", { name: "private text" })).toBeVisible();

  expect(posts).toEqual([]);
});
