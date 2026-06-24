import { z } from 'zod';
import { appEnvSchema, loadEnv } from '@sanad/util';

/**
 * The settings service's single typed env accessor (U19) — the ONLY place reading
 * `process.env`. Validated once at startup, fails fast (OPS1). Owns its DB (MS5),
 * the broker, and the Redis cache (the resolved-branding cache).
 */
const settingsEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3002),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
});

export type SettingsEnv = z.infer<typeof settingsEnvSchema>;

export function loadSettingsEnv(): SettingsEnv {
  return loadEnv(settingsEnvSchema, process.env);
}

/** DI token for the validated settings env. */
export const SETTINGS_ENV = Symbol('SETTINGS_ENV');
