import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

/**
 * Prisma client singleton.
 *
 * Next.js reloads modules on every edit in development, which would otherwise
 * open a new connection pool per reload until Postgres refuses connections.
 * Stashing the instance on globalThis keeps exactly one pool alive.
 *
 * Prisma 7 requires a driver adapter; `@prisma/adapter-pg` speaks the wire
 * protocol directly, which is also what makes this work on serverless.
 */
function createPrismaClient(): PrismaClient {
  const env = getEnv();

  // The pool is bounded explicitly. Serverless functions each get their own
  // pool, so an unbounded default multiplies across concurrent invocations
  // and exhausts Postgres' connection limit. DATABASE_POOL_MAX also lets the
  // local `prisma dev` stand-in, which is PGlite-backed and cannot service
  // concurrent connections, be pinned to 1.
  const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);

  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 10,
  });

  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? [{ emit: "stdout", level: "warn" }, { emit: "stdout", level: "error" }]
        : [{ emit: "stdout", level: "error" }],
  });
}

const globalForPrisma = globalThis as unknown as {
  codeforgePrisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.codeforgePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.codeforgePrisma = prisma;
}
