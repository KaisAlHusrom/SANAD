import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/shared/sequence',
  test: {
    name: 'sequence',
    watch: false,
    // OPS9: cap the worker pool. Vitest defaults to ~CPU-count forks PER PROJECT, and Nx runs
    // several projects at once — that put ~30 node processes on a 16 GB host and made the gate
    // slower by swapping. 2 forks x nx --parallel=2 stays bounded.
    poolOptions: { forks: { maxForks: 2, minForks: 1 } },
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // The DB-integration spec migrates `sequence_test` at import time (TDD2); running spec
    // files in parallel would race the Drizzle migration journal (the known settings-service
    // trap). Specs are fast, so serial costs nothing.
    fileParallelism: false,
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
