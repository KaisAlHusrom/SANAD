/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `development` | `staging` | `production` (OPS1/U19 — never NODE_ENV). */
  readonly VITE_APP_ENV?: string;
  /** Gateway base URL; defaults to `/api` (relative, works behind nginx). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
