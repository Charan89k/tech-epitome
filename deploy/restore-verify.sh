#!/usr/bin/env bash
# Proves a backup restores, in a throwaway container that shares nothing
# with production: its own network (no route out), no published port, no
# volume, deleted afterwards.
#
#   deploy/restore-verify.sh <file.dump.gpg>
#
# Run where the backup private key lives (an operator machine or a restore
# host, not the production server); gpg uses the default keyring or GNUPGHOME.
#
# Checks the checksum, restores, and prints row counts for core tables so
# they can be compared with production's. Exit status 0 only if every
# step succeeded and the migrations and course content are present (users
# may legitimately be zero on a new deployment).
set -euo pipefail

file="${1:?usage: restore-verify.sh <backup.dump.gpg>}"
(cd "$(dirname "$file")" && sha256sum -c "$(basename "$file").sha256")

name="te-restore-check-$$"
net="te-restore-net-$$"
cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; docker network rm "$net" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker network create --internal "$net" >/dev/null
docker run -d --name "$name" --network "$net" \
  -e POSTGRES_PASSWORD="$(head -c 24 /dev/urandom | base64)" \
  postgres:18-alpine >/dev/null
for _ in $(seq 1 30); do docker exec "$name" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done

# Roles are cluster-wide, so pg_dump omits them; create the ones the RLS
# policies name, exactly as deploy/postgres-init.sh does on a real server.
docker exec "$name" psql -U postgres -qc "CREATE ROLE te_app NOLOGIN" \
  -c "CREATE ROLE te_tenant NOLOGIN NOSUPERUSER NOBYPASSRLS" -c "GRANT te_tenant TO te_app WITH ADMIN OPTION" \
  -c "CREATE DATABASE restorecheck"
gpg --batch --quiet --decrypt "$file" \
  | docker exec -i "$name" pg_restore -U postgres -d restorecheck --no-owner --exit-on-error

counts="$(docker exec "$name" psql -U postgres -d restorecheck -At -c "
  SELECT 'users', count(*) FROM users UNION ALL
  SELECT 'problems', count(*) FROM problems UNION ALL
  SELECT 'submissions', count(*) FROM submissions UNION ALL
  SELECT 'institutions', count(*) FROM institutions UNION ALL
  SELECT 'migrations', count(*) FROM _prisma_migrations")"
echo "$counts"
count() { echo "$counts" | awk -F'|' -v t="$1" '$1==t{print $2}'; }
[[ "$(count migrations)" -gt 0 && "$(count problems)" -gt 0 ]] \
  || { echo "restore check FAILED: no migrations or content"; exit 1; }
echo "restore check ok"
