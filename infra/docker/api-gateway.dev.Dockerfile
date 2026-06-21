# Dev image: toolchain only. The workspace is bind-mounted at runtime, so edits
# hot-reload with no rebuild (OPS2). SWC recompiles changed .ts → dist (emitting
# decorator metadata for Nest DI); `node --watch` reloads the process.
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

EXPOSE 3000

# Install against the bind-mounted source, then start the watch serve target.
CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm exec nx serve api-gateway"]
