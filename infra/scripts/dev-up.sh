#!/usr/bin/env bash
# Bring up the Sanad dev stack the ONE right way (replaces the old tribal recovery
# playbook). The compose health `depends_on` now sequences the boot automatically:
#   infra (postgres/redis/rabbitmq) -> libs-builder -> services -> gateway -> frontends -> nginx
# so there is nothing to stagger by hand and no `--build` race to nurse.
#
# Usage: infra/scripts/dev-up.sh [extra docker compose args…]   (run from anywhere)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE="$ROOT/infra/docker-compose.dev.yml"
ENV_FILE="$ROOT/infra/.env.development"
NGINX_PORT="${NGINX_PORT:-8190}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE is missing." >&2
  echo "It carries the RS256 JWT keypair + APP_SECRETS_ENCRYPTION_KEY; without it the" >&2
  echo "gateway + identity fail fast at boot (U19). Copy infra/.env.example and fill it in." >&2
  exit 1
fi

echo "▶ Starting the dev stack (this can take a few minutes on a cold build)…"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" up -d --build "$@"

echo "▶ Waiting for the gateway to answer through nginx (http://localhost:${NGINX_PORT}/api/health)…"
deadline=$(( SECONDS + 300 ))
until curl -fsS -o /dev/null "http://localhost:${NGINX_PORT}/api/health"; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "✗ Timed out after 5 min. Container status:" >&2
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE" ps
    exit 1
  fi
  sleep 3
done

echo "✓ Gateway healthy. Stack status:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" ps
echo
echo "  Website : http://localhost:${NGINX_PORT}/"
echo "  Admin   : http://localhost:${NGINX_PORT}/admin/"
echo "  API     : http://localhost:${NGINX_PORT}/api/health"
