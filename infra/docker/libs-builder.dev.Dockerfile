# Dev image for the libs-builder (OPS2): toolchain only, workspace bind-mounted at runtime.
# This container is the SOLE writer of the shared libs/*/dist — it builds every shared lib
# once (Nx tsc build → decorator metadata preserved), marks itself healthy, then rebuilds
# the changed lib on a src edit (infra/scripts/dev-libs.mjs). No app container ever rebuilds
# the shared dist again, which removes the old cross-service rebuild cascade.
#
# The node-gyp toolchain is present because the initial `pnpm install` builds the whole
# workspace's native modules (e.g. argon2) into this container's node_modules volume.
FROM node:20-alpine

RUN apk add --no-cache python3 make g++ \
  && corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /workspace

CMD ["sh", "-c", ". infra/scripts/dev-install.sh && exec node infra/scripts/dev-libs.mjs"]
