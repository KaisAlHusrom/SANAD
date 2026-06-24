# Dev image: toolchain only. The workspace is bind-mounted at runtime, so edits
# hot-reload with no rebuild (OPS2). SWC recompiles changed .ts → dist (emitting
# decorator metadata for Nest DI); `node --watch` reloads the process. No native
# modules here (no argon2), but the node-gyp toolchain is kept for parity/safety.
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
  && corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

EXPOSE 3002

# Install, apply migrations (DB-per-service, MS5), then start the watch serve target.
CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm exec nx db-migrate settings-service && pnpm exec nx serve settings-service"]
