/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The admin portal is served under `/admin/` behind nginx (the gateway owns `/api/`).
// `@sanad/*` libs resolve to their built `dist` at runtime (the repo convention —
// `dependsOn: ^build` guarantees it); `tsc` resolves them to `src` via the
// `@sanad/source` custom condition in tsconfig.base.json for typecheck.
export default defineConfig({
  root: __dirname,
  base: '/admin/',
  cacheDir: '../../node_modules/.vite/apps/admin-portal',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4200,
  },
  preview: {
    host: '0.0.0.0',
    port: 4300,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
  },
});
