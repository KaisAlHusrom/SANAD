import type { CurrencyCode, TaxRate } from '@sanad/contracts';
import { applyTax } from '../apply-tax/apply-tax.js';
import type { DocumentTotals, LineTotal, PricedLine } from '../line.types.js';
import {
  multiply,
  percentage,
  subtract,
  sumOf,
  zero,
} from '../money-math/money-math.js';
import { DEFAULT_ROUNDING } from '../rounding/rounding.js';
import type { RoundingMode } from '../rounding.types.js';

/**
 * One line's contribution before tax. A fixed discount is **capped at the subtotal**: a data
 * entry slip should reduce a line to zero, never flip it into a credit the totals then silently
 * subtract from the rest of the document.
 */
export function lineTotal(
  line: PricedLine,
  mode: RoundingMode = DEFAULT_ROUNDING,
): LineTotal {
  if (!Number.isFinite(line.quantity) || line.quantity < 0) {
    throw new Error('money: line quantity must be a non-negative number');
  }
  const subtotal = multiply(line.unitPrice, line.quantity, mode);
  const raw = !line.discount
    ? zero(subtotal.currency)
    : line.discount.kind === 'basis-points'
      ? percentage(subtotal, line.discount.value, mode)
      : line.discount.value;
  const discount =
    raw.amountMinor > subtotal.amountMinor && subtotal.amountMinor >= 0
      ? subtotal
      : raw;
  return { subtotal, discount, net: subtract(subtotal, discount) };
}

/**
 * The document totals. Tax is applied **once, to the summed net** — never per line and summed,
 * which rounds N times and lands a minor unit or two away from what the client's own
 * calculator says.
 */
export function summarize(
  lines: readonly PricedLine[],
  rate: TaxRate,
  currency: CurrencyCode,
  mode: RoundingMode = DEFAULT_ROUNDING,
): DocumentTotals {
  const totals = lines.map((line) => lineTotal(line, mode));
  const subtotal = sumOf(
    totals.map((total) => total.subtotal),
    currency,
  );
  const discountTotal = sumOf(
    totals.map((total) => total.discount),
    currency,
  );
  const net = subtract(subtotal, discountTotal);
  const taxed = applyTax(net, rate, mode);
  return {
    currency,
    subtotal,
    discountTotal,
    net: taxed.net,
    tax: taxed.tax,
    grandTotal: taxed.gross,
  };
}
