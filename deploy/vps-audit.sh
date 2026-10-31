#!/usr/bin/env bash
# READ-ONLY audit of the VPS before any Tech Epitome change. Changes
# nothing. Never prints environment variables, env files, keys or
# container Env; proxy configs are reduced to server names and ports.
#   sudo bash vps-audit.sh > audit.txt
set -u
section() { printf '\n===== %s =====\n' "$1"; }

section "os";        . /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"; uname -r; uptime
section "cpu";       nproc; lscpu 2>/dev/null | grep -E 'Model name|^CPU\(s\)'
section "memory";    free -h; swapon --show 2>/dev/null
section "disk";      df -hT -x tmpfs -x devtmpfs; lsblk -o NAME,SIZE,TYPE,MOUNTPOINT 2>/dev/null
section "load (5 samples)"; vmstat 1 5 2>/dev/null
section "listening sockets"; ss -tulnH 2>/dev/null | awk '{print $1, $5}' | sort -u
section "firewall";  (ufw status verbose 2>/dev/null || nft list ruleset 2>/dev/null | grep -E 'dport|policy' | head -40)
section "services";  systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null | awk '{print $1}'
section "docker";    docker version --format 'server {{.Server.Version}}' 2>/dev/null
docker ps -a --format '{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null
docker stats --no-stream --format '{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' 2>/dev/null
docker volume ls --format '{{.Name}}' 2>/dev/null
docker network ls --format '{{.Name}}\t{{.Driver}}' 2>/dev/null
docker info --format 'runtimes: {{range $k,$v := .Runtimes}}{{$k}} {{end}} security: {{.SecurityOptions}}' 2>/dev/null
section "reverse proxy"
if command -v nginx >/dev/null; then
  nginx -v 2>&1; nginx -t 2>&1 | tail -1
  nginx -T 2>/dev/null | grep -E '^\s*(server_name|listen)\b' | sort -u
fi
if command -v caddy >/dev/null; then caddy version; grep -hE '^[^#[:space:]].*\{' /etc/caddy/Caddyfile 2>/dev/null; fi
section "tls certificates (names and expiry only)"
certbot certificates 2>/dev/null | grep -E 'Certificate Name|Domains|Expiry'
section "databases"
command -v psql >/dev/null && psql --version
systemctl is-active postgresql mysql mariadb redis 2>/dev/null
section "backups and cron (schedules only)"
ls /etc/cron.d 2>/dev/null; crontab -l 2>/dev/null | grep -v '^#' | awk '{print $1,$2,$3,$4,$5,$6}'
section "dpdp (layout only)"
ls -la /opt /srv /var/www 2>/dev/null
