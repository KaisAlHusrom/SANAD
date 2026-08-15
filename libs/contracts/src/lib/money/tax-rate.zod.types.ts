import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { BASIS_POINTS_PER_UNIT } from './money.constants.js';

/**
 * A tax rate in basis points plus the label a document prints beside it. The label is
 * translatable because the contract's governing text may be either locale (U8); the rate is an
 * integer because a percentage stored as a float is the classic rounding-dispute source.
 * `inclusive` says whether a quoted price already contains the tax — both forms are real, and
 * guessing wrong changes what the client owes.
 */
export const taxRateSchema = z
  .object({
    rateBasisPoints: z.number().int().min(0).max(BASIS_POINTS_PER_UNIT),
    label: localizedTextSchema,
    inclusive: z.boolean(),
  })
  .strict();

export type TaxRate = z.infer<typeof taxRateSchema>;

/**
 * The coded default (U9): **no tax**. The owner has no registered legal entity yet
 * (decision 2026-08-08), so a fresh install must not print a tax line it cannot justify —
 * P8.9 makes the rate and label settings.
 */
export const NO_TAX: TaxRate = {
  rateBasisPoints: 0,
  label: { ar: 'ضريبة', en: 'Tax' },
  inclusive: false,
};
