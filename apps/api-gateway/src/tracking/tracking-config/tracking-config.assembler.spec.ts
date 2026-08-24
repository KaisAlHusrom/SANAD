import {
  CONSENT_SETTING_KEYS,
  DEFAULT_TRACKING_CONFIG,
  TRACKING_GROUP,
  trackingDestinationSettingKeys,
} from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { toPublicTrackingConfig } from './tracking-config.assembler.js';

const ga4 = trackingDestinationSettingKeys('ga4');
const meta = trackingDestinationSettingKeys('metaPixel');

describe('toPublicTrackingConfig', () => {
  it('serves the coded defaults for an untouched group (U9/F7)', () => {
    expect(toPublicTrackingConfig({})).toEqual(DEFAULT_TRACKING_CONFIG);
  });

  it('reflects a configured, enabled destination with its category', () => {
    const config = toPublicTrackingConfig({
      [ga4.enabled]: true,
      [ga4.id]: 'G-ABCDE12345',
    });
    expect(config.destinations).toEqual([
      { id: 'ga4', category: 'analytics', measurementId: 'G-ABCDE12345' },
    ]);
  });

  /**
   * The two halves of the same rule, and the reason this is a filter and not a map: a
   * destination that is off must not ship, and a destination that is on but has no id must not
   * ship either — a loader handed `''` would request a tag that can never work, from a visitor
   * who was asked to consent to it.
   */
  it('omits a destination that is switched off', () => {
    const config = toPublicTrackingConfig({
      [ga4.enabled]: false,
      [ga4.id]: 'G-ABCDE12345',
    });
    expect(config.destinations).toEqual([]);
  });

  it.each([
    ['never set', undefined],
    ['explicitly cleared', null],
    ['an empty string', ''],
    ['only whitespace', '   '],
  ])('omits a destination enabled with an id that is %s', (_label, value) => {
    const config = toPublicTrackingConfig({
      [ga4.enabled]: true,
      ...(value === undefined ? {} : { [ga4.id]: value }),
    });
    expect(config.destinations).toEqual([]);
  });

  it('trims the stored id — a trailing space in a paste must not reach the tag', () => {
    const config = toPublicTrackingConfig({
      [ga4.enabled]: true,
      [ga4.id]: '  G-ABCDE12345 ',
    });
    expect(config.destinations[0]?.measurementId).toBe('G-ABCDE12345');
  });

  it('keeps the registry’s order when several destinations are live', () => {
    const config = toPublicTrackingConfig({
      [meta.enabled]: true,
      [meta.id]: '123456789012345',
      [ga4.enabled]: true,
      [ga4.id]: 'G-ABCDE12345',
    });
    expect(config.destinations.map((d) => d.id)).toEqual(['ga4', 'metaPixel']);
  });

  it('reflects the consent policy an operator has set', () => {
    const config = toPublicTrackingConfig({
      [CONSENT_SETTING_KEYS.bannerEnabled]: false,
      [CONSENT_SETTING_KEYS.policyVersion]: 4,
      [CONSENT_SETTING_KEYS.rememberDays]: 30,
      [CONSENT_SETTING_KEYS.privacyPolicyPath]: '/privacy',
      [CONSENT_SETTING_KEYS.cookiePolicyPath]: '/cookies',
    });
    expect(config.consent).toEqual({
      bannerEnabled: false,
      policyVersion: 4,
      rememberDays: 30,
      privacyPolicyPath: '/privacy',
      cookiePolicyPath: '/cookies',
    });
  });

  /**
   * A half-written group is a real state (a group only ever partially set, a stale cache, a
   * value of the wrong type left by an older shape). The reader is null-safe to the leaf: a
   * junk value falls back to the coded default rather than travelling to the browser (F7).
   */
  it.each([
    [
      'a string where a boolean belongs',
      CONSENT_SETTING_KEYS.bannerEnabled,
      'yes',
    ],
    [
      'a string where a number belongs',
      CONSENT_SETTING_KEYS.rememberDays,
      '30',
    ],
    [
      'a number where a path belongs',
      CONSENT_SETTING_KEYS.privacyPolicyPath,
      7,
    ],
  ])('falls back to the coded default for %s', (_label, key, value) => {
    const config = toPublicTrackingConfig({ [key]: value });
    expect(config.consent).toEqual(DEFAULT_TRACKING_CONFIG.consent);
  });

  it('carries nothing but the tracking group — no stray resolved key can leak', () => {
    const config = toPublicTrackingConfig({
      'branding.contact.email': 'owner@sanad.example',
      'security.rateLimit.lead.limit': 20,
      integration_secret: 'never',
    });
    expect(JSON.stringify(config)).not.toContain('owner@sanad.example');
    expect(JSON.stringify(config)).not.toContain('never');
    expect(Object.keys(config)).toEqual(['consent', 'destinations']);
  });

  it('reads the group name from the contract, so caller and assembler cannot drift', () => {
    expect(TRACKING_GROUP).toBe('tracking');
  });
});
