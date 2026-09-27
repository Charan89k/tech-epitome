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
