#!/bin/sh
# Runs once, on an empty data volume (docker-entrypoint-initdb.d).
# Creates the application's own login role and database. The role is not a
# superuser and cannot bypass row-level security; it may create roles only
# because migration 20261028120100 creates the te_tenant role it switches
# into. The superuser password is for operators and backups only and is
# never given to the application.
set -eu
APP_PASSWORD="$(cat /run/secrets/te_app_db_password)"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  --set=app_password="$APP_PASSWORD" <<'SQL'
CREATE ROLE te_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB CREATEROLE PASSWORD :'app_password';
-- Also created by migration 20261028120100 (IF NOT EXISTS). Created here too
-- because roles are cluster-wide and not in pg_dump: a backup restored onto
-- a fresh server needs te_tenant to exist before its RLS policies load.
CREATE ROLE te_tenant NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
GRANT te_tenant TO te_app WITH ADMIN OPTION;
CREATE DATABASE techepitome OWNER te_app
  LOCALE_PROVIDER icu ICU_LOCALE 'en-US' TEMPLATE template0;
REVOKE ALL ON DATABASE techepitome FROM PUBLIC;
SQL
