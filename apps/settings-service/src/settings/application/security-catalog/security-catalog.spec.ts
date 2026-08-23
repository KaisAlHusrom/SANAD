import {
  LEAD_DEDUP_ENABLED_DEFAULT,
  LEAD_DEDUP_SETTING_KEYS,
  LEAD_DEDUP_WINDOW_SECONDS_DEFAULT,
  RATE_LIMIT_DEFAULTS,
  RATE_LIMIT_ENABLED_DEFAULT,
  SECURITY_SECTION_LEADS,
  SECURITY_SECTION_RATE_LIMIT,
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
      new Set([
        ...Object.values(SECURITY_SETTING_KEYS),
        ...Object.values(LEAD_DEDUP_SETTING_KEYS),
      ]),
    );
    expect(declared.length).toBe(new Set(declared).size);
  });

  it('assigns every field to a real section of the group', () => {
    const sections = new Set(SECURITY_FIELDS.map((field) => field.section));
    expect(sections).toEqual(
      new Set([SECURITY_SECTION_RATE_LIMIT, SECURITY_SECTION_LEADS]),
    );
  });

  it('renders each kill switch as a boolean and every tunable as a number', () => {
    const byKey = new Map(SECURITY_FIELDS.map((f) => [f.key, f.type]));
    const switches: string[] = [
      SECURITY_SETTING_KEYS.enabled,
      LEAD_DEDUP_SETTING_KEYS.enabled,
    ];
    for (const key of switches) {
      expect(byKey.get(key), key).toBe('boolean');
    }
    const tunables = [
      ...Object.values(SECURITY_SETTING_KEYS),
      ...Object.values(LEAD_DEDUP_SETTING_KEYS),
    ].filter((key) => !switches.includes(key));
    for (const key of tunables) {
      expect(byKey.get(key), key).toBe('number');
    }
  });

  it('gives every number field the bounds that make a bad value a NAMED rejection (U0)', () => {
    for (const field of SECURITY_FIELDS.filter((f) => f.type === 'number')) {
      expect(field.bounds, field.key).toBeDefined();
      expect(field.bounds?.min, field.key).toBeLessThan(field.bounds?.max ?? 0);
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
      [LEAD_DEDUP_SETTING_KEYS.enabled]: LEAD_DEDUP_ENABLED_DEFAULT,
      [LEAD_DEDUP_SETTING_KEYS.windowSeconds]:
        LEAD_DEDUP_WINDOW_SECONDS_DEFAULT,
    });
  });

  it('has a coded default for every field it declares (F7)', () => {
    for (const field of SECURITY_FIELDS) {
      expect(SECURITY_SETTING_DEFAULTS[field.key]).toBeDefined();
    }
  });
});
