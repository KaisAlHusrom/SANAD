# Dev image: toolchain only. The workspace is bind-mounted at runtime, so edits
# hot-reload with no rebuild (OPS2). SWC recompiles changed .ts → dist (emitting
# decorator metadata for Nest DI); `node --watch` reloads the process.
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

EXPOSE 3000

# Supervised dev entry (no `nx serve` in the container — see infra/scripts/dev-entry.sh):
# install (skips when warm) -> SWC compile -> supervised `node dist/main.js` that always
# restarts on crash AND on shared-lib dist changes. Shared libs come from libs-builder.
CMD ["sh", "infra/scripts/dev-entry.sh", "api-gateway"]
