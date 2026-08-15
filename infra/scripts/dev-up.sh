#!/usr/bin/env bash
# Bring up the Sanad dev stack the ONE right way (replaces the old tribal recovery
# playbook). The compose health `depends_on` sequences the boot automatically:
#   infra (postgres/redis/rabbitmq) -> libs-builder -> gateway -> nginx
# so there is nothing to stagger by hand.
#
# Usage:
#   infra/scripts/dev-up.sh                      # core only: infra + libs-builder + gateway + identity + nginx
#   infra/scripts/dev-up.sh settings admin       # core + settings-service + admin-portal
#   infra/scripts/dev-up.sh full                 # everything (13 containers)
#   infra/scripts/dev-up.sh --build settings     # same, but rebuild images first
#
# Profiles: settings · media · content · notifications · admin · web · full
#
# OPS9 — this machine runs three projects against ONE 6 GiB Docker VM, so start only what the
# phase needs. `core` is 7 containers (3 node); `full` is 13 (9 node). `--build` is OPT-IN: it
# used to run on every single bring-up, re-sending the whole workspace as build context for
# 9 images. Pass it only when a Dockerfile or a dependency actually changed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE="$ROOT/infra/docker-compose.dev.yml"
ENV_FILE="$ROOT/infra/.env.development"
NGINX_PORT="${NGINX_PORT:-8190}"

KNOWN_PROFILES=' settings media content notifications admin web full '

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE is missing." >&2
  echo "It carries the RS256 JWT keypair + APP_SECRETS_ENCRYPTION_KEY; without it the" >&2
  echo "gateway + identity fail fast at boot (U19). Copy infra/.env.example and fill it in." >&2
  exit 1
fi

# macOS ships bash 3.2, which under `set -u` treats an EMPTY array's "${arr[@]}" as unbound —
# hence the `${arr[@]+…}` guards below and a plain string for the human-readable name list.
PROFILE_ARGS=()
PASSTHRU=()
PROFILE_NAMES=
for arg in "$@"; do
  case "$arg" in
    -*) PASSTHRU+=("$arg") ;;
    *)
      if [[ "$KNOWN_PROFILES" == *" $arg "* ]]; then
        PROFILE_ARGS+=(--profile "$arg")
        PROFILE_NAMES="${PROFILE_NAMES}${arg} "
      else
        echo "ERROR: unknown profile '$arg'." >&2
        echo "Known profiles:$KNOWN_PROFILES" >&2
        exit 1
      fi
      ;;
  esac
done

if [ -z "$PROFILE_NAMES" ]; then
  echo "▶ Profiles: core only (infra + libs-builder + api-gateway + identity-service + nginx)"
else
  echo "▶ Profiles: core + ${PROFILE_NAMES}"
fi

echo "▶ Starting the dev stack (a cold libs-builder build can take a few minutes)…"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"} up -d ${PASSTHRU[@]+"${PASSTHRU[@]}"}

echo "▶ Waiting for the gateway to answer through nginx (http://localhost:${NGINX_PORT}/api/health)…"
deadline=$(( SECONDS + 300 ))
until curl -fsS -o /dev/null "http://localhost:${NGINX_PORT}/api/health"; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "✗ Timed out after 5 min. Container status:" >&2
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE" ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"} ps
    exit 1
  fi
  sleep 3
done

echo "✓ Gateway healthy. Stack status:"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"} ps
echo
echo "  API     : http://localhost:${NGINX_PORT}/api/health"
[[ " ${PROFILE_NAMES} " == *" admin "* || " ${PROFILE_NAMES} " == *" full "* ]] && \
  echo "  Admin   : http://localhost:${NGINX_PORT}/admin/"
[[ " ${PROFILE_NAMES} " == *" web "*   || " ${PROFILE_NAMES} " == *" full "* ]] && \
  echo "  Website : http://localhost:${NGINX_PORT}/"
exit 0
