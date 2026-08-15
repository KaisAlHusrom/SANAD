import type { Money } from '@sanad/contracts';

/** An amount split into what is owed before tax, the tax itself, and the payable total. */
export interface TaxedAmount {
  net: Money;
  tax: Money;
  gross: Money;
}
