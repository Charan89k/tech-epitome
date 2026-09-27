import { expect, test } from "@playwright/test";
import { finishSignup } from "./helpers";

/**
 * The account flow, which every other flow depends on.
 *
 * Each test registers its own user so the suite can run in parallel and
 * repeatedly without a cleanup step.
 */

function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@codeforge.test`;
}

const PASSWORD = "forge-e2e-password";

test("a visitor can sign up, and lands in onboarding first", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel("Name").fill("E2E Learner");
  await page.getByLabel("Email").fill(uniqueEmail("signup"));
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  // A brand-new account goes to onboarding, not straight to the dashboard.
  await page.waitForURL(/\/onboarding$/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Before you start" })
  ).toBeVisible();

  // Every question is optional, and skipping reaches the dashboard.
  await page.getByRole("button", { name: "Skip" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })
  ).toBeVisible();
});

test("signing up on the way somewhere lands there, not in onboarding", async ({
  page,
}) => {
  // "Sign up to save this note" must not lose the thing they wanted.
  await page.goto("/signup?next=%2Fproblems");

  await page.getByLabel("Name").fill("E2E Learner");
  await page.getByLabel("Email").fill(uniqueEmail("signup-next"));
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL(/\/problems$/, { timeout: 30_000 });
});

test("signing up then out then back in returns the same account", async ({
  page,
}) => {
  const email = uniqueEmail("roundtrip");

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Round Trip");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/$/, { timeout: 30_000 });

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await finishSignup(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /Round$/ })
  ).toBeVisible();
});

test("a wrong password is rejected without revealing whether the email exists", async ({
  page,
}) => {
  const email = uniqueEmail("wrongpass");

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Wrong Pass");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/$/, { timeout: 30_000 });

  // Existing account, wrong password.
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByText("That email and password combination is not correct.")
  ).toBeVisible();

  // Account that does not exist: the message must be identical, or the form
  // becomes an account-enumeration oracle.
  await page.goto("/login");
  await page.getByLabel("Email").fill(uniqueEmail("nobody"));
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByText("That email and password combination is not correct.")
  ).toBeVisible();
});

test("signing up with an already registered email is refused", async ({ page }) => {
  const email = uniqueEmail("dupe");

  await page.goto("/signup");
  await page.getByLabel("Name").fill("First Owner");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/$/, { timeout: 30_000 });

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Second Owner");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  // Reported against the email field, not as a form-level error.
  await expect(
    page.getByText("An account already exists for this email.")
  ).toBeVisible();
});

test("a protected page redirects to login and returns after signing in", async ({
  page,
}) => {
  const email = uniqueEmail("returnto");

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Return To");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/$/, { timeout: 30_000 });

  await page.goto("/settings");
  await page.waitForURL("**/login?next=%2Fsettings", { timeout: 30_000 });

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // The point of the `next` parameter: land where they were headed.
  await page.waitForURL("**/settings", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});
