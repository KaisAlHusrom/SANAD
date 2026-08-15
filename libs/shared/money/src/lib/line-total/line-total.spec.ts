import { describe, expect, it } from 'vitest';
import { NO_TAX, type TaxRate } from '@sanad/contracts';
import { lineTotal, summarize } from './line-total.js';

const sar = (amountMinor: number) => ({
  amountMinor,
  currency: 'SAR' as const,
});
const vat: TaxRate = {
  rateBasisPoints: 1500,
  label: { ar: 'ضريبة القيمة المضافة', en: 'VAT' },
  inclusive: false,
};

describe('lineTotal', () => {
  it('multiplies unit price by quantity', () => {
    expect(lineTotal({ unitPrice: sar(25_000), quantity: 3 })).toEqual({
      subtotal: sar(75_000),
      discount: sar(0),
      net: sar(75_000),
    });
  });

  it('applies a percentage discount in basis points', () => {
    expect(
      lineTotal({
        unitPrice: sar(10_000),
        quantity: 2,
        discount: { kind: 'basis-points', value: 1000 },
      }),
    ).toEqual({ subtotal: sar(20_000), discount: sar(2000), net: sar(18_000) });
  });

  it('applies a fixed discount', () => {
    expect(
      lineTotal({
        unitPrice: sar(10_000),
        quantity: 1,
        discount: { kind: 'fixed', value: sar(2500) },
      }),
    ).toEqual({ subtotal: sar(10_000), discount: sar(2500), net: sar(7500) });
  });

  it('CAPS a fixed discount at the subtotal — a line never goes negative by accident', () => {
    const result = lineTotal({
      unitPrice: sar(1000),
      quantity: 1,
      discount: { kind: 'fixed', value: sar(5000) },
    });
    expect(result.discount).toEqual(sar(1000));
    expect(result.net).toEqual(sar(0));
  });

  it('rejects a quantity that cannot mean anything', () => {
    expect(() => lineTotal({ unitPrice: sar(100), quantity: -1 })).toThrow();
  });
});

describe('summarize', () => {
  it('totals the lines and adds tax once, at the end', () => {
    const totals = summarize(
      [
        { unitPrice: sar(10_000), quantity: 2 },
        {
          unitPrice: sar(5000),
          quantity: 1,
          discount: { kind: 'basis-points', value: 1000 },
        },
      ],
      vat,
      'SAR',
    );
    expect(totals.subtotal).toEqual(sar(25_000));
    expect(totals.discountTotal).toEqual(sar(500));
    expect(totals.net).toEqual(sar(24_500));
    expect(totals.tax).toEqual(sar(3675));
    expect(totals.grandTotal).toEqual(sar(28_175));
  });

  it('returns a typed zero set for NO lines — an empty proposal still renders (U23)', () => {
    const totals = summarize([], NO_TAX, 'SAR');
    expect(totals.subtotal).toEqual(sar(0));
    expect(totals.grandTotal).toEqual(sar(0));
    expect(totals.tax).toEqual(sar(0));
  });

  it('keeps net + tax === grandTotal', () => {
    const totals = summarize(
      [{ unitPrice: sar(3333), quantity: 7 }],
      vat,
      'SAR',
    );
    expect(totals.net.amountMinor + totals.tax.amountMinor).toBe(
      totals.grandTotal.amountMinor,
    );
  });
});
