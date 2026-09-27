import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Unit and component tests.
 *
 * No @vitejs/plugin-react: Vitest's own transform handles the automatic JSX
 * runtime, and the plugin's remaining value here would be Fast Refresh,
 * which tests do not use. Dropping it also keeps the dependency tree off
 * Babel 8, which conflicts with the shadcn CLI's Babel 7.
 *
 * End-to-end tests live in e2e/ and run under Playwright, so they are
 * excluded.
 */
export default defineConfig({
  resolve: {
    // Native replacement for vite-tsconfig-paths; picks up the "@/*" alias
    // straight from tsconfig.json.
    tsconfigPaths: true,
    alias: {
      "server-only": resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],

    /**
     * Test files run one at a time.
     *
     * Vitest gives each worker its own module registry, so each one builds
     * its own Prisma client and opens its own connection. Against real
     * PostgreSQL that is fine. Against the local `prisma dev` stand-in it
     * is not: PGlite cannot service concurrent connections, and the wire
     * protocol desynchronises into "bind message supplies N parameters,
     * but prepared statement requires 0" — a confused connection, reported
     * as a query error. See README "Known limitations".
     *
     * This is a constraint of the development database, not of the tests.
     * Set `VITEST_FILE_PARALLELISM=true` against real PostgreSQL to get
     * the parallelism back.
     *
     * The alternative — retrying failed queries inside the suite — was
     * rejected: it would let a genuinely flaky query masquerade as the
     * stand-in misbehaving, which is precisely the bug class these
     * integration tests exist to catch.
     */
    fileParallelism: process.env.VITEST_FILE_PARALLELISM === "true",

    /**
     * One database connection per worker, for the same reason.
     *
     * Serial *files* was not enough: a single test that fans out with
     * `Promise.all` still opens several connections from the pool, and
     * PGlite desynchronises on the second one. Playwright's config
     * already pins this for the dev server; the unit suite talks to the
     * same database and needs the same pin.
     *
     * Overridable, so a run against real PostgreSQL gets a real pool.
     */
    env: {
      DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX ?? "1",
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      exclude: [
        "src/generated/**",
        "src/components/ui/**",
        "tests/stubs/**",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
  },
});
