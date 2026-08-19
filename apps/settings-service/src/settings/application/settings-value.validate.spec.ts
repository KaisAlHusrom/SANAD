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
