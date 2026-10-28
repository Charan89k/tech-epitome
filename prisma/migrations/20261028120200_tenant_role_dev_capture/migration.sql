-- Local development only; a no-op everywhere else.
--
-- `prisma dev` (the PGlite stand-in used for local work and tests) installs
-- a capture trigger on every table that writes into its own
-- `_prisma_dev_wal` schema. The trigger runs as the writing role, so a write
-- as te_tenant failed with "permission denied for schema _prisma_dev_wal"
-- and took the dev server down. Supabase and plain PostgreSQL have no such
-- schema, so nothing here runs there.
--
-- PGlite also serves every connection from ONE backend session, so the dev
-- server's own bookkeeping queries on that schema can run inside a tenant
-- transaction as te_tenant. Hence full access to its capture table, which
-- holds only the dev server's change feed.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = '_prisma_dev_wal')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'te_tenant') THEN
    GRANT USAGE ON SCHEMA _prisma_dev_wal TO te_tenant;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA _prisma_dev_wal TO te_tenant;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA _prisma_dev_wal TO te_tenant;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA _prisma_dev_wal TO te_tenant;
  END IF;
END $$;
