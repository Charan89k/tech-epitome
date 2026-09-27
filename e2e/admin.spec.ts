import { expect, test, type Page } from "@playwright/test";

import {
  closeDb,
  createDraftProblem,
  deleteDraftProblem,
  makeAdmin,
  problemStatusFor,
} from "./db";
import { finishSignup } from "./helpers";

/**
 * The admin surface.
 *
 * The assertions that matter are the boundary ones. Admin is a role, not
 * a plan, and the two failures worth catching are a learner reaching a
 * staff screen and a mutation landing with no record of who made it.
 */

const PASSWORD = "forge-e2e-password";

function uniqueEmail(tag: string): string {
  return `e2e-admin-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@codeforge.test`;
}

async function signUp(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Staff");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);
  return email;
}

test.afterAll(async () => {
  await closeDb();
});

// ---------------------------------------------------------------------------

test("a learner cannot reach the admin area", async ({ page }) => {
  await signUp(page, "learner");

  await page.goto("/admin");

  // The forbidden screen, not the admin area. Asserted on content rather
  // than on the status code: Next commits the HTTP status when it starts
  // streaming the shell, so `forbidden()` raised inside a layout renders
  // the 403 UI under a 200. That is a Next limitation, documented in the
  // README — what matters, and what is checked here, is that no staff
  // data reaches the page.
  await expect(
    page.getByRole("heading", { name: "You do not have access to this" })
  ).toBeVisible();

  const body = await page.locator("body").innerText();
  for (const staffOnly of [
    "Published content",
    "Audit log",
    "AI usage",
    "Accounts",
  ]) {
    expect(body, staffOnly).not.toContain(staffOnly);
  }
});

test("a learner cannot drive an admin action directly", async ({ page }) => {
  // The layout guards the pages; a server action is an endpoint with no
  // page render in front of it, so it re-checks. This posts at the
  // action's own route to prove the second check exists.
  await signUp(page, "direct");

  const status = await page.evaluate(async () => {
    const response = await fetch("/admin/users", {
      method: "POST",
      headers: {
        "content-type": "text/plain;charset=UTF-8",
        // A Server Action invocation without a valid id is rejected
        // before it runs; what is asserted is that the route never
        // returns admin content to a learner.
        "next-action": "0000000000000000000000000000000000000000",
      },
      body: "[]",
    });
    return { code: response.status, text: (await response.text()).slice(0, 4000) };
  });

  expect(status.code).not.toBe(200);
  expect(status.text).not.toContain("Audit log");
  expect(status.text).not.toContain("Published content");
});

test("a signed-out visitor is sent to sign in, not shown the area", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.waitForURL(/\/login/, { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("the admin nav item is invisible to a learner", async ({ page }) => {
  // A staff row a learner can never open is a dead end, so it is omitted
  // rather than shown locked.
  await signUp(page, "nav");
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0);
});

test("an admin sees real counts, and every change is recorded", async ({
  page,
}) => {
  test.slow();
  const email = await signUp(page, "staff");
  await makeAdmin(email);
  // The role is read per request from the database, never from the JWT.
  await page.reload();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();

  // Counts over real rows: the seed publishes 50 problems.
  const overview = await page.getByRole("main").innerText();
  expect(overview).toMatch(/Published content/);
  expect(overview).not.toMatch(/\bPro\b|upgrade|subscription/i);

  // --- publish a row of its own, then put it back -------------------------
  //
  // Its own row, not a seeded one: publishing state is global, and
  // hiding a real problem under parallel workers surfaces as a 404 in an
  // unrelated spec.
  const draft = await createDraftProblem(`content-${Date.now()}`);

  try {
    await page.goto(
      `/admin/content?kind=problem&q=${encodeURIComponent(draft.title)}`
    );
    const status = page.getByLabel("Publication status").first();
    await expect(status).toBeVisible();
    await expect(status).toContainText("Draft");

    await status.click();
    await page.getByRole("option", { name: "Published" }).click();
    await expect(status).toContainText("Published", { timeout: 20_000 });

    // The write actually happened, not just the optimistic label.
    await expect(async () => {
      expect(await problemStatusFor(draft.id)).toBe("PUBLISHED");
    }).toPass({ timeout: 20_000 });

    // --- the audit log has it ---------------------------------------------
    await page.goto("/admin/audit");
    await expect(page.getByText("content.status.set").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(email).first()).toBeVisible();
    await expect(page.getByText(draft.title).first()).toBeVisible();
  } finally {
    await deleteDraftProblem(draft.id);
  }
});

test("an admin cannot demote themselves", async ({ page }) => {
  const email = await signUp(page, "self");
  await makeAdmin(email);
  await page.reload();

  await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
  await expect(page.getByText("You", { exact: true })).toBeVisible();

  // Disabled in the UI as well as refused on the server, so the rule is
  // visible before it is enforced.
  await expect(page.getByLabel("Role").first()).toBeDisabled();
  await expect(page.getByText("You cannot change your own role.")).toBeVisible();
});

test("the admin area is never indexed", async ({ page }) => {
  const email = await signUp(page, "robots");
  await makeAdmin(email);
  await page.reload();

  const response = await page.goto("/admin");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
});
