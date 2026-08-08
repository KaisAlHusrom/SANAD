# Per-backend dev entrypoint (OPS2). The gateway + the five NestJS services use this as
# their container CMD instead of `nx serve`, so:
#   * Nx never runs in an app container  -> the "recursive task invocation" wedge is impossible.
#   * a service start never rebuilds the shared libs/*/dist (that is libs-builder's sole job)
#     -> no cross-service cascade / half-written dist.
#   * migrations run directly against the compiled dist (no `nx db-migrate` -> no `^build`).
#
#   $1 = app dir under apps/  (e.g. api-gateway, identity-service)
set -e
APP="$1"
if [ -z "$APP" ]; then
  echo "[dev-entry] usage: dev-entry.sh <app-dir>" >&2
  exit 1
fi
cd /workspace

# Install deps (skips when the lockfile is unchanged on a warm volume).
. infra/scripts/dev-install.sh

# Compile this app's own src -> its own dist once (SWC; decorator metadata for Nest DI, N11).
# The supervisor below starts its own `swc --watch`; this first pass just guarantees dist
# exists before migrations run and before the supervisor's first `node dist/main.js`.
echo "[dev-entry] $APP: initial SWC compile"
( cd "apps/$APP" && pnpm exec swc src -d dist --strip-leading-paths )

# Apply this service's migrations if it owns a DB (the gateway has none). Runs the compiled
# migrator directly (shared libs come from libs-builder; this app service never builds them).
if [ -f "apps/$APP/dist/db/migrate.js" ]; then
  echo "[dev-entry] $APP: applying migrations"
  ( cd "apps/$APP" && node --enable-source-maps dist/db/migrate.js )
fi

echo "[dev-entry] $APP: starting supervised watch (dev-serve)"
exec node infra/scripts/dev-serve.mjs "apps/$APP"
