import { describe, expect, it } from 'vitest';
import {
  CURRENCY_CODES,
  currencyCodeSchema,
  DEFAULT_CURRENCY,
} from './currency-code.zod.types.js';
import { BASIS_POINTS_PER_UNIT } from './money.constants.js';
import { moneySchema } from './money.zod.types.js';
import { NO_TAX, taxRateSchema } from './tax-rate.zod.types.js';

describe('money contracts', () => {
  it('enumerates the supported currencies and defaults to SAR (U9 coded default)', () => {
    expect(currencyCodeSchema.safeParse('SAR').success).toBe(true);
    expect(currencyCodeSchema.safeParse('XXX').success).toBe(false);
    expect(CURRENCY_CODES).toContain(DEFAULT_CURRENCY);
  });

  it('accepts an integer minor amount and REJECTS a fractional one', () => {
    expect(
      moneySchema.safeParse({ amountMinor: 150_00, currency: 'SAR' }).success,
    ).toBe(true);
    expect(
      moneySchema.safeParse({ amountMinor: 10.5, currency: 'SAR' }).success,
    ).toBe(false);
  });

  it('allows a negative amount — a credit note is money too', () => {
    expect(
      moneySchema.safeParse({ amountMinor: -2500, currency: 'SAR' }).success,
    ).toBe(true);
  });

  it('rejects unknown keys (strict, N7)', () => {
    expect(
      moneySchema.safeParse({
        amountMinor: 1,
        currency: 'SAR',
        formatted: '1',
      }).success,
    ).toBe(false);
  });

  it('bounds a tax rate to 0…100% in basis points', () => {
    const rate = {
      rateBasisPoints: 1500,
      label: { ar: 'ض', en: 'VAT' },
      inclusive: false,
    };
    expect(taxRateSchema.safeParse(rate).success).toBe(true);
    expect(
      taxRateSchema.safeParse({
        ...rate,
        rateBasisPoints: BASIS_POINTS_PER_UNIT + 1,
      }).success,
    ).toBe(false);
    expect(
      taxRateSchema.safeParse({ ...rate, rateBasisPoints: 15.5 }).success,
    ).toBe(false);
  });

  it('ships a zero-rate default so nothing renders a tax line before an entity exists', () => {
    expect(taxRateSchema.parse(NO_TAX).rateBasisPoints).toBe(0);
  });
});
