import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * End-to-end tests.
 *
 * Runs against a real dev server on its own port so it never collides with
 * a server the developer already has open on 3000. The suite talks to the
 * real database - these tests exist to prove the flows work end to end, and
 * mocking the database would defeat that. Every test creates its own user
 * with a unique email so runs stay independent.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Capped deliberately: these tests run real code through the executor,
  // so unlimited workers means several Python and JVM processes competing
  // for the same cores and timing out on contention rather than on a bug.
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI ? "github" : "list",

  // The default 30s is for a page test. These are journeys: each one
  // registers an account, and several stream from a model or run code in
  // a sandbox. Under three workers competing for the same dev server, a
  // slow-but-correct run was failing on the clock rather than on a bug.
  timeout: 60_000,

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    // RATE_LIMIT_DISABLED is honoured only outside production (see
    // src/lib/rate-limit.ts). The suite registers many throwaway accounts
    // from a single IP, which the signup policy exists to prevent.
    command: `npx next dev --port ${PORT}`,
    env: {
      RATE_LIMIT_DISABLED: "true",
      // See src/lib/db/prisma.ts. Harmless against real Postgres.
      DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX ?? "1",
      // The tutor streams from a deterministic double, so the suite needs
      // neither an API key nor a local model, and assertions about what
      // the context builder sent are stable. `src/lib/ai/mock.ts` refuses
      // to load in production, and `src/lib/env.ts` rejects this value
      // there, so it cannot escape the test environment.
      AI_PROVIDER: process.env.AI_PROVIDER ?? "mock",
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
