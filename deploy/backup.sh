#!/usr/bin/env bash
# Nightly backup of the Tech Epitome database only.
#
#   BACKUP_DIR=/var/backups/tech-epitome GPG_RECIPIENT=<key id> deploy/backup.sh
#
# Custom-format pg_dump over the container's local socket, encrypted to a
# GPG public key before it touches disk (no plaintext copy is ever
# written; the private key is NOT on this server), plus a
# checksum. Keeps BACKUP_KEEP_DAYS (default 14). Optional off-host copy with
# rclone to RCLONE_REMOTE. Never shares a directory, key or remote with another application.
set -euo pipefail

: "${BACKUP_DIR:?set BACKUP_DIR}"
: "${GPG_RECIPIENT:?set GPG_RECIPIENT (backups are never stored unencrypted)}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
COMPOSE=(docker compose -f "$(dirname "$0")/compose.yml" --env-file "${COMPOSE_ENV:-/etc/tech-epitome/compose.env}")

umask 077
mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="$BACKUP_DIR/techepitome-$stamp.dump.gpg"

"${COMPOSE[@]}" exec -T db pg_dump -U postgres -d techepitome --format=custom --no-owner \
  | gpg --batch --yes --trust-model always --encrypt --recipient "$GPG_RECIPIENT" \
      --output "$out.partial"
mv "$out.partial" "$out"
(cd "$BACKUP_DIR" && sha256sum "$(basename "$out")" > "$(basename "$out").sha256")

find "$BACKUP_DIR" -name 'techepitome-*.dump.gpg*' -mtime "+$KEEP_DAYS" -delete

if [[ -n "${RCLONE_REMOTE:-}" ]]; then
  rclone copy "$out" "$RCLONE_REMOTE" && rclone copy "$out.sha256" "$RCLONE_REMOTE"
fi
echo "backup ok: $(basename "$out") $(stat -c %s "$out") bytes"
