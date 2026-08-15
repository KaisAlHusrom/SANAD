import {
  BASIS_POINTS_PER_UNIT,
  type CurrencyCode,
  type Money,
} from '@sanad/contracts';
import {
  minorUnitsPerMajor,
  SIGNIFICANT_DIGITS,
} from '../currency.constants.js';
import { DEFAULT_ROUNDING, roundTo } from '../rounding/rounding.js';
import type { RoundingMode } from '../rounding.types.js';

/**
 * Integer money arithmetic. Every operation stays in minor units — the only float that ever
 * appears is an intermediate inside `multiply`/`percentage`, and it is rounded back to an
 * integer before it can leave.
 *
 * Cross-currency operations THROW rather than coerce, and the throw is an English invariant
 * message (U24f): reaching it means a caller mixed currencies in code, which is a bug to fix,
 * never a message to show a client.
 */
function assertSameCurrency(left: Money, right: Money): void {
  if (left.currency !== right.currency) {
    throw new Error(
      `money: currency mismatch — cannot combine ${left.currency} with ${right.currency}`,
    );
  }
}

export function zero(currency: CurrencyCode): Money {
  return { amountMinor: 0, currency };
}

export function isZero(money: Money): boolean {
  return money.amountMinor === 0;
}

/**
 * Build an amount from a major-unit number (1.5 SAR → 150 halalas).
 *
 * The `toPrecision` step is load-bearing, not defensive noise: `1.005 * 100` is
 * `100.49999999999999` in IEEE-754, so rounding the raw product turns 1.005 SAR into 1.00
 * instead of 1.01. Re-quantising to 15 significant digits — safely inside a double's ~15–17 —
 * restores the value the user actually typed before it is rounded.
 */
export function fromMajor(
  amountMajor: number,
  currency: CurrencyCode,
  mode: RoundingMode = DEFAULT_ROUNDING,
): Money {
  if (!Number.isFinite(amountMajor)) {
    throw new Error('money: fromMajor needs a finite amount');
  }
  const scaled = Number(
    (amountMajor * minorUnitsPerMajor(currency)).toPrecision(
      SIGNIFICANT_DIGITS,
    ),
  );
  return { amountMinor: roundTo(scaled, mode), currency };
}

/** The major-unit value, for display and for handing to `Intl` — never for arithmetic. */
export function toMajor(money: Money): number {
  return money.amountMinor / minorUnitsPerMajor(money.currency);
}

export function add(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return {
    amountMinor: left.amountMinor + right.amountMinor,
    currency: left.currency,
  };
}

export function subtract(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return {
    amountMinor: left.amountMinor - right.amountMinor,
    currency: left.currency,
  };
}

export function negate(money: Money): Money {
  return { amountMinor: -money.amountMinor, currency: money.currency };
}

/** -1 / 0 / 1, so callers can sort and compare without reaching into `amountMinor`. */
export function compare(left: Money, right: Money): number {
  assertSameCurrency(left, right);
  return Math.sign(left.amountMinor - right.amountMinor);
}

/** Sum in a known currency, so an EMPTY list still returns a typed zero rather than `null`. */
export function sumOf(
  amounts: readonly Money[],
  currency: CurrencyCode,
): Money {
  return amounts.reduce<Money>(
    (total, amount) => add(total, amount),
    zero(currency),
  );
}

export function multiply(
  money: Money,
  factor: number,
  mode: RoundingMode = DEFAULT_ROUNDING,
): Money {
  return {
    amountMinor: roundTo(money.amountMinor * factor, mode),
    currency: money.currency,
  };
}

export function percentage(
  money: Money,
  basisPoints: number,
  mode: RoundingMode = DEFAULT_ROUNDING,
): Money {
  return {
    amountMinor: roundTo(
      (money.amountMinor * basisPoints) / BASIS_POINTS_PER_UNIT,
      mode,
    ),
    currency: money.currency,
  };
}

/**
 * Split an amount across weights so the parts sum EXACTLY back to it (largest-remainder).
 * Rounding each share independently loses or invents minor units — over a payment schedule
 * that is the difference between a contract that reconciles and one that does not. Leftover
 * units go to the largest remainders first, ties to the earlier share, so the split is stable.
 */
export function allocate(money: Money, weights: readonly number[]): Money[] {
  if (weights.length === 0) {
    throw new Error('money: allocate needs at least one weight');
  }
  if (weights.some((weight) => weight < 0)) {
    throw new Error('money: allocate weights must not be negative');
  }
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) {
    throw new Error('money: allocate weights must not all be zero');
  }

  const shares = weights.map((weight) => {
    const exact = (money.amountMinor * weight) / totalWeight;
    return {
      floor: Math.trunc(exact),
      remainder: Math.abs(exact - Math.trunc(exact)),
    };
  });
  let remaining =
    money.amountMinor - shares.reduce((sum, share) => sum + share.floor, 0);
  const step = remaining < 0 ? -1 : 1;

  const order = shares
    .map((share, index) => ({ index, remainder: share.remainder }))
    .sort(
      (left, right) =>
        right.remainder - left.remainder || left.index - right.index,
    );

  const amounts = shares.map((share) => share.floor);
  for (const { index } of order) {
    if (remaining === 0) {
      break;
    }
    amounts[index] = (amounts[index] as number) + step;
    remaining -= step;
  }
  return amounts.map((amountMinor) => ({
    amountMinor,
    currency: money.currency,
  }));
}
