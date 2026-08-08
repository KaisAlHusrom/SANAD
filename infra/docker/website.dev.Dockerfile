# Dev image: toolchain only. The workspace is bind-mounted at runtime, so edits hot-reload
# with no rebuild (OPS2). This runs the Next.js dev server (App Router, Turbopack/Webpack HMR)
# served under `/` by nginx. `@sanad/*` libs resolve to their built `dist` (the repo
# convention), so contracts + config + web-ui are built before `next dev` starts (cheap; they
# rarely change), mirroring the admin-portal container.
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
  && corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

# Next dev server (next.config.js; bound to 0.0.0.0:3000 below).
EXPOSE 3000

# Shared libs (contracts/config/web-ui + the rest) are built ONCE by the libs-builder
# container, which this service `depends_on` (service_healthy) — so we no longer run an
# `nx run-many build` here (that used to race the backend by rewriting the shared dist).
# Install skips when the lockfile is unchanged (dev-install.sh); then just `next dev`.
CMD ["sh", "-c", ". infra/scripts/dev-install.sh && exec pnpm exec nx dev website -- --hostname 0.0.0.0 --port 3000"]
