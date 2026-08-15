import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/settings-service',
  test: {
    name: 'settings-service',
    watch: false,
    // OPS9: cap the worker pool. Vitest defaults to ~CPU-count forks PER PROJECT, and Nx runs
    // several projects at once — that put ~30 node processes on a 16 GB host and made the gate
    // slower by swapping. 2 forks x nx --parallel=2 stays bounded.
    poolOptions: { forks: { maxForks: 2, minForks: 1 } },
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Run spec FILES serially: this service has two DB-integration specs that each
    // migrate the shared `settings_test` at import time (TDD2) — parallel files would
    // race on the Drizzle migration journal and skip one. Specs are fast, so serial is fine.
    fileParallelism: false,
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
