import { z } from 'zod';
import { appEnvSchema, loadEnv, readAppEnv, type AppEnv } from '@sanad/util';

/** Normalize a PEM passed with literal `\n` (single-line env) into real newlines. */
const pemKey = z
  .string()
  .min(1)
  .transform((value) => value.replace(/\\n/g, '\n'));

/**
 * The dev origins the admin SPA and a bare Vite dev server are served from. In development only:
 * nothing in the product needs CORS (the admin is same-origin through nginx, the website fetches
 * server-side), so anywhere else the allow-list is EMPTY unless an operator names an origin.
 */
const DEV_ALLOWED_ORIGINS = ['http://localhost:8190', 'http://localhost:4200'];

/** A comma-separated origin list → trimmed, de-duplicated. Mirrors `ADMIN_PUBLIC_ORIGINS`. */
function originList(fallback: readonly string[]) {
  return z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() !== ''
        ? value
        : fallback.join(','),
    z.string().transform((value) => [
      ...new Set(
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
      ),
    ]),
  );
}

/**
 * The gateway's single typed env accessor (U19). This is the ONLY place that reads
 * `process.env`; every other module imports from here. Branching is by `APP_ENV`
 * (never `NODE_ENV`, OPS1). Validated once at startup — fails fast on a bad config.
 * The gateway holds only the JWT **public** key (it verifies; identity signs, decision 2).
 */
function gatewayEnvSchema(appEnv: AppEnv) {
  return z.object({
    APP_ENV: appEnvSchema,
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().min(1).default('0.0.0.0'),
    RABBITMQ_URL: z.string().min(1),
    JWT_PUBLIC_KEY: pemKey,
    /** Backs the edge rate limiter (P8.10.A). Injected into the container since P3. */
    REDIS_URL: z.string().min(1),
    /**
     * How many reverse proxies sit in front. Decides which `x-forwarded-for` entry Express
     * resolves `req.ip` to — the value the limiter keys on and the audit row records. Too low
     * and every caller shares the proxy's bucket (a self-DoS); too high and the header becomes
     * spoofable again. `1` = our nginx; behind Cloudflare *and* nginx it is `2` (P9 must set
     * this deliberately for the production topology).
     */
    TRUST_PROXY_HOPS: z.coerce.number().int().positive().default(1),
    /** Browser origins allowed to call the API cross-origin. Empty = none (deny by default). */
    CORS_ALLOWED_ORIGINS: originList(
      appEnv === 'development' ? DEV_ALLOWED_ORIGINS : [],
    ),
  });
}

export type GatewayEnv = z.infer<ReturnType<typeof gatewayEnvSchema>>;

/**
 * `APP_ENV` is read first because it decides the CORS default — a `z.preprocess` cannot see a
 * sibling key, and a default that ignored the environment would be the wrong shape of wrong
 * (open in production, closed in dev).
 */
export function loadGatewayEnv(
  source: Record<string, string | undefined> = process.env,
): GatewayEnv {
  return loadEnv(gatewayEnvSchema(readAppEnv(source)), source);
}
