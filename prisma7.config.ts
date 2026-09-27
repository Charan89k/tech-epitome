import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // Only needed for `migrate dev`, which diffs against a throwaway
    // database. Managed Postgres providers that disallow CREATE DATABASE
    // require this to be set explicitly; docker-compose does not.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
