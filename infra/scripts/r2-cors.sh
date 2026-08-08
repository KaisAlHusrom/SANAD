#!/usr/bin/env bash
#
# Write (or read back) the bucket CORS policy that lets the admin SPA upload from the browser.
#
# WHY THIS EXISTS: the admin portal presigns at the gateway and then PUTs the bytes *from the
# browser* directly to R2. That is cross-origin, so the browser preflights it and the BUCKET must
# allow the origin — otherwise R2 answers `403 Unauthorized — CORS not configured for this bucket`
# and every upload fails before a byte moves (rules change-log 2026-07-20).
#
# NORMALLY YOU DO NOT NEED THIS SCRIPT: the admin's Integrations → Storage card detects the state
# and applies the policy in one click. This is the fallback for when the R2 API token is
# object-scoped (it may not touch bucket configuration) or for a scripted/CI deploy.
#
# Usage:
#   infra/scripts/r2-cors.sh get                     # show the bucket's current CORS rules
#   infra/scripts/r2-cors.sh put                     # write infra/r2/cors.json to the bucket
#   ORIGINS="https://admin.sanad.tech" infra/scripts/r2-cors.sh put
#
# Credentials come from the environment (never committed, U14): R2_ACCOUNT_ID / R2_ACCESS_KEY_ID /
# R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_ENDPOINT — the same keys as infra/.env.<APP_ENV>.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
POLICY_FILE="${POLICY_FILE:-$INFRA_DIR/r2/cors.json}"
ENV_FILE="${ENV_FILE:-$INFRA_DIR/.env.development}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

command -v aws >/dev/null 2>&1 || {
  echo "aws CLI not found — install it, or use the one-click button in Integrations → Storage." >&2
  exit 1
}

for required in R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET R2_ENDPOINT; do
  if [[ -z "${!required:-}" ]]; then
    echo "Missing $required (set it in $ENV_FILE or the environment)." >&2
    exit 1
  fi
done

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

action="${1:-get}"

case "$action" in
  get)
    aws s3api get-bucket-cors --bucket "$R2_BUCKET" --endpoint-url "$R2_ENDPOINT"
    ;;
  put)
    payload="$POLICY_FILE"
    # ORIGINS overrides the checked-in dev origin for staging/production, without editing the file.
    if [[ -n "${ORIGINS:-}" ]]; then
      payload="$(mktemp)"
      python3 - "$POLICY_FILE" "$ORIGINS" >"$payload" <<'PY'
import json, sys
policy = json.load(open(sys.argv[1]))
origins = [o.strip() for o in sys.argv[2].split(",") if o.strip()]
for rule in policy["CORSRules"]:
    rule["AllowedOrigins"] = origins
json.dump(policy, sys.stdout)
PY
    fi
    aws s3api put-bucket-cors \
      --bucket "$R2_BUCKET" \
      --endpoint-url "$R2_ENDPOINT" \
      --cors-configuration "file://$payload"
    echo "CORS policy written to bucket '$R2_BUCKET'. Verifying:"
    aws s3api get-bucket-cors --bucket "$R2_BUCKET" --endpoint-url "$R2_ENDPOINT"
    ;;
  *)
    echo "Usage: $0 [get|put]" >&2
    exit 1
    ;;
esac
