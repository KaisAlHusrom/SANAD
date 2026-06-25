import { z } from 'zod';
import { appEnvSchema, loadEnv } from '@sanad/util';

/** Empty string (`${VAR:-}` from compose) → undefined, so an optional var stays unset. */
const optionalNonEmpty = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

/**
 * The notifications service's single typed env accessor (U19) — the ONLY place reading
 * `process.env`. Validated once at startup, fails fast on a bad required key (OPS1). Owns
 * its DB (MS5) + the broker. SMTP transport config (host/port/secure/user/from) is ordinary
 * config and lives here; the SMTP **password** is a secret resolved from the settings vault
 * (N13, DB → env → null) with `SMTP_PASSWORD` as the env fallback. When SMTP is unset the
 * service logs emails to the console (dev-safe default). `NOTIFICATIONS_TEAM_EMAIL` is the
 * inbox that receives new-lead alerts.
 */
const notificationsEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3005),
  HOST: z.string().min(1).default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  // SMTP transport (non-secret). All optional → console fallback when unset.
  SMTP_HOST: optionalNonEmpty,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  // Strict boolean param (N7 — never z.coerce.boolean). Empty → 'false'.
  SMTP_SECURE: z
    .preprocess(
      (value) => (value === '' || value === undefined ? 'false' : value),
      z.enum(['true', 'false']),
    )
    .transform((value) => value === 'true'),
  SMTP_USER: optionalNonEmpty,
  SMTP_FROM: z.string().min(1).default('Sanad Tech <no-reply@sanad.tech>'),
  // Env fallback for the SMTP password secret (the vault is the primary source, N13).
  SMTP_PASSWORD: optionalNonEmpty,
  // Where new-lead team alerts are emailed.
  NOTIFICATIONS_TEAM_EMAIL: z.string().email().default('team@sanad.tech'),
});

export type NotificationsEnv = z.infer<typeof notificationsEnvSchema>;

export function loadNotificationsEnv(): NotificationsEnv {
  return loadEnv(notificationsEnvSchema, process.env);
}

/** DI token for the validated notifications env. */
export const NOTIFICATIONS_ENV = Symbol('NOTIFICATIONS_ENV');
