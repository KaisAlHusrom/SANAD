import {
  CONSENT_BANNER_ENABLED_DEFAULT,
  CONSENT_POLICY_VERSION_DEFAULT,
  CONSENT_REMEMBER_DAYS_DEFAULT,
  CONSENT_SETTING_KEYS,
  TRACKING_DESTINATIONS,
  TRACKING_SECTION_CONSENT,
  TRACKING_SECTION_DESTINATIONS,
  trackingDestinationSettingKeys,
} from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import {
  TRACKING_FIELDS,
  TRACKING_SETTING_DEFAULTS,
} from './tracking-catalog.js';

describe('tracking catalog', () => {
  it('declares every contract key exactly once', () => {
    const declared = TRACKING_FIELDS.map((field) => field.key);
    const expected = [
      ...Object.values(CONSENT_SETTING_KEYS),
      ...TRACKING_DESTINATIONS.flatMap((destination) => {
        const pair = trackingDestinationSettingKeys(destination.id);
        return [pair.enabled, pair.id];
      }),
    ];
    expect(new Set(declared)).toEqual(new Set(expected));
    expect(declared.length).toBe(new Set(declared).size);
  });

  it('assigns every field to a real section of the group', () => {
    expect(new Set(TRACKING_FIELDS.map((field) => field.section))).toEqual(
      new Set([TRACKING_SECTION_CONSENT, TRACKING_SECTION_DESTINATIONS]),
    );
  });

  it('has a coded default for every field it declares (F7)', () => {
    for (const field of TRACKING_FIELDS) {
      expect(
        TRACKING_SETTING_DEFAULTS[field.key],
        field.key,
      ).not.toBeUndefined();
    }
  });

  it('takes its coded defaults from the contract, not a second copy', () => {
    expect(TRACKING_SETTING_DEFAULTS[CONSENT_SETTING_KEYS.bannerEnabled]).toBe(
      CONSENT_BANNER_ENABLED_DEFAULT,
    );
    expect(TRACKING_SETTING_DEFAULTS[CONSENT_SETTING_KEYS.policyVersion]).toBe(
      CONSENT_POLICY_VERSION_DEFAULT,
    );
    expect(TRACKING_SETTING_DEFAULTS[CONSENT_SETTING_KEYS.rememberDays]).toBe(
      CONSENT_REMEMBER_DAYS_DEFAULT,
    );
  });

  // Nothing may load until an operator deliberately turns it on, and an id nobody has entered
  // must resolve to "unset", never to an empty string that a loader would happily use.
  it('ships every destination OFF with no id', () => {
    for (const destination of TRACKING_DESTINATIONS) {
      const keys = trackingDestinationSettingKeys(destination.id);
      expect(TRACKING_SETTING_DEFAULTS[keys.enabled], keys.enabled).toBe(false);
      expect(TRACKING_SETTING_DEFAULTS[keys.id], keys.id).toBeNull();
    }
  });

  it('leaves both policy links unset rather than aimed at a page that does not exist yet', () => {
    expect(
      TRACKING_SETTING_DEFAULTS[CONSENT_SETTING_KEYS.privacyPolicyPath],
    ).toBeNull();
    expect(
      TRACKING_SETTING_DEFAULTS[CONSENT_SETTING_KEYS.cookiePolicyPath],
    ).toBeNull();
  });

  it('gives every number field bounds, so a bad value is a NAMED rejection (U0)', () => {
    for (const field of TRACKING_FIELDS.filter((f) => f.type === 'number')) {
      expect(field.bounds, field.key).toBeDefined();
      expect(field.bounds?.min, field.key).toBeLessThan(field.bounds?.max ?? 0);
    }
  });

  /**
   * The whole reason `pattern` was added to the descriptor: a vendor id that cannot possibly be
   * right must be refused as it is typed. A destination id field with no pattern would be a
   * silent hole — the paste lands, the campaign reports nothing, and nobody learns why.
   */
  it('gives every destination id field its own pattern and example', () => {
    for (const destination of TRACKING_DESTINATIONS) {
      const key = trackingDestinationSettingKeys(destination.id).id;
      const field = TRACKING_FIELDS.find((f) => f.key === key);
      expect(field?.pattern, key).toBe(destination.idPattern);
      expect(field?.patternExample, key).toBe(destination.idExample);
    }
  });

  it('patterns the policy paths too — the value is rendered as an href', () => {
    for (const key of [
      CONSENT_SETTING_KEYS.privacyPolicyPath,
      CONSENT_SETTING_KEYS.cookiePolicyPath,
    ]) {
      expect(
        TRACKING_FIELDS.find((f) => f.key === key)?.pattern,
        key,
      ).toBeDefined();
    }
  });
});
