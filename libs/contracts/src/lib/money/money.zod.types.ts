import { z } from 'zod';
import { currencyCodeSchema } from './currency-code.zod.types.js';

/**
 * An amount in its currency's MINOR units (halalas, cents, fils) — always an integer.
 * Never a float: `0.1 + 0.2 !== 0.3` in IEEE-754, and money that drifts is money that gets
 * disputed. Negative is legal (a credit, a discount line, a reversal).
 */
export const moneySchema = z
  .object({
    amountMinor: z.number().int(),
    currency: currencyCodeSchema,
  })
  .strict();

export type Money = z.infer<typeof moneySchema>;
