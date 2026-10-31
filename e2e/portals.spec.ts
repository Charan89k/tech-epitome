import { expect, test } from "@playwright/test";

import { closeDb, joinTestCollege } from "./db";
import { signUp } from "./helpers";

/**
 * Learn and Campus are separate products with separate doors. These prove the
 * doors exist, and that a door grants nothing.
 */
const email = (tag: string) =>
  `e2e-portal-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e5)}@techepitome.test`;

test.afterAll(async () => {
  await closeDb();
});

test("the landing page offers both products", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Enter Campus" }).click();
  await expect(page).toHaveURL(/\/campus\/login$/);
  await expect(page.getByRole("heading", { name: "Enter Campus" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("main").getByRole("link", { name: "Explore Learn" }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole("heading", { name: "Live Visualizer" })).toBeVisible();
});

test("Campus has separate student and teacher sign-in pages", async ({ page }) => {
  await page.goto("/campus/login");
  await page.getByRole("link", { name: /I am a student/ }).click();
  await expect(page.getByRole("heading", { name: "Student sign in" })).toBeVisible();

  await page.goto("/campus/login");
  await page.getByRole("link", { name: /I teach here/ }).click();
  await expect(
    page.getByRole("heading", { name: "Teacher and faculty sign in" })
  ).toBeVisible();

  // No self-service role: nothing here creates an account or offers a role.
  await expect(page.getByRole("link", { name: "Create an account" })).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
});

test("each protected area sends a visitor to its own sign-in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);
  await expect(
    page.getByRole("heading", { name: "Administrator sign in" })
  ).toBeVisible();

  await page.goto("/interviews");
  await expect(page).toHaveURL(/\/campus\/login\?next=%2Finterviews/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  await expect(page).not.toHaveURL(/campus|admin/);
});

test("a learner with no membership is refused at both Campus doors", async ({
  page,
}) => {
  test.slow();
  await signUp(page, email("learner"));
  for (const door of ["student", "teacher"]) {
    await page.goto(`/campus/enter/${door}`);
    await expect(
      page.getByRole("heading", { name: /has no .* membership/ })
    ).toBeVisible();
  }
  // Public Learn needs no college.
  await page.goto("/problems");
  await expect(
    page.getByRole("heading", { name: "Problems", exact: true })
  ).toBeVisible();
});

test("changing the URL gives a student no teacher access", async ({ page }) => {
  test.slow();
  const address = email("student");
  await signUp(page, address);
  await joinTestCollege(address);

  await page.goto("/campus/enter/student");
  await expect(page).toHaveURL(/\/campus\/e2e-college-/);
  const slug = new URL(page.url()).pathname.split("/")[2];

  await page.goto("/campus/enter/teacher");
  await expect(
    page.getByRole("heading", { name: /has no faculty membership/ })
  ).toBeVisible();

  await page.goto(`/campus/${slug}/banks`);
  await expect(page.getByRole("heading", { name: /Question banks/i })).toHaveCount(0);
  await page.goto(`/campus/${slug}`);
  await expect(page.getByRole("link", { name: "Question Banks" })).toHaveCount(0);
});

test("Campus and Learn show different navigation", async ({ page, isMobile }) => {
  test.skip(
    isMobile,
    "The rail is desktop-only; the mobile sheet reads the same data."
  );
  test.slow();
  const address = email("nav");
  await signUp(page, address);
  await joinTestCollege(address);

  await page.goto("/campus");
  const rail = page.getByRole("complementary", { name: "Navigation" });
  await expect(rail.getByRole("link", { name: "Aptitude" })).toBeAttached();
  await expect(rail.getByRole("link", { name: "Leaderboard" })).toHaveCount(0);

  await page.goto("/explore");
  await expect(rail.getByRole("link", { name: "Leaderboard" })).toBeAttached();
  await expect(rail.getByRole("link", { name: "Mock Interviews" })).toHaveCount(0);
});

test("aptitude grades on the server and explains each answer", async ({ page }) => {
  test.slow();
  const address = email("aptitude");
  await signUp(page, address);
  await joinTestCollege(address);

  await page.goto("/campus/aptitude?topic=logical");
  await page.getByRole("radio", { name: "42" }).check();
  await page.getByRole("button", { name: "Check my answers" }).click();
  await expect(page.getByText(/You got 1 of 8/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("These are n(n + 1)")).toBeVisible();
});

test("Learn pages work signed out", async ({ page }) => {
  for (const [path, heading] of [
    ["/daily", "Today's problem"],
    ["/contests", "Contests"],
    ["/leaderboard", "Leaderboard"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }
  await page.goto("/u/nobody-at-all");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /does not exist|not found/i
  );
});

test("the password reset page never says whether an account exists", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email("unknown"));
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If that address has an account/)).toBeVisible({
    timeout: 30_000,
  });
});

test("a bad reset link is refused", async ({ page }) => {
  await page.goto("/reset-password/not-a-real-token-at-all-123456");
  await page.getByLabel("New password").fill("a-long-enough-password");
  await page.getByLabel("Repeat it").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page.getByText(/expired or was already used/)).toBeVisible({
    timeout: 30_000,
  });
});

test("the new visualizations play", async ({ page }) => {
  for (const key of [
    "dijkstra",
    "n-queens",
    "longest-common-subsequence",
    "min-heap",
  ]) {
    await page.goto(`/visualize/${key}`);
    await expect(page.getByRole("button", { name: /play/i }).first()).toBeVisible();
  }
});
