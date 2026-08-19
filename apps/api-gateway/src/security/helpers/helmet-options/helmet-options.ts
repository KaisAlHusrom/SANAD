import type { HelmetOptions } from 'helmet';
import type { AppEnv } from '@sanad/util';
import { isDevelopment } from '@sanad/util';

/** The slice of the gateway env this policy depends on. */
export interface HelmetPolicyEnv {
  APP_ENV: AppEnv;
  CORS_ALLOWED_ORIGINS: readonly string[];
}

/** Six months, the value browsers expect before a host is preload-eligible. */
const HSTS_MAX_AGE_SECONDS = 15_552_000;

/**
 * The gateway's response-header policy.
 *
 * A note on scope, because it looks like an omission: this CSP is **not** the CSP that applies
 * to the website or the admin portal. nginx routes `/` to Next.js and `/admin/` to Vite, and
 * neither response passes through the gateway — helmet here only ever decorates JSON. So the
 * content directives are all `'none'`: a backstop for a browser that somehow renders a response
 * body, not a policy any real page has to live within.
 */
export function helmetOptions(env: HelmetPolicyEnv): HelmetOptions {
  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
      },
    },
    // HSTS from http://localhost:8190 would pin EVERY project on localhost to https for six
    // months — a machine-wide problem produced by one dev stack.
    hsts: isDevelopment(env.APP_ENV)
      ? false
      : { maxAge: HSTS_MAX_AGE_SECONDS, includeSubDomains: true },
    // The one helmet default that can break a legitimately cross-origin browser fetch, so it
    // tracks the CORS allow-list instead of being pinned to either value.
    crossOriginResourcePolicy: {
      policy:
        env.CORS_ALLOWED_ORIGINS.length > 0 ? 'cross-origin' : 'same-origin',
    },
    // Explicit: COEP buys nothing for a JSON API and breaks embedders for no gain.
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
  };
}
