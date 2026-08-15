import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/tools/lint',
  test: {
    name: 'lint-rules',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.mjs'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
