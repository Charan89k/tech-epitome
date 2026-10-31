import { expect, test } from "@playwright/test";

/**
 * The /learn catalogue: every track's courses, chapter search with filters,
 * and a usable empty state. Anonymous browsing is allowed, as on /learn/dsa.
 */

test("lists courses by track and searches chapters", async ({ page }) => {
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Courses", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "DSA", level: 2 })).toBeVisible();

  await page.getByLabel("Search chapters").fill("binary");
  await page.getByLabel("Track").selectOption("DSA");
  await page.getByRole("search").getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/q=binary/);
  const results = page.getByRole("region", { name: "Matching chapters" });
  await expect(results.getByRole("listitem").first()).toBeVisible();

  await results.getByRole("listitem").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/learn\/dsa\/.+\/.+\/.+/);
});

test("shows a clear empty state for a search with no matches", async ({ page }) => {
  await page.goto("/learn?q=zzzz-no-such-chapter");
  await expect(page.getByText("No chapters match")).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/learn$/);
});
