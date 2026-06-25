import { z } from 'zod';
import { appEnvSchema, loadEnv } from '@sanad/util';

/** Empty string (`${VAR:-}` from compose) → undefined, so an optional var stays unset. */
const optionalNonEmpty = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

/**
 * A dev-only AES-256-GCM master key (base64 of 32 bytes). Lets the service + tests boot
 * unconfigured (N13); a real `APP_SECRETS_ENCRYPTION_KEY` is REQUIRED in staging/prod
 * (OPS1) and the cipher's length check rejects a malformed override.
 */
const DEV_SECRETS_ENCRYPTION_KEY =
  'c2FuYWQtZGV2LXNlY3JldHMtZW5jcnlwdGlvbi1rZXk=';

/**
 * The settings service's single typed env accessor (U19) — the ONLY place reading
 * `process.env`. Validated once at startup, fails fast (OPS1). Owns its DB (MS5),
 * the broker, the Redis cache (resolved-branding), and the integration-secret vault (N13).
 */
const settingsEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3002),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  // AES-256-GCM master key for the integration-secret vault (N13). Base64 of 32 bytes.
  APP_SECRETS_ENCRYPTION_KEY: z
    .string()
    .min(1)
    .default(DEV_SECRETS_ENCRYPTION_KEY),
  // Env fallback for the SMTP password secret (DB → env → null resolution, N13).
  SMTP_PASSWORD: optionalNonEmpty,
});

export type SettingsEnv = z.infer<typeof settingsEnvSchema>;

export function loadSettingsEnv(): SettingsEnv {
  return loadEnv(settingsEnvSchema, process.env);
}

/** DI token for the validated settings env. */
export const SETTINGS_ENV = Symbol('SETTINGS_ENV');
