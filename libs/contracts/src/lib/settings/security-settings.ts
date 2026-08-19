import { z } from 'zod';

/**
 * The `security` settings group — today, the gateway's rate-limit policies (P8.10.A).
 *
 * These numbers live in contracts rather than settings-service because BOTH sides need the same
 * ones: settings-service as the U9 coded default, and the gateway as its fail-open floor when the
 * broker is unreachable. Two copies would drift, and the copy that drifts is the one an operator
 * never sees. Precedent: `integration-catalog.ts`.
 */
export const SECURITY_GROUP = 'security';
export const SECURITY_SECTION_RATE_LIMIT = 'rateLimit';

/**
 * Which bucket a route counts against. Separate buckets by design — flooding `/auth/login` must
 * not consume the budget a real visitor needs to submit a lead. `none` is the exemption marker
 * (health checks), not a bucket, so it carries no numbers.
 */
export const rateLimitPolicyIdSchema = z.enum([
  'auth',
  'lead',
  'default',
  'none',
]);
export type RateLimitPolicyId = z.infer<typeof rateLimitPolicyIdSchema>;

/** The policies that actually count. `none` is excluded — it has nothing to configure. */
export type CountedRateLimitPolicyId = Exclude<RateLimitPolicyId, 'none'>;

/** How many requests one client ip may make per window. */
export interface RateLimitPolicy {
  limit: number;
  windowSeconds: number;
}

/**
 * The bounds the gateway clamps a resolved value to. An admin typo (`0`, `-5`, a year-long
 * window) must degrade to the coded default, never lock the product out or make the limiter a
 * no-op — the guard can only ever be *less* strict than intended, never a denial of service.
 */
export const RATE_LIMIT_LIMIT_BOUNDS = { min: 1, max: 100_000 } as const;
export const RATE_LIMIT_WINDOW_BOUNDS = { min: 1, max: 86_400 } as const;

/**
 * Coded defaults (U9). Starting numbers, not findings — they are live-tunable from the admin,
 * which is the whole reason the limits are settings-resolved. `lead` is deliberately generous:
 * Gulf mobile carriers use CGNAT heavily, so real visitors share one address.
 */
export const RATE_LIMIT_DEFAULTS: Readonly<
  Record<CountedRateLimitPolicyId, RateLimitPolicy>
> = {
  auth: { limit: 10, windowSeconds: 300 },
  lead: { limit: 20, windowSeconds: 3600 },
  default: { limit: 300, windowSeconds: 60 },
};

/** The kill switch's coded default — limiting is ON unless an operator turns it off. */
export const RATE_LIMIT_ENABLED_DEFAULT = true;

/** The flat dot keys the settings catalog stores, seeds and resolves. */
export const SECURITY_SETTING_KEYS = {
  enabled: 'security.rateLimit.enabled',
  authLimit: 'security.rateLimit.auth.limit',
  authWindowSeconds: 'security.rateLimit.auth.windowSeconds',
  leadLimit: 'security.rateLimit.lead.limit',
  leadWindowSeconds: 'security.rateLimit.lead.windowSeconds',
  defaultLimit: 'security.rateLimit.default.limit',
  defaultWindowSeconds: 'security.rateLimit.default.windowSeconds',
} as const;

export type SecuritySettingKey =
  (typeof SECURITY_SETTING_KEYS)[keyof typeof SECURITY_SETTING_KEYS];

/** The key pair configuring one counted policy. */
export function rateLimitSettingKeys(policy: CountedRateLimitPolicyId): {
  limit: string;
  windowSeconds: string;
} {
  return {
    limit: `${SECURITY_GROUP}.${SECURITY_SECTION_RATE_LIMIT}.${policy}.limit`,
    windowSeconds: `${SECURITY_GROUP}.${SECURITY_SECTION_RATE_LIMIT}.${policy}.windowSeconds`,
  };
}

/** The counted policies in display order. */
export const COUNTED_RATE_LIMIT_POLICIES: readonly CountedRateLimitPolicyId[] =
  ['auth', 'lead', 'default'];
