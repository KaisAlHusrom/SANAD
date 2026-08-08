#!/usr/bin/env bash
# Read-only health snapshot of the dev stack — the container health column plus a live
# probe of the gateway (through nginx) and each backend service (direct host port). Judge
# liveness by THIS, not `docker ps` "Up" alone (the supervisor can hide an inner crash).
#
# Usage: infra/scripts/dev-health.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE="$ROOT/infra/docker-compose.dev.yml"
ENV_FILE="$ROOT/infra/.env.development"
NGINX_PORT="${NGINX_PORT:-8190}"

echo "== compose health =="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" ps

probe() { # name url
  local code
  code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 5 "$2" 2>/dev/null || echo '---')"
  printf '  %-26s %s  (%s)\n' "$1" "$code" "$2"
}

echo
echo "== live probes =="
probe "gateway (via nginx)"   "http://localhost:${NGINX_PORT}/api/health"
probe "website (via nginx)"   "http://localhost:${NGINX_PORT}/"
probe "identity /health"      "http://localhost:${IDENTITY_PORT:-3011}/health"
probe "settings /health"      "http://localhost:${SETTINGS_PORT:-3012}/health"
probe "media /health"         "http://localhost:${MEDIA_PORT:-3013}/health"
probe "content /health"       "http://localhost:${CONTENT_PORT:-3014}/health"
probe "notifications /health" "http://localhost:${NOTIFICATIONS_PORT:-3015}/health"
