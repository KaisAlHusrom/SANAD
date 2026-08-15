import type { CurrencyCode, Money } from '@sanad/contracts';
import { fromMajor } from '../money-math/money-math.js';
import { DEFAULT_ROUNDING } from '../rounding/rounding.js';
import type { RoundingMode } from '../rounding.types.js';

const ARABIC_INDIC_ZERO = 0x0660;
const EASTERN_ARABIC_INDIC_ZERO = 0x06f0;
const DIGIT_SPAN = 10;
const ARABIC_DECIMAL_SEPARATOR = '٫';
const ARABIC_THOUSANDS_SEPARATOR = '٬';

/** Map both Arabic digit ranges onto ASCII — a typed amount is a number whatever keyboard sent it. */
function toWesternDigits(input: string): string {
  return [...input]
    .map((character) => {
      const code = character.codePointAt(0) ?? 0;
      if (code >= ARABIC_INDIC_ZERO && code < ARABIC_INDIC_ZERO + DIGIT_SPAN) {
        return String(code - ARABIC_INDIC_ZERO);
      }
      if (
        code >= EASTERN_ARABIC_INDIC_ZERO &&
        code < EASTERN_ARABIC_INDIC_ZERO + DIGIT_SPAN
      ) {
        return String(code - EASTERN_ARABIC_INDIC_ZERO);
      }
      return character;
    })
    .join('');
}

/**
 * Read a human-typed amount into `Money`, or **`null`** when it is not a number.
 *
 * Null rather than zero on purpose (U23): a field the user has not filled in and a field they
 * typed `0` into mean different things, and a parser that quietly returns zero turns a typo
 * into a free line item. Accepts Arabic-Indic digits, the Arabic decimal/thousands marks,
 * spaces and commas — the admin's own keyboard, not a canonical wire format.
 */
export function parseMoneyInput(
  input: string,
  currency: CurrencyCode,
  mode: RoundingMode = DEFAULT_ROUNDING,
): Money | null {
  const normalized = toWesternDigits(input)
    .trim()
    .replace(new RegExp(ARABIC_DECIMAL_SEPARATOR, 'g'), '.')
    .replace(new RegExp(ARABIC_THOUSANDS_SEPARATOR, 'g'), '')
    // `\s` already covers the NBSP / narrow-NBSP `Intl` uses as a group separator; the
    // explicit escapes strip the bidi marks an Arabic-formatted string is pasted with.
    .replace(/[\s,\u200e\u200f\u061c]/g, '');
  if (normalized.length === 0 || !/^[+-]?\d*(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const amountMajor = Number(normalized);
  if (
    !Number.isFinite(amountMajor) ||
    normalized === '+' ||
    normalized === '-'
  ) {
    return null;
  }
  return fromMajor(amountMajor, currency, mode);
}
