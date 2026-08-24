import {
  CONSENT_SETTING_KEYS,
  DEFAULT_TRACKING_CONFIG,
  POLICY_PATH_PATTERN,
  TRACKING_DESTINATIONS,
  trackingDestinationSettingKeys,
  type PublicTrackingConfig,
  type PublicTrackingDestination,
} from '@sanad/contracts';

/** A resolved settings group as the settings-service returns it: flat key → value. */
export type ResolvedGroup = Readonly<Record<string, unknown>>;

const policyPath = new RegExp(POLICY_PATH_PATTERN);

function boolean(
  group: ResolvedGroup,
  key: string,
  fallback: boolean,
): boolean {
  const value = group[key];
  return typeof value === 'boolean' ? value : fallback;
}

function wholeNumber(
  group: ResolvedGroup,
  key: string,
  fallback: number,
): number {
  const value = group[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * A link is rendered as an `href`, so a value that does not match the shape the writer
 * enforces is treated as unset rather than passed through — the pattern could only have been
 * bypassed by a direct DB edit or a row predating the rule, and neither is a reason to put an
 * arbitrary string into the page.
 */
function link(group: ResolvedGroup, key: string): string | null {
  const value = group[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed !== '' && policyPath.test(trimmed) ? trimmed : null;
}

/**
 * Project a resolved `tracking` group onto the **public** config the website reads.
 *
 * Two properties carry the whole phase: it is null-safe to every leaf (a half-written group,
 * a stale cache or a value of the wrong type falls back to the coded default, F7), and a
 * destination ships **only** when it is both enabled and actually configured — a loader handed
 * a blank id would request a tag that can never work, from a visitor who was asked to consent
 * to it.
 */
export function toPublicTrackingConfig(
  group: ResolvedGroup,
): PublicTrackingConfig {
  const codedConsent = DEFAULT_TRACKING_CONFIG.consent;
  const destinations: PublicTrackingDestination[] = [];

  for (const destination of TRACKING_DESTINATIONS) {
    const keys = trackingDestinationSettingKeys(destination.id);
    if (!boolean(group, keys.enabled, false)) continue;
    const raw = group[keys.id];
    const measurementId = typeof raw === 'string' ? raw.trim() : '';
    if (measurementId === '') continue;
    destinations.push({
      id: destination.id,
      category: destination.category,
      measurementId,
    });
  }

  return {
    consent: {
      bannerEnabled: boolean(
        group,
        CONSENT_SETTING_KEYS.bannerEnabled,
        codedConsent.bannerEnabled,
      ),
      policyVersion: wholeNumber(
        group,
        CONSENT_SETTING_KEYS.policyVersion,
        codedConsent.policyVersion,
      ),
      rememberDays: wholeNumber(
        group,
        CONSENT_SETTING_KEYS.rememberDays,
        codedConsent.rememberDays,
      ),
      privacyPolicyPath: link(group, CONSENT_SETTING_KEYS.privacyPolicyPath),
      cookiePolicyPath: link(group, CONSENT_SETTING_KEYS.cookiePolicyPath),
    },
    destinations,
  };
}
