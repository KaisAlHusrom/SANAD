import {
  COUNTED_RATE_LIMIT_POLICIES,
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_ENABLED_DEFAULT,
  RATE_LIMIT_LIMIT_BOUNDS,
  RATE_LIMIT_WINDOW_BOUNDS,
  SECURITY_GROUP,
  SECURITY_SECTION_RATE_LIMIT,
  SECURITY_SETTING_KEYS,
  rateLimitSettingKeys,
  type SettingType,
} from '@sanad/contracts';
import type { ResolvedValue } from '../resolved-value.js';

export { SECURITY_GROUP, SECURITY_SECTION_RATE_LIMIT };

/**
 * One security setting. Unlike a `BrandingField` there is no `path`: security settings are flat
 * scalars with no record tree behind them, so the key IS the address.
 */
export interface SecurityField {
  key: string;
  type: SettingType;
  /** Inclusive range, for `number` fields — the same bounds the gateway clamps to (U3). */
  bounds?: { min: number; max: number };
}

/**
 * The `security` group's fields (P8.10.A) — the gateway's edge rate limits, made tunable from
 * the admin so a limit can be tightened mid-campaign without a redeploy.
 */
export const SECURITY_FIELDS: readonly SecurityField[] = [
  { key: SECURITY_SETTING_KEYS.enabled, type: 'boolean' },
  ...COUNTED_RATE_LIMIT_POLICIES.flatMap((policy): SecurityField[] => {
    const keys = rateLimitSettingKeys(policy);
    return [
      { key: keys.limit, type: 'number', bounds: RATE_LIMIT_LIMIT_BOUNDS },
      {
        key: keys.windowSeconds,
        type: 'number',
        bounds: RATE_LIMIT_WINDOW_BOUNDS,
      },
    ];
  }),
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
};
