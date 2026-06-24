import { z } from 'zod';
import { appEnvSchema, loadEnv } from '@sanad/util';

/**
 * The content service's single typed env accessor (U19) — the ONLY place reading
 * `process.env`. Validated once at startup, fails fast on a bad required key (OPS1). Owns
 * its DB (MS5) + the broker. No external-secret config (the CMS holds no provider creds).
 */
const contentEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3004),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
});

export type ContentEnv = z.infer<typeof contentEnvSchema>;

export function loadContentEnv(): ContentEnv {
  return loadEnv(contentEnvSchema, process.env);
}

/** DI token for the validated content env. */
export const CONTENT_ENV = Symbol('CONTENT_ENV');
