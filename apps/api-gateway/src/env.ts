import { z } from 'zod';
import { appEnvSchema, loadEnv } from '@sanad/util';

/**
 * The gateway's single typed env accessor (U19). This is the ONLY place that reads
 * `process.env`; every other module imports `gatewayEnv`. Branching is by `APP_ENV`
 * (never `NODE_ENV`, OPS1). Validated once at startup — fails fast on a bad config.
 */
const gatewayEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
});

export type GatewayEnv = z.infer<typeof gatewayEnvSchema>;

export function loadGatewayEnv(): GatewayEnv {
  return loadEnv(gatewayEnvSchema, process.env);
}
