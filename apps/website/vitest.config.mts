import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The website's unit/component tests. Like the admin portal, `@sanad/*` libs resolve to
// their built `dist` here (no `@sanad/source` Vite condition — that's tsc-only). Server
// components are tested as plain async data/logic units; only pure presentational pieces
// (SectionRenderer, LeadForm) are rendered with @testing-library/react in jsdom.
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/website',
  plugins: [react()],
  test: {
    name: 'website',
    watch: false,
    // OPS9: cap the worker pool. Vitest defaults to ~CPU-count forks PER PROJECT, and Nx runs
    // several projects at once — that put ~30 node processes on a 16 GB host and made the gate
    // slower by swapping. 2 forks x nx --parallel=2 stays bounded.
    poolOptions: { forks: { maxForks: 2, minForks: 1 } },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // jsdom's global fetch/Request is undici (no location base) → relative URLs throw.
    // Give tests an absolute in-cluster gateway base; production reads it from APP_ENV.
    env: {
      APP_ENV: 'development',
      GATEWAY_BASE_URL: 'http://nginx/api',
    },
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
}));
