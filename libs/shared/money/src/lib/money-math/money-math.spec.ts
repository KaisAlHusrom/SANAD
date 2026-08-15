import { describe, expect, it } from 'vitest';
import { CURRENCY_CODES } from '@sanad/contracts';
import {
  CURRENCY_META_IS_COMPLETE,
  minorUnitsPerMajor,
} from '../currency.constants.js';
import {
  add,
  allocate,
  compare,
  fromMajor,
  isZero,
  multiply,
  negate,
  percentage,
  subtract,
  sumOf,
  toMajor,
  zero,
} from './money-math.js';

const sar = (amountMinor: number) => ({
  amountMinor,
  currency: 'SAR' as const,
});

describe('money-math', () => {
  it('knows every declared currency (a missing exponent would be a silent 10x error)', () => {
    expect(CURRENCY_META_IS_COMPLETE).toBe(true);
    expect(CURRENCY_CODES.length).toBeGreaterThan(0);
  });

  it('converts major↔minor per the currency exponent, not a hardcoded 100', () => {
    expect(minorUnitsPerMajor('SAR')).toBe(100);
    expect(minorUnitsPerMajor('KWD')).toBe(1000);
    expect(minorUnitsPerMajor('JPY')).toBe(1);
    expect(fromMajor(1.5, 'SAR').amountMinor).toBe(150);
    expect(fromMajor(1.5, 'KWD').amountMinor).toBe(1500);
    expect(fromMajor(1500, 'JPY').amountMinor).toBe(1500);
    expect(toMajor({ amountMinor: 1500, currency: 'KWD' })).toBe(1.5);
  });

  it('survives the IEEE-754 trap: 1.005 SAR is 101 halalas, not 100', () => {
    // `1.005 * 100 === 100.49999999999999`. Rounding that raw product loses a halala on every
    // price a human types with three decimals — the classic money-in-floats defect.
    expect(fromMajor(1.005, 'SAR').amountMinor).toBe(101);
    expect(fromMajor(8.615, 'SAR').amountMinor).toBe(862);
    expect(fromMajor(1.0005, 'KWD').amountMinor).toBe(1001);
    expect(() => fromMajor(Number.NaN, 'SAR')).toThrow();
  });

  it('adds, subtracts, negates and compares', () => {
    expect(add(sar(1000), sar(250))).toEqual(sar(1250));
    expect(subtract(sar(1000), sar(250))).toEqual(sar(750));
    expect(negate(sar(250))).toEqual(sar(-250));
    expect(compare(sar(1), sar(2))).toBe(-1);
    expect(compare(sar(2), sar(2))).toBe(0);
    expect(isZero(zero('SAR'))).toBe(true);
    expect(sumOf([sar(100), sar(200), sar(50)], 'SAR')).toEqual(sar(350));
    expect(sumOf([], 'SAR')).toEqual(zero('SAR'));
  });

  it('REFUSES to mix currencies — an invisible cross-currency add is a wrong invoice', () => {
    expect(() => add(sar(100), { amountMinor: 100, currency: 'USD' })).toThrow(
      /currency/i,
    );
    expect(() =>
      compare(sar(1), { amountMinor: 1, currency: 'USD' }),
    ).toThrow();
    expect(() => sumOf([{ amountMinor: 1, currency: 'USD' }], 'SAR')).toThrow();
  });

  it('multiplies by a quantity and rounds explicitly', () => {
    expect(multiply(sar(333), 3)).toEqual(sar(999));
    // 10.005 SAR × 1 → half of a halala: half-up rounds away from zero, down truncates.
    expect(multiply(sar(1001), 0.5)).toEqual(sar(501));
    expect(multiply(sar(1001), 0.5, 'down')).toEqual(sar(500));
    expect(multiply(sar(-1001), 0.5)).toEqual(sar(-501));
  });

  it('takes a percentage in basis points', () => {
    expect(percentage(sar(10_000), 1500)).toEqual(sar(1500));
    expect(percentage(sar(10_000), 0)).toEqual(zero('SAR'));
    expect(percentage(sar(333), 1500)).toEqual(sar(50)); // 49.95 → 50
  });

  it('allocates without losing or inventing a single minor unit', () => {
    expect(allocate(sar(10_000), [1, 1, 1]).map((m) => m.amountMinor)).toEqual([
      3334, 3333, 3333,
    ]);
    expect(allocate(sar(5), [1, 1, 1, 1]).map((m) => m.amountMinor)).toEqual([
      2, 1, 1, 1,
    ]);
    expect(allocate(sar(10_000), [70, 30]).map((m) => m.amountMinor)).toEqual([
      7000, 3000,
    ]);
  });

  it('allocates a negative total the same way, and conserves it', () => {
    const parts = allocate(sar(-10_000), [1, 1, 1]);
    expect(parts.reduce((total, part) => total + part.amountMinor, 0)).toBe(
      -10_000,
    );
  });

  it('rejects an allocation that cannot mean anything', () => {
    expect(() => allocate(sar(100), [])).toThrow();
    expect(() => allocate(sar(100), [0, 0])).toThrow();
    expect(() => allocate(sar(100), [1, -1])).toThrow();
  });

  it('conserves the total for every awkward split it is given', () => {
    for (const total of [1, 5, 99, 100, 10_000, 12_345]) {
      for (const weights of [
        [1, 1, 1],
        [1, 2, 3],
        [5, 5],
        [1, 1, 1, 1, 1, 1, 1],
      ]) {
        const parts = allocate(sar(total), weights);
        expect(parts).toHaveLength(weights.length);
        expect(parts.reduce((sum, part) => sum + part.amountMinor, 0)).toBe(
          total,
        );
      }
    }
  });
});
