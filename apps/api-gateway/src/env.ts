import { z } from 'zod';
import { appEnvSchema, loadEnv } from '@sanad/util';

/** Normalize a PEM passed with literal `\n` (single-line env) into real newlines. */
const pemKey = z
  .string()
  .min(1)
  .transform((value) => value.replace(/\\n/g, '\n'));

/**
 * The gateway's single typed env accessor (U19). This is the ONLY place that reads
 * `process.env`; every other module imports from here. Branching is by `APP_ENV`
 * (never `NODE_ENV`, OPS1). Validated once at startup — fails fast on a bad config.
 * The gateway holds only the JWT **public** key (it verifies; identity signs, decision 2).
 */
const gatewayEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  RABBITMQ_URL: z.string().min(1),
  JWT_PUBLIC_KEY: pemKey,
});

export type GatewayEnv = z.infer<typeof gatewayEnvSchema>;

export function loadGatewayEnv(): GatewayEnv {
  return loadEnv(gatewayEnvSchema, process.env);
}

/** DI token for the validated gateway env. */
export const GATEWAY_ENV = Symbol('GATEWAY_ENV');
