import {
  COUNTED_RATE_LIMIT_POLICIES,
  LEAD_DEDUP_ENABLED_DEFAULT,
  LEAD_DEDUP_SETTING_KEYS,
  LEAD_DEDUP_WINDOW_BOUNDS,
  LEAD_DEDUP_WINDOW_SECONDS_DEFAULT,
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_ENABLED_DEFAULT,
  RATE_LIMIT_LIMIT_BOUNDS,
  RATE_LIMIT_WINDOW_BOUNDS,
  SECURITY_GROUP,
  SECURITY_SECTION_LEADS,
  SECURITY_SECTION_RATE_LIMIT,
  SECURITY_SETTING_KEYS,
  rateLimitSettingKeys,
  type SettingType,
} from '@sanad/contracts';
import type { ResolvedValue } from '../resolved-value.js';

export { SECURITY_GROUP, SECURITY_SECTION_LEADS, SECURITY_SECTION_RATE_LIMIT };

/**
 * One security setting. Unlike a `BrandingField` there is no `path`: security settings are flat
 * scalars with no record tree behind them, so the key IS the address.
 */
export interface SecurityField {
  key: string;
  /**
   * Which section of the group it renders under. Carried per field rather than assumed: the
   * group held exactly one section until P8.10.B2 added `leads`, and a hard-coded section is
   * how the second one silently lands in the wrong tab.
   */
  section: string;
  type: SettingType;
  /** Inclusive range, for `number` fields — the same bounds the gateway clamps to (U3). */
  bounds?: { min: number; max: number };
}

/**
 * The `security` group's fields — the gateway's edge rate limits (P8.10.A) and the lead
 * duplicate window (P8.10.B2), both made tunable from the admin so they can be adjusted
 * mid-campaign without a redeploy. Declaration order is section order in the UI.
 */
export const SECURITY_FIELDS: readonly SecurityField[] = [
  {
    key: SECURITY_SETTING_KEYS.enabled,
    section: SECURITY_SECTION_RATE_LIMIT,
    type: 'boolean',
  },
  ...COUNTED_RATE_LIMIT_POLICIES.flatMap((policy): SecurityField[] => {
    const keys = rateLimitSettingKeys(policy);
    return [
      {
        key: keys.limit,
        section: SECURITY_SECTION_RATE_LIMIT,
        type: 'number',
        bounds: RATE_LIMIT_LIMIT_BOUNDS,
      },
      {
        key: keys.windowSeconds,
        section: SECURITY_SECTION_RATE_LIMIT,
        type: 'number',
        bounds: RATE_LIMIT_WINDOW_BOUNDS,
      },
    ];
  }),
  {
    key: LEAD_DEDUP_SETTING_KEYS.enabled,
    section: SECURITY_SECTION_LEADS,
    type: 'boolean',
  },
  {
    key: LEAD_DEDUP_SETTING_KEYS.windowSeconds,
    section: SECURITY_SECTION_LEADS,
    type: 'number',
    bounds: LEAD_DEDUP_WINDOW_BOUNDS,
  },
];

/**
 * The coded defaults (U9), derived from the CONTRACT rather than restated here — the gateway
 * uses the same constants as its fail-open floor, and a second copy would mean the limit an
 * operator sees is not the limit that applies (U3).
 */
export const SECURITY_SETTING_DEFAULTS: Readonly<
  Record<string, ResolvedValue>
> = {
  [SECURITY_SETTING_KEYS.enabled]: RATE_LIMIT_ENABLED_DEFAULT,
  ...Object.fromEntries(
    COUNTED_RATE_LIMIT_POLICIES.flatMap((policy) => {
      const keys = rateLimitSettingKeys(policy);
      const coded = RATE_LIMIT_DEFAULTS[policy];
      return [
        [keys.limit, coded.limit],
        [keys.windowSeconds, coded.windowSeconds],
      ];
    }),
  ),
  [LEAD_DEDUP_SETTING_KEYS.enabled]: LEAD_DEDUP_ENABLED_DEFAULT,
  [LEAD_DEDUP_SETTING_KEYS.windowSeconds]: LEAD_DEDUP_WINDOW_SECONDS_DEFAULT,
};
