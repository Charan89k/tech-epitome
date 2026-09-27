import { expect, type Page } from "@playwright/test";

/**
 * Shared browser helpers.
 *
 * Separate from `db.ts`, which is for the two things a browser cannot do.
 * Everything here drives the real UI.
 */

export const PASSWORD = "forge-e2e-password";

/**
 * Finishes a signup that has just been submitted.
 *
 * A brand-new account lands on `/onboarding`, not the dashboard: five
 * optional questions, with a genuine skip. Every spec that signs up has
 * to get past it, and doing that in one place means the next change to
 * the post-signup route is one edit rather than eight.
 *
 * Skips rather than answers, because a spec about the tutor should not
 * depend on what onboarding asks.
 */
export async function finishSignup(page: Page): Promise<void> {
  await page.waitForURL(/\/(onboarding|dashboard)(\?.*)?$/, { timeout: 30_000 });

  if (page.url().includes("/onboarding")) {
    await page.getByRole("button", { name: "Skip" }).click();
    await page.waitForURL(/\/dashboard(\?.*)?$/, { timeout: 30_000 });
  }
}

/**
 * Registers a fresh account through the real signup flow and lands on the
 * dashboard, past onboarding.
 */
export async function signUp(
  page: Page,
  email: string,
  name = "Learner"
): Promise<string> {
  await page.goto("/signup");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);
  return email;
}

/** Waits for the app shell to be interactive. */
export async function expectShell(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible({
    timeout: 30_000,
  });
}
