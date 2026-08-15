import { CURRENCY_CODES, type CurrencyCode } from '@sanad/contracts';

/** What a currency needs to be converted, rounded and printed. */
export interface CurrencyMeta {
  /** ISO 4217 minor-unit exponent: 100 minor units per major at 2, 1000 at 3, 1 at 0. */
  readonly exponent: number;
  /** The symbol used when a caller overrides `Intl`'s own (P8.9 settings). */
  readonly symbol: string;
}

/**
 * The ONLY exponent table in the platform (U3). Getting one of these wrong is a silent 10×
 * pricing error, so the three-decimal Gulf currencies are listed explicitly rather than
 * assumed to be 2 like everything else.
 */
export const CURRENCIES: Readonly<Record<CurrencyCode, CurrencyMeta>> = {
  SAR: { exponent: 2, symbol: 'ر.س' },
  AED: { exponent: 2, symbol: 'د.إ' },
  QAR: { exponent: 2, symbol: 'ر.ق' },
  KWD: { exponent: 3, symbol: 'د.ك' },
  BHD: { exponent: 3, symbol: 'د.ب' },
  OMR: { exponent: 3, symbol: 'ر.ع' },
  JOD: { exponent: 3, symbol: 'د.أ' },
  USD: { exponent: 2, symbol: '$' },
  EUR: { exponent: 2, symbol: '€' },
  GBP: { exponent: 2, symbol: '£' },
  TRY: { exponent: 2, symbol: '₺' },
  EGP: { exponent: 2, symbol: 'ج.م' },
  SYP: { exponent: 2, symbol: 'ل.س' },
  JPY: { exponent: 0, symbol: '¥' },
};

/** Every declared code has metadata — a missing entry is a boot-time failure, not a runtime `undefined`. */
export const CURRENCY_META_IS_COMPLETE: boolean = CURRENCY_CODES.every(
  (code) => CURRENCIES[code] !== undefined,
);

/**
 * Digits kept when re-quantising a float product back to the value a human typed. A double
 * carries ~15–17 significant digits, so 15 is the largest width that is always exact (U18).
 */
export const SIGNIFICANT_DIGITS = 15;

/** Minor units per major unit for a currency (100 for SAR, 1000 for KWD, 1 for JPY). */
export function minorUnitsPerMajor(currency: CurrencyCode): number {
  return 10 ** CURRENCIES[currency].exponent;
}
