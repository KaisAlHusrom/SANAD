import {
  CONSENT_BANNER_ENABLED_DEFAULT,
  CONSENT_COOKIE_POLICY_PATH_DEFAULT,
  CONSENT_POLICY_VERSION_DEFAULT,
  CONSENT_PRIVACY_POLICY_PATH_DEFAULT,
  CONSENT_REMEMBER_DAYS_DEFAULT,
} from './tracking-settings.js';
import type { PublicTrackingConfig } from './tracking-config.types.js';

/**
 * What `GET /api/tracking-config` serves when nothing is configured — and what it serves when
 * settings-service cannot be reached at all (U9/F7/U30b). **No destinations**: an unconfigured
 * platform must load no third-party tag whatsoever, so "we could not read the settings" and
 * "the operator has set nothing up" collapse to the same, safe answer.
 */
export const DEFAULT_TRACKING_CONFIG: PublicTrackingConfig = {
  consent: {
    bannerEnabled: CONSENT_BANNER_ENABLED_DEFAULT,
    policyVersion: CONSENT_POLICY_VERSION_DEFAULT,
    rememberDays: CONSENT_REMEMBER_DAYS_DEFAULT,
    privacyPolicyPath: CONSENT_PRIVACY_POLICY_PATH_DEFAULT,
    cookiePolicyPath: CONSENT_COOKIE_POLICY_PATH_DEFAULT,
  },
  destinations: [],
};
