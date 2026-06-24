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

/**
 * The media service's single typed env accessor (U19) — the ONLY place reading
 * `process.env`. Validated once at startup, fails fast on a bad required key (OPS1).
 * Owns its DB (MS5) + the broker.
 *
 * The **R2 storage config is OPTIONAL** (decision 2026-06-23): the service boots
 * unconfigured and upload endpoints return a clean 503 until the creds are present.
 * Secrets come from `.env` now, behind the `getStorageCredentials()` seam — the future
 * swap to the encrypted integration-secrets vault (settings.resolve-secret, MS2) lands
 * there, never in code or the public settings table.
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
});

export type MediaEnv = z.infer<typeof mediaEnvSchema>;

export function loadMediaEnv(): MediaEnv {
  return loadEnv(mediaEnvSchema, process.env);
}

/** DI token for the validated media env. */
export const MEDIA_ENV = Symbol('MEDIA_ENV');
