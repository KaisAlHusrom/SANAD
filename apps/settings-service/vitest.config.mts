import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/settings-service',
  test: {
    name: 'settings-service',
    watch: false,
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
