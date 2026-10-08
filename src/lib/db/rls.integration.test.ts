import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";

/**
 * Every application table keeps row-level security on.
 *
 * In production the database is Supabase, which serves the public schema
 * over its Data API to the `anon` and `authenticated` roles. Tech Epitome
 * never uses that API — Prisma connects as the table owner, which RLS does
 * not apply to — so RLS with no policies is what keeps the API from reading
 * or writing anything. The 20261008150000_lock_down_data_api migration
 * turned it on for every table that existed then; a table added later does
 * not inherit it. This fails until that table's migration includes
 *
 *   ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;
 */
describe("row-level security", () => {
  it("is enabled on every table in the public schema", async () => {
    const rows = await prisma.$queryRaw<{ table: string }[]>`
      SELECT c.relname AS "table"
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p')
        AND NOT c.relrowsecurity
      ORDER BY c.relname
    `;

    expect(rows.map((r) => r.table)).toEqual([]);
  });
});
