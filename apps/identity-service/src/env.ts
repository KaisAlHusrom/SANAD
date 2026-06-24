import { z } from 'zod';
import { appEnvSchema, loadEnv } from '@sanad/util';

/** Normalize a PEM passed with literal `\n` (single-line env) into real newlines. */
const pemKey = z
  .string()
  .min(1)
  .transform((value) => value.replace(/\\n/g, '\n'));

/**
 * The identity service's single typed env accessor (U19) — the ONLY place reading
 * `process.env`. Validated once at startup, fails fast (OPS1). Owns its DB (MS5),
 * the RS256 signing keypair (decision 2), token TTLs, and the seed admin (decision 3).
 */
const identityEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  JWT_PRIVATE_KEY: pemKey,
  JWT_PUBLIC_KEY: pemKey,
  JWT_ACCESS_TTL_MIN: z.coerce.number().int().positive().default(15),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),
  ADMIN_EMAIL: z.string().trim().email().default('admin@sanad.tech'),
  ADMIN_PASSWORD: z.string().min(1).default('change-me-admin'),
});

export type IdentityEnv = z.infer<typeof identityEnvSchema>;

export function loadIdentityEnv(): IdentityEnv {
  return loadEnv(identityEnvSchema, process.env);
}

/** DI token for the validated identity env. */
export const IDENTITY_ENV = Symbol('IDENTITY_ENV');
