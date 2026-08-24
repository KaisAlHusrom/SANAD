/**
 * The `tracking` settings group — the consent policy (this file) and the ad destinations
 * (`tracking-destination.ts`). The coded defaults live in contracts rather than in the
 * settings-service because both sides need the same ones: the service as the U9 terminal
 * fallback, and the gateway as what it serves when settings-service cannot be reached.
 * Precedent: `../settings/security-settings.ts`.
 */
export const TRACKING_GROUP = 'tracking';
export const TRACKING_SECTION_CONSENT = 'consent';
export const TRACKING_SECTION_DESTINATIONS = 'destinations';

/** The flat dot keys the settings catalog stores, seeds and resolves for the consent policy. */
export const CONSENT_SETTING_KEYS = {
  bannerEnabled: 'tracking.consent.bannerEnabled',
  policyVersion: 'tracking.consent.policyVersion',
  rememberDays: 'tracking.consent.rememberDays',
  privacyPolicyPath: 'tracking.consent.privacyPolicyPath',
  cookiePolicyPath: 'tracking.consent.cookiePolicyPath',
} as const;

export type ConsentSettingKey =
  (typeof CONSENT_SETTING_KEYS)[keyof typeof CONSENT_SETTING_KEYS];

/**
 * The banner ships ON. A tracking layer that loads without asking is the unlawful default, so
 * the safe state is the one an operator has to deliberately leave.
 */
export const CONSENT_BANNER_ENABLED_DEFAULT = true;

/**
 * Bumping the version re-asks every visitor. It starts at 1 because 0 is the natural marker
 * for "this browser has never been asked" — a version that could reach 0 would make a real
 * decision indistinguishable from no decision at all.
 */
export const CONSENT_POLICY_VERSION_DEFAULT = 1;
export const CONSENT_POLICY_VERSION_BOUNDS = {
  min: 1,
  max: 1_000_000,
} as const;

/**
 * How long a decision is remembered. Capped at two years: a consent record older than that
 * is not a decision any more, it is an assumption.
 */
export const CONSENT_REMEMBER_DAYS_DEFAULT = 180;
export const CONSENT_REMEMBER_DAYS_BOUNDS = { min: 1, max: 730 } as const;

/**
 * A policy link is either a site-relative path (the CMS page P8.23.B seeds) or an absolute
 * **https** URL (a group-level notice hosted elsewhere — forbidding that would force a copy
 * that then goes stale). Plain `http` and every scheme-like string are rejected: the value is
 * rendered as an `href`, so `javascript:` must never survive validation.
 */
export const POLICY_PATH_PATTERN = '^(?:/[\\w\\-./]*|https://[^\\s]+)$';

/**
 * Both policy links default to **unset**, not to `/privacy`. Until P8.23.B seeds the legal
 * pages, a coded default would point the banner at a 404 — worse than showing no link at all.
 * The admin card warns while they are unset, and the banner omits the link (F7).
 */
export const CONSENT_PRIVACY_POLICY_PATH_DEFAULT: string | null = null;
export const CONSENT_COOKIE_POLICY_PATH_DEFAULT: string | null = null;
