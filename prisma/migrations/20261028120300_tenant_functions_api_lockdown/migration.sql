-- Keep the tenancy functions off Supabase's Data API.
--
-- `REVOKE ... FROM PUBLIC` in the previous migration does not remove grants
-- that Supabase's default privileges give its `anon` and `authenticated`
-- roles directly, which would expose the definer lookups as
-- /rest/v1/rpc/te_institution_for_domain. The role checks keep this a no-op
-- on plain PostgreSQL and the Prisma dev database.

DO $$
DECLARE
  api_role text;
  fn text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      FOREACH fn IN ARRAY ARRAY[
        'te_institution_for_domain(text)',
        'te_invitation_institution(text)',
        'te_institution_id()',
        'te_user_id()',
        'te_is_platform_admin()',
        'te_audit_log_append_only()'
      ] LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM %I', fn, api_role);
      END LOOP;
    END IF;
  END LOOP;
END $$;
