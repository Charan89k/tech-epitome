#!/usr/bin/env bash
# Release one image tag, with a backup first and an automatic rollback if
# the new version does not become healthy.
#
#   deploy/release.sh <tag>
#
# Steps: back up -> run migrations (forward-only) -> start the new app ->
# wait for /api/health?ready=1 -> on failure, restart the previous tag.
# Migrations are additive by policy, so the previous image still runs
# against the migrated schema; a migration that is not must be released
# with its own written plan instead of this script.
set -euo pipefail

tag="${1:?usage: release.sh <tag>}"
[[ "$tag" =~ ^[A-Za-z0-9._-]{1,64}$ ]] || { echo "invalid tag"; exit 2; }
here="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_ENV="${COMPOSE_ENV:-/etc/tech-epitome/compose.env}"
STATE="${STATE_FILE:-/etc/tech-epitome/current-tag}"
REGISTRY="${REGISTRY:-ghcr.io/charan89k/tech-epitome}"
PORT="${APP_PORT:-3100}"
compose() { docker compose -f "$here/compose.yml" --env-file "$COMPOSE_ENV" "$@"; }

previous="$(cat "$STATE" 2>/dev/null || true)"
echo "releasing $tag (previous: ${previous:-none})"

"$here/backup.sh"

export IMAGE="$REGISTRY:$tag" MIGRATOR_IMAGE="$REGISTRY-migrator:$tag"
compose pull app migrate
compose --profile migrate run --rm migrate
compose up -d --no-deps app

healthy() {
  for _ in $(seq 1 30); do
    curl -fsS "http://127.0.0.1:$PORT/api/health?ready=1" >/dev/null 2>&1 && return 0
    sleep 2
  done
  return 1
}

if healthy; then
  echo "$tag" > "$STATE"
  echo "release ok: $tag"
else
  echo "release FAILED: $tag is not healthy"
  if [[ -n "$previous" ]]; then
    export IMAGE="$REGISTRY:$previous"
    compose up -d --no-deps app
    healthy && echo "rolled back to $previous" || echo "ROLLBACK ALSO UNHEALTHY: page the operator"
  fi
  exit 1
fi
