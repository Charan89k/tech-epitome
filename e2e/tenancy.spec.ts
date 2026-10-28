import { expect, test } from "@playwright/test";

import { closeDb, execSql, userIdFor } from "./db";
import { signUp } from "./helpers";

/**
 * Tenancy through the running app: real cookies, the real proxy, real
 * pages and route handlers. The service and RLS suites prove the rules;
 * this proves nothing between the browser and those rules weakens them.
 *
 * Operator actions (suspending an account, revoking a membership) are
 * applied directly in the database, exactly as the services would leave
 * it, so each test asserts what the NEXT request does with a session that
 * was valid a moment earlier.
 */

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test.afterAll(async () => {
  await closeDb();
});

async function createInstitution(tag: string): Promise<{ id: string; slug: string }> {
  const slug = `e2e-${tag}`;
  const [row] = await execSql<{ id: string }>(
    `INSERT INTO institutions (id, slug, name, "updatedAt") VALUES ($1, $2, $3, now()) RETURNING id`,
    [`inst_${tag}`, slug, `E2E College ${tag}`]
  );
  return { id: row!.id, slug };
}

async function addMember(
  institutionId: string,
  email: string,
  role: string
): Promise<string> {
  const userId = await userIdFor(email);
  const id = `mem_${unique()}`;
  await execSql(
    `INSERT INTO institution_memberships (id, "institutionId", "userId", role, source, "updatedAt")
     VALUES ($1, $2, $3, $4::"InstitutionRole", 'PLATFORM', now())`,
    [id, institutionId, userId, role]
  );
  return id;
}

test("campus pages require a signed-in user", async ({ page }) => {
  await page.goto("/campus");
  await expect(page).toHaveURL(/\/login\?next=%2Fcampus/);
});

test("a suspended account is signed out on its next request", async ({ page }) => {
  const email = await signUp(page, `suspend-${unique()}@techepitome.test`);
  await page.goto("/campus");
  await expect(page.getByRole("heading", { name: "Campus" })).toBeVisible();

  await execSql(
    `UPDATE users SET status = 'SUSPENDED', "suspendedAt" = now(), "sessionVersion" = "sessionVersion" + 1
     WHERE email = $1`,
    [email]
  );

  await page.goto("/campus");
  await expect(page).toHaveURL(/\/login\?.*ended=1/);
  await expect(page.getByRole("button", { name: /sign in/i }).first()).toBeVisible();
});

test("a revoked membership stops working on the next request", async ({ page }) => {
  const tag = unique();
  const inst = await createInstitution(tag);
  const email = await signUp(page, `member-${tag}@techepitome.test`);
  const membershipId = await addMember(inst.id, email, "STUDENT");

  await page.goto(`/campus/${inst.slug}`);
  await expect(page.getByRole("heading", { name: `E2E College ${tag}` })).toBeVisible();
  // A student sees no roster and no admin controls.
  await expect(page.getByRole("heading", { name: "Members" })).toHaveCount(0);

  await execSql(
    `UPDATE institution_memberships SET status = 'REVOKED', "revokedAt" = now() WHERE id = $1`,
    [membershipId]
  );
  // The shell streams (app/loading.tsx), so notFound() arrives after a 200
  // status line; what matters is that the workspace is gone.
  await page.goto(`/campus/${inst.slug}`);
  await expect(page.getByRole("heading", { name: `E2E College ${tag}` })).toHaveCount(
    0
  );
  await expect(
    page.getByRole("heading", { name: "That page does not exist" })
  ).toBeVisible();
});

test("another college's workspace and export read as not found", async ({ page }) => {
  const tag = unique();
  const inst = await createInstitution(tag);
  await signUp(page, `outsider-${tag}@techepitome.test`);

  await page.goto(`/campus/${inst.slug}`);
  await expect(page.getByRole("heading", { name: `E2E College ${tag}` })).toHaveCount(
    0
  );
  await expect(
    page.getByRole("heading", { name: "That page does not exist" })
  ).toBeVisible();

  const exportStatus = await page.evaluate(async (slug) => {
    const r = await fetch(`/campus/${slug}/members.csv`);
    return r.status;
  }, inst.slug);
  expect(exportStatus).toBe(404);
});

test("faculty can see the roster but not export it", async ({ page }) => {
  const tag = unique();
  const inst = await createInstitution(tag);
  const email = await signUp(page, `faculty-${tag}@techepitome.test`);
  await addMember(inst.id, email, "FACULTY");

  await page.goto(`/campus/${inst.slug}`);
  await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Export roster" })).toHaveCount(0);

  const exportStatus = await page.evaluate(async (slug) => {
    const r = await fetch(`/campus/${slug}/members.csv`);
    return r.status;
  }, inst.slug);
  expect(exportStatus).toBe(403);
});
