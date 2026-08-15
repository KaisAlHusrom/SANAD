import type { CurrencyCode, Money } from '@sanad/contracts';

/** A discount is either a share of the line or a flat amount — both are quoted in the wild. */
export type LineDiscount =
  | { kind: 'basis-points'; value: number }
  | { kind: 'fixed'; value: Money };

/** One priced line of a proposal, quote or contract schedule. */
export interface PricedLine {
  unitPrice: Money;
  quantity: number;
  discount?: LineDiscount;
}

/** What one line contributes before tax. */
export interface LineTotal {
  subtotal: Money;
  discount: Money;
  net: Money;
}

/** The totals block a document prints. */
export interface DocumentTotals {
  currency: CurrencyCode;
  subtotal: Money;
  discountTotal: Money;
  net: Money;
  tax: Money;
  grandTotal: Money;
}
