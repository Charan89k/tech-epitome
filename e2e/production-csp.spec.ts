import { expect, test } from "@playwright/test";

/**
 * Regression guard for a bug that broke the entire site silently.
 *
 * The Content-Security-Policy nonce has to be set on the *request* headers
 * in proxy.ts, because that is how Next discovers it and stamps it onto the
 * script tags it emits. Setting it only on the response leaves Next's
 * bootstrap script unnonced, the browser refuses to execute it, and the page
 * never hydrates - the HTML still looks perfectly correct while every button
 * on the site does nothing.
 *
 * CSP is production-only (Turbopack's dev HMR needs inline scripts), so this
 * spec needs a production server and is skipped unless one is running:
 *
 *   npm run build && npx next start --port 3200
 *   PROD_URL=http://127.0.0.1:3200 npx playwright test e2e/production-csp
 */
const PROD_URL = process.env.PROD_URL;

test.describe("production CSP", () => {
  test.skip(
    !PROD_URL,
    "Set PROD_URL to a running production build to run this check."
  );

  test("serves a nonce and still hydrates", async ({ page }) => {
    const base = PROD_URL!;
    const violations: string[] = [];

    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /Content Security Policy/i.test(message.text())
      ) {
        violations.push(message.text());
      }
    });

    const response = await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp, "CSP header must be present in production").toMatch(
      /nonce-[a-f0-9]{32}/
    );
    expect(csp).toContain("strict-dynamic");
    expect(csp).toContain("frame-ancestors 'none'");

    // Radix's mobile sheet is entirely client-driven. If it opens, React
    // hydrated and event handlers are live under the policy above.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });

    // A controlled input proves client state is running too.
    await page.goto(`${base}/signup`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email").fill("hydration@techepitome.test");
    await expect(page.getByLabel("Email")).toHaveValue(
      "hydration@techepitome.test"
    );

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
