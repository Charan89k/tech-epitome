import { defineConfig } from "prisma/config";

import { loadEnv } from "./prisma/load-env";

loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL, not DATABASE_URL. The application runs through Supabase's
    // transaction pooler, which hands back a different backend per
    // transaction; the migration engine needs one session it can hold an
    // advisory lock on and run DDL in, so it takes the direct connection.
    // Locally there is only one database and no DIRECT_URL, so DATABASE_URL
    // stands in and nothing about the existing workflow changes.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
    // Only needed for `migrate dev`, which diffs against a throwaway
    // database. Managed Postgres providers that disallow CREATE DATABASE
    // require this to be set explicitly; docker-compose does not.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
