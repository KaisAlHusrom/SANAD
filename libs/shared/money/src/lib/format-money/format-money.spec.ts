import { describe, expect, it } from 'vitest';
import { formatMoney, formatMoneyAmount } from './format-money.js';

const sar = (amountMinor: number) => ({
  amountMinor,
  currency: 'SAR' as const,
});

describe('formatMoney', () => {
  it('renders the major value with the currency, in the reader’s language', () => {
    expect(formatMoney(sar(150_000), { locale: 'en' })).toMatch(/1,500/);
    expect(formatMoney(sar(150_000), { locale: 'ar' })).toMatch(/1,500/);
  });

  it('uses WESTERN numerals in Arabic — the locked U8 decision', () => {
    expect(formatMoney(sar(150_000), { locale: 'ar' })).not.toMatch(/[٠-٩]/);
  });

  it('honours each currency’s own exponent', () => {
    expect(
      formatMoney({ amountMinor: 1500, currency: 'KWD' }, { locale: 'en' }),
    ).toMatch(/1\.500/);
    expect(
      formatMoney({ amountMinor: 1500, currency: 'JPY' }, { locale: 'en' }),
    ).toMatch(/1,500/);
  });

  it('renders a NaN / non-finite amount as zero rather than “NaN” (U23)', () => {
    expect(
      formatMoney(
        { amountMinor: Number.NaN, currency: 'SAR' },
        { locale: 'en' },
      ),
    ).toMatch(/0/);
    expect(
      formatMoney(
        { amountMinor: Number.POSITIVE_INFINITY, currency: 'SAR' },
        { locale: 'ar' },
      ),
    ).not.toMatch(/∞|NaN/);
  });

  it('renders a negative amount without losing the sign', () => {
    expect(formatMoney(sar(-150_000), { locale: 'en' })).toMatch(/-|\(/);
  });

  it('can render a bare amount with no currency mark, for a column that has its own header', () => {
    const bare = formatMoneyAmount(sar(150_000), { locale: 'en' });
    expect(bare).toMatch(/1,500\.00/);
    expect(bare).not.toMatch(/SAR|ر\.س|\$/);
  });

  it('accepts a settings-supplied symbol + placement without inventing a second formatter', () => {
    const before = formatMoney(sar(150_000), {
      locale: 'en',
      display: { symbol: '₪', placement: 'before' },
    });
    const after = formatMoney(sar(150_000), {
      locale: 'en',
      display: { symbol: '₪', placement: 'after' },
    });
    expect(before.startsWith('₪')).toBe(true);
    expect(after.endsWith('₪')).toBe(true);
  });

  it('reuses its Intl instances (F8 — a formatter per call is the classic hot-loop cost)', () => {
    const first = formatMoney(sar(1), { locale: 'ar' });
    const second = formatMoney(sar(1), { locale: 'ar' });
    expect(first).toBe(second);
  });
});
