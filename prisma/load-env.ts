import { config as loadEnvFile } from "dotenv";

/**
 * Loads `.env*` files for the things Next.js does not load them for: the
 * Prisma CLI (via prisma7.config.ts) and the seed script.
 *
 * The order mirrors Next.js exactly, so `prisma migrate status` and the
 * running application can never disagree about which database they mean:
 *
 *   NODE_ENV=production   .env.production.local → .env.local → .env
 *   NODE_ENV=test         .env.test.local       →            → .env
 *   otherwise             .env.development.local → .env.local → .env
 *
 * `dotenv` never overwrites a variable that is already set, and the files
 * are read highest-priority first, so an exported variable — a Vercel or CI
 * environment variable, or `DATABASE_URL=... npx prisma ...` — beats every
 * file, and `.env` stays the fallback it has always been.
 *
 * The practical effect: day-to-day commands keep talking to docker-compose,
 * and `NODE_ENV=production` is the one switch that points them at the
 * hosted database. `.env.local` is deliberately skipped under `test` for
 * the same reason Next.js skips it — a test run must not pick up a personal
 * override and quietly wipe the wrong database.
 */
export function loadEnv(): void {
  const mode = process.env.NODE_ENV ?? "development";
  const files =
    mode === "test"
      ? [".env.test.local", ".env.test", ".env"]
      : [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"];

  for (const path of files) loadEnvFile({ path, quiet: true });
}
