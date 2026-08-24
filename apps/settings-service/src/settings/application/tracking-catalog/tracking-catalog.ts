import {
  CONSENT_BANNER_ENABLED_DEFAULT,
  CONSENT_COOKIE_POLICY_PATH_DEFAULT,
  CONSENT_POLICY_VERSION_BOUNDS,
  CONSENT_POLICY_VERSION_DEFAULT,
  CONSENT_PRIVACY_POLICY_PATH_DEFAULT,
  CONSENT_REMEMBER_DAYS_BOUNDS,
  CONSENT_REMEMBER_DAYS_DEFAULT,
  CONSENT_SETTING_KEYS,
  POLICY_PATH_PATTERN,
  TRACKING_DESTINATIONS,
  TRACKING_GROUP,
  TRACKING_SECTION_CONSENT,
  TRACKING_SECTION_DESTINATIONS,
  trackingDestinationSettingKeys,
  type SettingType,
} from '@sanad/contracts';
import type { ResolvedValue } from '../resolved-value.js';

export {
  TRACKING_GROUP,
  TRACKING_SECTION_CONSENT,
  TRACKING_SECTION_DESTINATIONS,
};

/**
 * One tracking setting. Like `SecurityField` these are flat scalars with no record tree behind
 * them, so the key IS the address — plus a `pattern`, which security had no need for: a rate
 * limit is a number the bounds already police, while a vendor id is a string that can be
 * perfectly well-typed and still completely wrong.
 */
export interface TrackingField {
  key: string;
  section: string;
  type: SettingType;
  bounds?: { min: number; max: number };
  pattern?: string;
  patternExample?: string;
}

const consentFields: readonly TrackingField[] = [
  {
    key: CONSENT_SETTING_KEYS.bannerEnabled,
    section: TRACKING_SECTION_CONSENT,
    type: 'boolean',
  },
  {
    key: CONSENT_SETTING_KEYS.policyVersion,
    section: TRACKING_SECTION_CONSENT,
    type: 'number',
    bounds: CONSENT_POLICY_VERSION_BOUNDS,
  },
  {
    key: CONSENT_SETTING_KEYS.rememberDays,
    section: TRACKING_SECTION_CONSENT,
    type: 'number',
    bounds: CONSENT_REMEMBER_DAYS_BOUNDS,
  },
  {
    key: CONSENT_SETTING_KEYS.privacyPolicyPath,
    section: TRACKING_SECTION_CONSENT,
    type: 'text',
    pattern: POLICY_PATH_PATTERN,
    patternExample: '/privacy',
  },
  {
    key: CONSENT_SETTING_KEYS.cookiePolicyPath,
    section: TRACKING_SECTION_CONSENT,
    type: 'text',
    pattern: POLICY_PATH_PATTERN,
    patternExample: '/cookies',
  },
];

const destinationFields: readonly TrackingField[] =
  TRACKING_DESTINATIONS.flatMap((destination): TrackingField[] => {
    const keys = trackingDestinationSettingKeys(destination.id);
    return [
      {
        key: keys.enabled,
        section: TRACKING_SECTION_DESTINATIONS,
        type: 'boolean',
      },
      {
        key: keys.id,
        section: TRACKING_SECTION_DESTINATIONS,
        type: 'text',
        pattern: destination.idPattern,
        patternExample: destination.idExample,
      },
    ];
  });

/**
 * The `tracking` group's fields — the consent policy the banner obeys (P8.23.A2) and the ad
 * destinations the tag layer loads (P8.23.A3). Declaration order is display order.
 */
export const TRACKING_FIELDS: readonly TrackingField[] = [
  ...consentFields,
  ...destinationFields,
];

/**
 * The coded defaults (U9), derived from the CONTRACT rather than restated here — the gateway
 * serves the same numbers when settings-service is unreachable, and a second copy would mean
 * the policy an operator sees is not the policy that applies (U3).
 *
 * Every destination ships **off with a null id**: an unconfigured platform must load no
 * third-party tag at all, and `null` (rather than `''`) is what makes "nobody entered one"
 * distinguishable from "somebody entered nothing".
 */
export const TRACKING_SETTING_DEFAULTS: Readonly<
  Record<string, ResolvedValue>
> = {
  [CONSENT_SETTING_KEYS.bannerEnabled]: CONSENT_BANNER_ENABLED_DEFAULT,
  [CONSENT_SETTING_KEYS.policyVersion]: CONSENT_POLICY_VERSION_DEFAULT,
  [CONSENT_SETTING_KEYS.rememberDays]: CONSENT_REMEMBER_DAYS_DEFAULT,
  [CONSENT_SETTING_KEYS.privacyPolicyPath]: CONSENT_PRIVACY_POLICY_PATH_DEFAULT,
  [CONSENT_SETTING_KEYS.cookiePolicyPath]: CONSENT_COOKIE_POLICY_PATH_DEFAULT,
  ...Object.fromEntries(
    TRACKING_DESTINATIONS.flatMap((destination) => {
      const keys = trackingDestinationSettingKeys(destination.id);
      return [
        [keys.enabled, false],
        [keys.id, null],
      ];
    }),
  ),
};
