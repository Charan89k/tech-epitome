-- Institution tenancy, part 2: a least-privilege role and row-level security.
--
-- The application still connects as the table owner (RLS does not apply to
-- an owner). Every institution-scoped read and write instead runs inside
-- src/lib/tenancy/scope.ts, which opens a transaction and executes
--
--   SET LOCAL ROLE te_tenant;
--   SELECT set_config('app.institution_id', $1, true), ...;
--
-- Both are transaction-local, so they end at COMMIT/ROLLBACK and a pooled
-- connection (Supabase's transaction pooler included) cannot carry one
-- request's tenant into the next. te_tenant is not an owner, not a
-- superuser and has no BYPASSRLS, so the policies below bind it: a query
-- that forgets its WHERE "institutionId" = ... still sees only the current
-- institution. It can read four columns of `users` and nothing of anyone's
-- personal learning data, and it has no DELETE anywhere.
--
-- Rehearse on a Supabase branch before production: the GRANT to
-- CURRENT_USER is what lets the pooled login role SET ROLE into te_tenant.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'te_tenant') THEN
    CREATE ROLE te_tenant NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

GRANT te_tenant TO CURRENT_USER;
GRANT USAGE ON SCHEMA public TO te_tenant;

GRANT SELECT, INSERT, UPDATE ON "institutions" TO te_tenant;
GRANT SELECT, INSERT, UPDATE ON "institution_domains" TO te_tenant;
GRANT SELECT, INSERT, UPDATE ON "institution_memberships" TO te_tenant;
GRANT SELECT, INSERT, UPDATE ON "institution_invitations" TO te_tenant;
GRANT SELECT, INSERT ON "institution_audit_logs" TO te_tenant;
-- Enough to show a roster; never password hashes, roles or preferences.
GRANT SELECT ("id", "name", "email", "image", "status") ON "users" TO te_tenant;

-- ---------------------------------------------------------------------------
-- Request context. Empty string and unset both read as NULL, and NULL never
-- equals anything, so a missing context matches no rows (fail closed).
-- ---------------------------------------------------------------------------
CREATE FUNCTION te_institution_id() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.institution_id', true), '') $$;

CREATE FUNCTION te_user_id() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('app.user_id', true), '') $$;

CREATE FUNCTION te_is_platform_admin() RETURNS boolean
  LANGUAGE sql STABLE
  AS $$ SELECT coalesce(current_setting('app.platform_admin', true), '') = 'on' $$;

-- ---------------------------------------------------------------------------
-- Policies (te_tenant only; anon and authenticated still get nothing).
-- ---------------------------------------------------------------------------

-- An institution is visible in its own scope, to a platform admin, and to
-- its own active members (for their list of workspaces).
CREATE POLICY tenant_select ON "institutions" FOR SELECT TO te_tenant
  USING (
    id = te_institution_id()
    OR te_is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM "institution_memberships" m
      WHERE m."institutionId" = "institutions".id
        AND m."userId" = te_user_id()
        AND m.status = 'ACTIVE'
    )
  );
CREATE POLICY tenant_insert ON "institutions" FOR INSERT TO te_tenant
  WITH CHECK (te_is_platform_admin());
CREATE POLICY tenant_update ON "institutions" FOR UPDATE TO te_tenant
  USING (id = te_institution_id()) WITH CHECK (id = te_institution_id());

CREATE POLICY tenant_all ON "institution_domains" FOR ALL TO te_tenant
  USING ("institutionId" = te_institution_id())
  WITH CHECK ("institutionId" = te_institution_id());

-- A user may read their own memberships everywhere; everything else, and
-- every write, is confined to the current institution.
CREATE POLICY tenant_select ON "institution_memberships" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id() OR "userId" = te_user_id());
CREATE POLICY tenant_insert ON "institution_memberships" FOR INSERT TO te_tenant
  WITH CHECK ("institutionId" = te_institution_id());
CREATE POLICY tenant_update ON "institution_memberships" FOR UPDATE TO te_tenant
  USING ("institutionId" = te_institution_id())
  WITH CHECK ("institutionId" = te_institution_id());

CREATE POLICY tenant_all ON "institution_invitations" FOR ALL TO te_tenant
  USING ("institutionId" = te_institution_id())
  WITH CHECK ("institutionId" = te_institution_id());

CREATE POLICY tenant_select ON "institution_audit_logs" FOR SELECT TO te_tenant
  USING ("institutionId" = te_institution_id());
CREATE POLICY tenant_insert ON "institution_audit_logs" FOR INSERT TO te_tenant
  WITH CHECK ("institutionId" = te_institution_id());

-- Users: yourself, and members of the current institution. Column grants
-- above limit what is readable even then.
CREATE POLICY tenant_select ON "users" FOR SELECT TO te_tenant
  USING (
    id = te_user_id()
    OR EXISTS (
      SELECT 1 FROM "institution_memberships" m
      WHERE m."userId" = "users".id
        AND m."institutionId" = te_institution_id()
    )
  );

-- ---------------------------------------------------------------------------
-- The two lookups that must cross tenants, as narrow definer functions so
-- te_tenant never needs a broader policy. Each returns ids only.
-- ---------------------------------------------------------------------------

-- Which ACTIVE institution owns this VERIFIED domain, if any.
CREATE FUNCTION te_institution_for_domain(p_domain text) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT d."institutionId"
    FROM "institution_domains" d
    JOIN "institutions" i ON i.id = d."institutionId"
    WHERE d.domain = lower(p_domain)
      AND d."verifiedAt" IS NOT NULL
      AND i.status = 'ACTIVE'
  $$;

-- Which institution an invitation token (by hash) belongs to.
CREATE FUNCTION te_invitation_institution(p_token_hash text) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT "institutionId" FROM "institution_invitations" WHERE "tokenHash" = p_token_hash
  $$;

REVOKE ALL ON FUNCTION te_institution_for_domain(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION te_invitation_institution(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION te_institution_for_domain(text) TO te_tenant;
GRANT EXECUTE ON FUNCTION te_invitation_institution(text) TO te_tenant;

-- ---------------------------------------------------------------------------
-- The institution audit log is append-only for every role, owner included.
-- ---------------------------------------------------------------------------
CREATE FUNCTION te_audit_log_append_only() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RAISE EXCEPTION 'institution_audit_logs is append-only';
  END
  $$;

CREATE TRIGGER institution_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "institution_audit_logs"
  FOR EACH ROW EXECUTE FUNCTION te_audit_log_append_only();
