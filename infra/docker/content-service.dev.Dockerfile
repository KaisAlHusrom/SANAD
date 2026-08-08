# Dev image: toolchain only. The workspace is bind-mounted at runtime, so edits
# hot-reload with no rebuild (OPS2). SWC recompiles changed .ts → dist (emitting
# decorator metadata for Nest DI); `node --watch` reloads the process.
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
  && corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

EXPOSE 3004

# Install, apply migrations (DB-per-service, MS5), then start the watch serve target.
# Supervised dev entry (no `nx serve`/`nx db-migrate` — see infra/scripts/dev-entry.sh):
# install -> SWC compile -> migrate -> supervised `node dist/main.js` (auto-restart on
# crash + on shared-lib dist changes). Shared libs built once by the libs-builder container.
CMD ["sh", "infra/scripts/dev-entry.sh", "content-service"]
