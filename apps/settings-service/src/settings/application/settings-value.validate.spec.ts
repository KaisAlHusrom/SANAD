import { RpcException } from '@nestjs/microservices';
import { describe, expect, it } from 'vitest';
import { assertValidSettingValue } from './settings-value.validate.js';

describe('assertValidSettingValue (N7)', () => {
  it('accepts a well-formed localized object', () => {
    expect(() =>
      assertValidSettingValue('branding.brand.name', 'localized_text', {
        ar: 'سَنَد',
        en: 'Sanad',
      }),
    ).not.toThrow();
  });

  it('CLEARS a nullable localized leaf with null (U9 — back to the coded default)', () => {
    // `contact.address` is `LocalizedText | null` in the contract: "set or explicitly unset".
    // Rejecting null made emptying the field in the admin UI fail instead of clearing it.
    expect(() =>
      assertValidSettingValue(
        'branding.contact.address',
        'localized_text',
        null,
      ),
    ).not.toThrow();
  });

  it('still rejects a malformed localized value', () => {
    expect(
      () =>
        assertValidSettingValue(
          'branding.brand.name',
          'localized_text',
          'plain',
        ),
      // A keyed 400 now, not prose — and an `RpcException`, so the status actually survives
      // the broker (the 2026-07-19 "validation error surfaced as 500" bug). U24/MS2.
    ).toThrow(RpcException);
    try {
      assertValidSettingValue('branding.contact.address', 'localized_text', 5);
    } catch (error) {
      expect((error as RpcException).getError()).toEqual({
        statusCode: 400,
        messageKey: 'settings.value.expected.localizedText',
        params: { key: 'branding.contact.address' },
      });
    }
  });

  it('accepts null for the nullable scalar types and rejects wrong primitives', () => {
    for (const type of ['text', 'color', 'url', 'image', 'select'] as const) {
      expect(() => assertValidSettingValue('k', type, null)).not.toThrow();
      expect(() => assertValidSettingValue('k', type, 5)).toThrow();
    }
    expect(() => assertValidSettingValue('k', 'boolean', true)).not.toThrow();
    expect(() => assertValidSettingValue('k', 'number', 3)).not.toThrow();
  });
});

describe('numeric bounds (P8.10.A)', () => {
  const bounds = { min: 1, max: 86_400 };

  it('accepts a value inside the declared range', () => {
    expect(() =>
      assertValidSettingValue(
        'security.rateLimit.lead.limit',
        'number',
        20,
        bounds,
      ),
    ).not.toThrow();
  });

  /**
   * The gateway clamps an out-of-range limit back to its coded default — a necessary backstop,
   * but on its own it means an admin types `0`, is told "Settings saved", and the value silently
   * never applies. A mutation must surface success or a NAMED cause, never success for a no-op.
   */
  it.each([
    ['zero', 0],
    ['negative', -5],
    ['above the maximum', 999_999],
  ])('rejects %s with a catalogued key', (_label, value) => {
    expect(() =>
      assertValidSettingValue(
        'security.rateLimit.lead.limit',
        'number',
        value,
        bounds,
      ),
    ).toThrow();
  });

  it('rejects a non-integer — a fractional request budget is meaningless', () => {
    expect(() =>
      assertValidSettingValue(
        'security.rateLimit.lead.limit',
        'number',
        2.5,
        bounds,
      ),
    ).toThrow();
  });

  it('leaves a bound-less number setting alone', () => {
    expect(() =>
      assertValidSettingValue('some.other.number', 'number', -999),
    ).not.toThrow();
  });
});

/**
 * String shape (P8.23.A1). A vendor id is the case bounds cannot cover: it is a perfectly
 * valid string and still completely wrong, and the failure is silent — the tag loads, the
 * campaign reports nothing, and nobody learns why for months.
 */
describe('string pattern', () => {
  const ga4 = { pattern: '^G-[A-Z0-9]{4,20}$', example: 'G-ABCDE12345' };
  const key = 'tracking.destinations.ga4.id';

  it('accepts a value of the declared shape', () => {
    expect(() =>
      assertValidSettingValue(key, 'text', 'G-ABCDE12345', undefined, ga4),
    ).not.toThrow();
  });

  it('rejects another vendor’s id pasted into the field, naming the expected shape', () => {
    expect(() =>
      assertValidSettingValue(key, 'text', 'GTM-ABCDE12', undefined, ga4),
    ).toThrow(RpcException);
    try {
      assertValidSettingValue(key, 'text', '123456789012345', undefined, ga4);
    } catch (error) {
      expect((error as RpcException).getError()).toEqual({
        statusCode: 400,
        messageKey: 'settings.value.invalidFormat',
        params: { key, example: ga4.example },
      });
    }
  });

  /**
   * Clearing must still work (U9): `null` from the API and `''` from an emptied text input
   * both mean "unset", and a pattern that refused them would trap an operator who simply
   * wants to remove a destination's id.
   */
  it.each([
    ['null', null],
    ['an emptied input', ''],
  ])('CLEARS with %s rather than failing the pattern', (_label, value) => {
    expect(() =>
      assertValidSettingValue(key, 'text', value, undefined, ga4),
    ).not.toThrow();
  });

  it('leaves a pattern-less text setting alone', () => {
    expect(() =>
      assertValidSettingValue('branding.brand.tagline', 'text', 'anything'),
    ).not.toThrow();
  });

  // A pattern is only meaningful for the string types; declaring one on a number must not
  // make the number path start doing regex work on a non-string.
  it('ignores a pattern on a non-string type', () => {
    expect(() =>
      assertValidSettingValue('k', 'boolean', true, undefined, ga4),
    ).not.toThrow();
  });
});
