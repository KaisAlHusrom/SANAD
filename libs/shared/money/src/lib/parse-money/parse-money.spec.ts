import { describe, expect, it } from 'vitest';
import { CURRENCY_CODES } from '@sanad/contracts';
import { formatMoneyAmount } from '../format-money/format-money.js';
import { parseMoneyInput } from './parse-money.js';

describe('parseMoneyInput', () => {
  it('reads a plain major-unit number into minor units', () => {
    expect(parseMoneyInput('1500', 'SAR')).toEqual({
      amountMinor: 150_000,
      currency: 'SAR',
    });
    expect(parseMoneyInput('12.34', 'SAR')?.amountMinor).toBe(1234);
  });

  it('ignores thousands separators and surrounding whitespace', () => {
    expect(parseMoneyInput(' 1,500.50 ', 'SAR')?.amountMinor).toBe(150_050);
    expect(parseMoneyInput('1 500', 'SAR')?.amountMinor).toBe(150_000);
  });

  it('reads Arabic-Indic digits and the Arabic decimal mark', () => {
    expect(parseMoneyInput('١٢٫٣٤', 'SAR')?.amountMinor).toBe(1234);
    expect(parseMoneyInput('١٬٥٠٠', 'SAR')?.amountMinor).toBe(150_000);
  });

  it('keeps a negative sign', () => {
    expect(parseMoneyInput('-25', 'SAR')?.amountMinor).toBe(-2500);
  });

  it('rounds beyond the currency’s precision instead of silently truncating', () => {
    expect(parseMoneyInput('1.005', 'SAR')?.amountMinor).toBe(101);
    expect(parseMoneyInput('1.4', 'JPY')?.amountMinor).toBe(1);
    expect(parseMoneyInput('1.2345', 'KWD')?.amountMinor).toBe(1235);
  });

  it('returns null — never 0 — for input that is not a number (U23)', () => {
    expect(parseMoneyInput('', 'SAR')).toBeNull();
    expect(parseMoneyInput('   ', 'SAR')).toBeNull();
    expect(parseMoneyInput('abc', 'SAR')).toBeNull();
    expect(parseMoneyInput('1.2.3', 'SAR')).toBeNull();
    expect(parseMoneyInput('-', 'SAR')).toBeNull();
  });

  it('round-trips what formatMoneyAmount prints, for every currency', () => {
    for (const currency of CURRENCY_CODES) {
      const money = { amountMinor: 1_234_567, currency };
      const printed = formatMoneyAmount(money, { locale: 'en' });
      expect(parseMoneyInput(printed, currency)).toEqual(money);
    }
  });
});
