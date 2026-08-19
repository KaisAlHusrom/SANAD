import { SECURITY_SETTING_KEYS } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { BRANDING_SETTING_DEFAULTS } from '../branding-catalog.js';
import { SECURITY_SETTING_DEFAULTS } from '../security-catalog/security-catalog.js';
import { SETTINGS_DEFAULTS } from './settings-defaults.js';

describe('merged settings defaults', () => {
  it('carries both groups — it was branding-only until P8.10.A', () => {
    expect(SETTINGS_DEFAULTS['branding.brand.name']).toBeDefined();
    expect(SETTINGS_DEFAULTS[SECURITY_SETTING_KEYS.leadLimit]).toBe(20);
  });

  /**
   * A key present in two groups would silently shadow — the merge is a spread, so the later
   * group would win and one group's coded default would vanish with no error anywhere.
   */
  it('has no key collision across groups', () => {
    const branding = Object.keys(BRANDING_SETTING_DEFAULTS);
    const security = Object.keys(SECURITY_SETTING_DEFAULTS);
    expect(branding.filter((key) => security.includes(key))).toEqual([]);
    expect(Object.keys(SETTINGS_DEFAULTS).length).toBe(
      branding.length + security.length,
    );
  });
});
