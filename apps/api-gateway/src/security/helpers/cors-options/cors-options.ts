import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

/** The slice of the gateway env this policy depends on. */
export interface CorsPolicyEnv {
  CORS_ALLOWED_ORIGINS: readonly string[];
}

/** One hour — long enough to spare a preflight per session, short enough to change safely. */
const PREFLIGHT_MAX_AGE_SECONDS = 3600;

/**
 * The gateway's cross-origin policy, **deny by default**.
 *
 * Nothing in the product needs CORS today: the admin portal calls a relative `/api` through
 * nginx (same origin) and authenticates with a Bearer header rather than a cookie, and the
 * website fetches server-side where the browser is not involved at all. So an empty allow-list
 * is the honest default — it breaks nothing now and opens nothing later. `CORS_ALLOWED_ORIGINS`
 * exists for a future surface that genuinely is on another host.
 */
export function corsOptions(env: CorsPolicyEnv): CorsOptions {
  return {
    origin:
      env.CORS_ALLOWED_ORIGINS.length > 0
        ? [...env.CORS_ALLOWED_ORIGINS]
        : false,
    // Bearer, never cookies — credentialed CORS would grant an origin more than it needs.
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'authorization',
      'content-type',
      'x-sanad-locale',
      'x-request-id',
    ],
    // Set-but-unreadable headers are the same as absent ones for a cross-origin caller: it
    // could neither see its rate-limit standing nor quote a request id in a bug report.
    exposedHeaders: [
      'x-request-id',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'retry-after',
    ],
    maxAge: PREFLIGHT_MAX_AGE_SECONDS,
  };
}
