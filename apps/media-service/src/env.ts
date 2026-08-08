import { z } from 'zod';
import { appEnvSchema, loadEnv } from '@sanad/util';

/**
 * An optional env value that treats an EMPTY STRING as unset. Docker Compose passes an
 * unset `${VAR:-}` as `''` (present but empty), which a plain `.min(1).optional()` would
 * reject — so coerce `''` → undefined first. Used for the optional R2 config.
 */
const optionalNonEmpty = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
);

/** The dev nginx origin the admin SPA is served from — the coded default (U9). */
const DEFAULT_ADMIN_ORIGIN = 'http://localhost:8190';

/**
 * A comma-separated origin list → a de-duplicated, trimmed array; blank/unset falls back to the
 * dev origin so a development stack self-checks with zero config.
 */
const adminOrigins = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() !== ''
      ? value
      : DEFAULT_ADMIN_ORIGIN,
  z.string().transform((value) => [
    ...new Set(
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  ]),
);

/**
 * The media service's single typed env accessor (U19) — the ONLY place reading
 * `process.env`. Validated once at startup, fails fast on a bad required key (OPS1).
 * Owns its DB (MS5) + the broker.
 *
 * The **R2 storage config is OPTIONAL** (decision 2026-06-23): the service boots
 * unconfigured and upload endpoints return a clean 503 until the creds are present.
 * These `R2_*` values are now the **env FALLBACK layer only** (the vault swap landed
 * 2026-07-19): `resolveActiveStorageConfig` resolves the ACTIVE storage provider from the
 * settings integrations vault (`settings.integration.resolve`, MS2) and falls back per field
 * to the env var named by that provider's catalog descriptor — so an env-configured deploy
 * keeps working while anything set in the admin overrides it.
 */
const mediaEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3003),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  // Cloudflare R2 (S3-compatible) — all optional so the service boots without storage.
  // Empty-string (`${VAR:-}` from compose) is treated as unset.
  R2_ACCOUNT_ID: optionalNonEmpty,
  R2_ACCESS_KEY_ID: optionalNonEmpty,
  R2_SECRET_ACCESS_KEY: optionalNonEmpty,
  R2_BUCKET: optionalNonEmpty,
  R2_ENDPOINT: optionalUrl,
  R2_PUBLIC_URL: optionalUrl,
  // Hard ceiling on a single signed upload (bytes). Default 25 MiB.
  MEDIA_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(26214400),
  /**
   * The browser origins that upload directly to the bucket — i.e. where the admin portal is
   * served from. They are what the bucket's CORS policy must allow (rules change-log
   * 2026-07-20); this service both CHECKS them and can WRITE them. Comma-separated, so one
   * deploy can serve the portal from several hosts. Defaults to the dev nginx origin so a
   * development stack self-checks correctly with no extra config (U9 coded default).
   */
  ADMIN_PUBLIC_ORIGINS: adminOrigins,
});

export type MediaEnv = z.infer<typeof mediaEnvSchema>;

export function loadMediaEnv(): MediaEnv {
  return loadEnv(mediaEnvSchema, process.env);
}

/** DI token for the validated media env. */
export const MEDIA_ENV = Symbol('MEDIA_ENV');
