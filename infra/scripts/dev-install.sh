# Dev-only helper (OPS2): install workspace deps into this container's named
# node_modules volume, but SKIP the install when pnpm-lock.yaml is unchanged since the
# last successful install in this volume. On a warm volume this turns a multi-second
# `pnpm install --frozen-lockfile` into a single sha256 compare — the biggest per-start
# cost on restarts. Meant to be SOURCED (`. infra/scripts/dev-install.sh`), so it never
# calls `exit` (that would kill the caller); `set -e` lets a real install failure
# propagate and restart the container.
set -e
cd /workspace

_stamp="node_modules/.sanad-lock-hash"
_hash="$(sha256sum pnpm-lock.yaml | cut -d' ' -f1)"

if [ -f "$_stamp" ] && [ "$(cat "$_stamp")" = "$_hash" ]; then
  echo "[dev-install] pnpm-lock.yaml unchanged — skipping install (warm node_modules)"
else
  echo "[dev-install] installing dependencies (lockfile changed or cold volume)…"
  pnpm install --frozen-lockfile --prefer-offline
  printf '%s' "$_hash" > "$_stamp"
fi
