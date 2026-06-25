import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/notifications-service',
  test: {
    name: 'notifications-service',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Run spec FILES serially: the DB-integration spec migrates the shared `notification_test`
    // at import time (TDD2); serial avoids any migration-journal race as specs are added.
    fileParallelism: false,
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
