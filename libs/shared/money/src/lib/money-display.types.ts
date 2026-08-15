import type { Locale } from '@sanad/contracts';

/**
 * How a money value should look. Everything is optional with a coded default (U9) — P8.9 fills
 * these from the Legal Entity Profile, and until then `Intl`'s own currency rendering applies.
 */
export interface MoneyDisplayConfig {
  /** Overrides the currency mark `Intl` would print (a brand's preferred glyph). */
  symbol?: string;
  /** Which side the overriding symbol sits on. Only read when `symbol` is set. */
  placement?: 'before' | 'after';
}

/** Everything `formatMoney` needs: who is reading, and how the platform is configured to print. */
export interface MoneyFormatOptions {
  locale: Locale;
  display?: MoneyDisplayConfig;
}
