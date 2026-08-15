import { describe, expect, it } from 'vitest';
import { NO_TAX, type TaxRate } from '@sanad/contracts';
import { applyTax } from './apply-tax.js';

const sar = (amountMinor: number) => ({
  amountMinor,
  currency: 'SAR' as const,
});
const rate = (rateBasisPoints: number, inclusive = false): TaxRate => ({
  rateBasisPoints,
  label: { ar: 'ضريبة القيمة المضافة', en: 'VAT' },
  inclusive,
});

describe('applyTax', () => {
  it('adds an exclusive rate on top of the net', () => {
    const result = applyTax(sar(10_000), rate(1500));
    expect(result.net).toEqual(sar(10_000));
    expect(result.tax).toEqual(sar(1500));
    expect(result.gross).toEqual(sar(11_500));
  });

  it('extracts an inclusive rate out of the quoted price', () => {
    const result = applyTax(sar(11_500), rate(1500, true));
    expect(result.gross).toEqual(sar(11_500));
    expect(result.tax).toEqual(sar(1500));
    expect(result.net).toEqual(sar(10_000));
  });

  it('round-trips inclusive→exclusive to WITHIN ONE minor unit — the real, documented bound', () => {
    // Extracting tax out of 3.33 SAR gives 0.43 (43.43 rounded down); re-adding 15% to the
    // 2.90 net gives 0.44 (43.5 rounded up) → 3.34. One halala of drift is unavoidable once
    // both halves are integers, so the invariant is a bound, not equality. Asserting equality
    // here would either be a lie or force a silently different rounding rule on one side.
    for (const amount of [1, 99, 333, 10_000, 12_345]) {
      const inclusive = applyTax(sar(amount), rate(1500, true));
      const rebuilt = applyTax(inclusive.net, rate(1500));
      expect(Math.abs(rebuilt.gross.amountMinor - amount)).toBeLessThanOrEqual(
        1,
      );
    }
  });

  it('always returns a ZERO tax, never null, when no rate is configured (U23/U9)', () => {
    const result = applyTax(sar(10_000), NO_TAX);
    expect(result.tax).toEqual(sar(0));
    expect(result.net).toEqual(result.gross);
  });

  it('keeps net + tax === gross for every rate it is given', () => {
    for (const points of [0, 1, 500, 1500, 10_000]) {
      for (const inclusive of [false, true]) {
        const result = applyTax(sar(7777), rate(points, inclusive));
        expect(result.net.amountMinor + result.tax.amountMinor).toBe(
          result.gross.amountMinor,
        );
      }
    }
  });
});
