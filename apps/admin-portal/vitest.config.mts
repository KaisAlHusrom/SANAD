import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/admin-portal',
  plugins: [react()],
  test: {
    name: 'admin-portal',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // jsdom's global Request is Node's undici (no location base) → relative URLs
    // throw. Give tests an absolute gateway base; production stays relative `/api`.
    env: {
      VITE_APP_ENV: 'development',
      VITE_API_BASE_URL: 'http://localhost/api',
    },
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
