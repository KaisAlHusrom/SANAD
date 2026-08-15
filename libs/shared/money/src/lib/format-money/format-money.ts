import type { Locale, Money } from '@sanad/contracts';
import { CURRENCIES } from '../currency.constants.js';
import type { MoneyFormatOptions } from '../money-display.types.js';
import { toMajor } from '../money-math/money-math.js';

/**
 * One `Intl.NumberFormat` per locale+currency+style (F8 — never an `Intl` at a call site, and
 * never a fresh instance per row: constructing one is the expensive part).
 */
const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(
  locale: Locale,
  currency: string,
  style: 'currency' | 'decimal',
): Intl.NumberFormat {
  const key = `${locale}:${currency}:${style}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    const digits = CURRENCIES[currency as keyof typeof CURRENCIES].exponent;
    formatter = new Intl.NumberFormat(locale, {
      style,
      ...(style === 'currency'
        ? { currency, currencyDisplay: 'symbol' as const }
        : {}),
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      // Western numerals everywhere is a locked design decision (U8) — same as `formatBytes`.
      numberingSystem: 'latn',
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

/**
 * A non-finite amount is a gap in the data, and a gap must still render as something a person
 * can read (U23) — never `NaN ر.س` in front of a client.
 */
function safeMajor(money: Money): number {
  return Number.isFinite(money.amountMinor) ? toMajor(money) : 0;
}

/** The number alone, at the currency's precision — for a column whose header names the currency. */
export function formatMoneyAmount(
  money: Money,
  options: MoneyFormatOptions,
): string {
  return formatterFor(options.locale, money.currency, 'decimal').format(
    safeMajor(money),
  );
}

/**
 * A money value in the reader's language. With no `display.symbol` this is `Intl`'s own
 * currency rendering (which already knows each locale's placement); with one, the configured
 * glyph is placed explicitly — the settings-driven path P8.9 turns on.
 */
export function formatMoney(money: Money, options: MoneyFormatOptions): string {
  const symbol = options.display?.symbol;
  if (!symbol) {
    return formatterFor(options.locale, money.currency, 'currency').format(
      safeMajor(money),
    );
  }
  const amount = formatMoneyAmount(money, options);
  return options.display?.placement === 'after'
    ? `${amount} ${symbol}`
    : `${symbol} ${amount}`;
}
