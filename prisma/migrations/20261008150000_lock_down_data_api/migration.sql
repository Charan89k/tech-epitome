-- Close Supabase's Data API (PostgREST) over every application table.
--
-- Supabase exposes the public schema over REST to its `anon` and
-- `authenticated` roles, and tables created by migrations arrive with RLS
-- off and full grants to both. Tech Epitome never uses that API: the app
-- reaches the database through Prisma as the table owner, which RLS does not
-- apply to. So RLS goes on with no policies (deny everything to non-owners)
-- and the API roles lose their grants outright, now and for future tables.
--
-- The role checks keep this runnable on plain PostgreSQL and the Prisma dev
-- database, where those Supabase roles do not exist.
--
-- New tables still need RLS enabled in their own migration;
-- src/lib/db/rls.integration.test.ts fails if one is missed.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
  END IF;
END $$;
