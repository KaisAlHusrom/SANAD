# @sanad/money

**Purpose:** the platform's money primitive (P8.8) — an amount is an **integer in its currency's minor
units** plus an ISO-4217 code, never a float. Ships the arithmetic (add/subtract/multiply/percentage/
**allocate**), tax, line and document totals, and the locale-aware formatter/parser every surface renders
through. Consumed by proposals (P8.16), contracts (P8.17), the document engine's `money.*` variables
(P8.13) and every portal that prints a price.

**Tags:** `scope:shared`, `type:util`. **Deps:** `@sanad/contracts` only.
**Framework-free by design** — no NestJS, no drizzle, no zod — so `apps/admin-portal`, `apps/website` and
the P8.21 client portal import the same code the backend prices with (U3/F8/F9). The _shapes_ (`Money`,
`CurrencyCode`, `TaxRate`) live in `@sanad/contracts`; this package is behaviour only.

## Concepts (`src/lib/`)

| File / folder                              | Exports                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `currency.constants.ts`                    | `CURRENCIES` (the ONE exponent + symbol table), `minorUnitsPerMajor`, `SIGNIFICANT_DIGITS`, `CURRENCY_META_IS_COMPLETE`             |
| `rounding.types.ts` · `rounding/`          | `RoundingMode`, `DEFAULT_ROUNDING` (`half-up`), `roundTo` — symmetric about zero, unlike `Math.round`                               |
| `money-math/`                              | `zero`, `isZero`, `fromMajor`, `toMajor`, `add`, `subtract`, `negate`, `compare`, `sumOf`, `multiply`, `percentage`, **`allocate`** |
| `taxed-amount.types.ts` · `apply-tax/`     | `TaxedAmount`, `applyTax` — exclusive **and** inclusive rates; `net + tax === gross` always                                         |
| `line.types.ts` · `line-total/`            | `PricedLine`, `LineDiscount`, `LineTotal`, `DocumentTotals`, `lineTotal`, `summarize`                                               |
| `money-display.types.ts` · `format-money/` | `MoneyDisplayConfig`, `MoneyFormatOptions`, `formatMoney`, `formatMoneyAmount`                                                      |
| `parse-money/`                             | `parseMoneyInput` — Arabic-Indic digits, Arabic decimal/thousands marks, separators                                                 |

## The four decisions worth not re-deriving

- **Minor units, integers only.** `0.1 + 0.2 !== 0.3`; money that drifts is money that gets disputed.
  A cross-currency `add` **throws** (an English invariant, U24f — it means a code bug, never a client message).
- **`fromMajor` re-quantises before rounding.** `1.005 * 100 === 100.49999999999999`, so rounding the raw
  product turns 1.005 SAR into 1.00. `toPrecision(15)` restores what the user typed. Pinned by a spec.
- **`allocate` uses largest-remainder.** Rounding each share independently loses or invents minor units;
  over a payment schedule that is the difference between a contract that reconciles and one that does not.
  Leftovers go to the largest remainders, ties to the earlier share, so a split is stable and reproducible.
- **Tax is applied once, to the summed net** — never per line then summed, which rounds N times and lands
  a unit or two from the client's own calculator. `formatMoney` forces `numberingSystem: 'latn'` (the
  locked U8 western-numerals decision) and caches one `Intl` per locale+currency+style (F8).

**Events:** none. **Settings:** none _yet_ — `DEFAULT_CURRENCY` and `NO_TAX` in `@sanad/contracts` are the
coded defaults (U9); **P8.9** turns currency, symbol/placement, tax rate and tax label into resolved
settings that arrive through `MoneyDisplayConfig` / `TaxRate`, with no change to this package.
**Tests:** `rounding`, `money-math`, `apply-tax`, `line-total`, `format-money`, `parse-money` specs — 44.
