import { CONSENT_SETTING_KEYS, SECURITY_SETTING_KEYS } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { BRANDING_SETTING_DEFAULTS } from '../branding-catalog.js';
import { SECURITY_SETTING_DEFAULTS } from '../security-catalog/security-catalog.js';
import { TRACKING_SETTING_DEFAULTS } from '../tracking-catalog/tracking-catalog.js';
import { SETTINGS_DEFAULTS } from './settings-defaults.js';

describe('merged settings defaults', () => {
  it('carries all three groups — it was branding-only until P8.10.A', () => {
    expect(SETTINGS_DEFAULTS['branding.brand.name']).toBeDefined();
    expect(SETTINGS_DEFAULTS[SECURITY_SETTING_KEYS.leadLimit]).toBe(20);
    expect(SETTINGS_DEFAULTS[CONSENT_SETTING_KEYS.bannerEnabled]).toBe(true);
  });

  /**
   * A key present in two groups would silently shadow — the merge is a spread, so the later
   * group would win and one group's coded default would vanish with no error anywhere.
   */
  it('has no key collision across groups', () => {
    const groups = [
      Object.keys(BRANDING_SETTING_DEFAULTS),
      Object.keys(SECURITY_SETTING_DEFAULTS),
      Object.keys(TRACKING_SETTING_DEFAULTS),
    ];
    const all = groups.flat();
    expect(new Set(all).size).toBe(all.length);
    expect(Object.keys(SETTINGS_DEFAULTS).length).toBe(all.length);
  });

  /**
   * `null` is a real coded default here (an unset policy link, an unentered vendor id) and the
   * spread must carry it. A merge that dropped nullish entries would make those keys resolve
   * to `undefined` — which the resolver treats as "no such key", not as "unset".
   */
  it('keeps a null-valued default rather than dropping the key', () => {
    expect(CONSENT_SETTING_KEYS.privacyPolicyPath in SETTINGS_DEFAULTS).toBe(
      true,
    );
    expect(
      SETTINGS_DEFAULTS[CONSENT_SETTING_KEYS.privacyPolicyPath],
    ).toBeNull();
  });
});
