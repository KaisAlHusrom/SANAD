#!/usr/bin/env bash
# Stop the Sanad dev stack. By default KEEPS data volumes (Postgres/Redis/RabbitMQ) —
# pass -v / --volumes to wipe them (destroys the dev databases).
#
# Usage: infra/scripts/dev-down.sh [-v] [extra docker compose args…]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE="$ROOT/infra/docker-compose.dev.yml"
ENV_FILE="$ROOT/infra/.env.development"

args=()
for a in "$@"; do
  case "$a" in
    -v|--volumes) args+=("-v") ;;
    *) args+=("$a") ;;
  esac
done

# `--profile '*'` so `down` reaches profile-gated services too — without it, containers started
# by `dev-up.sh full` would be left running. The `${args[@]+…}` guard is for macOS bash 3.2, which
# under `set -u` treats an EMPTY array's "${arr[@]}" as unbound.
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" --profile '*' down ${args[@]+"${args[@]}"}
echo "✓ Dev stack stopped."
