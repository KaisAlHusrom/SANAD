import {
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_ENABLED_DEFAULT,
  SECURITY_SETTING_KEYS,
} from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import {
  SECURITY_FIELDS,
  SECURITY_SETTING_DEFAULTS,
} from './security-catalog.js';

describe('security catalog', () => {
  it('declares every contract key exactly once', () => {
    const declared = SECURITY_FIELDS.map((field) => field.key);
    expect(new Set(declared)).toEqual(
      new Set(Object.values(SECURITY_SETTING_KEYS)),
    );
    expect(declared.length).toBe(new Set(declared).size);
  });

  it('renders the kill switch as a boolean and the rest as numbers', () => {
    const byKey = new Map(SECURITY_FIELDS.map((f) => [f.key, f.type]));
    expect(byKey.get(SECURITY_SETTING_KEYS.enabled)).toBe('boolean');
    for (const key of Object.values(SECURITY_SETTING_KEYS)) {
      if (key !== SECURITY_SETTING_KEYS.enabled) {
        expect(byKey.get(key)).toBe('number');
      }
    }
  });

  // The gateway falls back to the SAME numbers when the broker is unreachable, so a drift
  // here would mean the limit an operator sees is not the limit that applies (U3).
  it('takes its coded defaults from the contract, not a second copy', () => {
    expect(SECURITY_SETTING_DEFAULTS).toEqual({
      [SECURITY_SETTING_KEYS.enabled]: RATE_LIMIT_ENABLED_DEFAULT,
      [SECURITY_SETTING_KEYS.authLimit]: RATE_LIMIT_DEFAULTS.auth.limit,
      [SECURITY_SETTING_KEYS.authWindowSeconds]:
        RATE_LIMIT_DEFAULTS.auth.windowSeconds,
      [SECURITY_SETTING_KEYS.leadLimit]: RATE_LIMIT_DEFAULTS.lead.limit,
      [SECURITY_SETTING_KEYS.leadWindowSeconds]:
        RATE_LIMIT_DEFAULTS.lead.windowSeconds,
      [SECURITY_SETTING_KEYS.defaultLimit]: RATE_LIMIT_DEFAULTS.default.limit,
      [SECURITY_SETTING_KEYS.defaultWindowSeconds]:
        RATE_LIMIT_DEFAULTS.default.windowSeconds,
    });
  });

  it('has a coded default for every field it declares (F7)', () => {
    for (const field of SECURITY_FIELDS) {
      expect(SECURITY_SETTING_DEFAULTS[field.key]).toBeDefined();
    }
  });
});
