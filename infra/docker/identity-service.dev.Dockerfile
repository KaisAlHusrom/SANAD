# Dev image: toolchain only. The workspace is bind-mounted at runtime, so edits
# hot-reload with no rebuild (OPS2). SWC recompiles changed .ts → dist (emitting
# decorator metadata for Nest DI); `node --watch` reloads the process. argon2 is a
# native module — node-gyp toolchain is provided to build it on install.
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
  && corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

EXPOSE 3001

# Supervised dev entry (no `nx serve`/`nx db-migrate` in the container — see
# infra/scripts/dev-entry.sh): install (skips when warm) -> SWC compile -> migrate -> a
# supervised `node dist/main.js` that always restarts on crash AND on shared-lib dist
# changes. Shared libs are built once by the libs-builder container (MS5 migrations kept).
CMD ["sh", "infra/scripts/dev-entry.sh", "identity-service"]
