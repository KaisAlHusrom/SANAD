import { SECURITY_GROUP } from './security-settings.js';

/**
 * The `security → leads` section (P8.10.B2) — how long two submissions from the same person are
 * treated as one lead instead of two rows and two team emails.
 *
 * Settings-resolved rather than a constant for the same reason the rate limits are (P8.10.A): the
 * right window is a campaign decision, not an engineering one. Too long and a legitimate second
 * enquiry is swallowed; too short and the inbox floods on the day ads go live — and the owner must
 * be able to move it from the admin without a redeploy.
 *
 * These numbers live in contracts because BOTH sides need them: settings-service as the U9 coded
 * default, and content-service as its fail-open floor when the broker is unreachable.
 */
export const SECURITY_SECTION_LEADS = 'leads';

/** The flat dot keys the settings catalog stores, seeds and resolves. */
export const LEAD_DEDUP_SETTING_KEYS = {
  enabled: `${SECURITY_GROUP}.${SECURITY_SECTION_LEADS}.duplicateDetectionEnabled`,
  windowSeconds: `${SECURITY_GROUP}.${SECURITY_SECTION_LEADS}.duplicateWindowSeconds`,
} as const;

export type LeadDedupSettingKey =
  (typeof LEAD_DEDUP_SETTING_KEYS)[keyof typeof LEAD_DEDUP_SETTING_KEYS];

/**
 * One minute to thirty days. The floor keeps a typo from turning detection into a no-op that still
 * *looks* enabled; the ceiling keeps a lead from being folded into a months-old row whose thread the
 * team has long since closed.
 */
export const LEAD_DEDUP_WINDOW_BOUNDS = { min: 60, max: 2_592_000 } as const;

/** 24 hours — one working day, so a same-day nudge folds and a next-week enquiry does not. */
export const LEAD_DEDUP_WINDOW_SECONDS_DEFAULT = 86_400;

/** Detection is ON unless an operator turns it off (U9). */
export const LEAD_DEDUP_ENABLED_DEFAULT = true;

/** The whole configuration at one instant, as content-service consumes it. */
export interface LeadDedupSettings {
  enabled: boolean;
  windowSeconds: number;
}

/** The coded defaults, as one object — the fail-open value when settings cannot be reached. */
export const LEAD_DEDUP_DEFAULTS: LeadDedupSettings = {
  enabled: LEAD_DEDUP_ENABLED_DEFAULT,
  windowSeconds: LEAD_DEDUP_WINDOW_SECONDS_DEFAULT,
};
