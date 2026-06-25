# Dev image: toolchain only. The workspace is bind-mounted at runtime, so edits
# hot-reload with no rebuild (OPS2). This is the FIRST frontend container — it runs the
# Vite dev server (HMR), not a Nest SWC watch. `@sanad/*` libs resolve to their built
# `dist` (the repo convention), so contracts + config are built before the dev server
# starts (cheap; they rarely change).
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
  && corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

# Vite dev server (vite.config.ts: host 0.0.0.0, port 4200, base /admin/).
EXPOSE 4200

CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm exec nx run-many -t build --projects=contracts,config && pnpm exec nx serve admin-portal"]
