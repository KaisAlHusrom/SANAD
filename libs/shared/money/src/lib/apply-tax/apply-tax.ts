import {
  BASIS_POINTS_PER_UNIT,
  type Money,
  type TaxRate,
} from '@sanad/contracts';
import { add, percentage, subtract } from '../money-math/money-math.js';
import { DEFAULT_ROUNDING, roundTo } from '../rounding/rounding.js';
import type { RoundingMode } from '../rounding.types.js';
import type { TaxedAmount } from '../taxed-amount.types.js';

/**
 * Split an amount into net / tax / gross under a rate.
 *
 * The `amount` argument means what the rate says it means: for an **exclusive** rate it is the
 * net and the tax is added on top; for an **inclusive** rate it is the gross and the tax is
 * extracted out of it (`gross × r / (1 + r)`). Both forms occur in real quotes, and the
 * invariant `net + tax === gross` is asserted by the spec for every rate — the tax is derived
 * once and the third value is computed from the other two, so the three can never disagree
 * by a rounding unit.
 */
export function applyTax(
  amount: Money,
  rate: TaxRate,
  mode: RoundingMode = DEFAULT_ROUNDING,
): TaxedAmount {
  if (!rate.inclusive) {
    const tax = percentage(amount, rate.rateBasisPoints, mode);
    return { net: amount, tax, gross: add(amount, tax) };
  }
  const divisor = BASIS_POINTS_PER_UNIT + rate.rateBasisPoints;
  const tax: Money = {
    amountMinor: roundTo(
      (amount.amountMinor * rate.rateBasisPoints) / divisor,
      mode,
    ),
    currency: amount.currency,
  };
  return { net: subtract(amount, tax), tax, gross: amount };
}
