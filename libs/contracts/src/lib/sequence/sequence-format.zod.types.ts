import { z } from 'zod';

/** The entities that carry a human-readable number. `uuid` stays the primary key (P8.8). */
export const SEQUENCE_KINDS = [
  'proposal',
  'contract',
  'invoice',
  'document',
] as const;

export const sequenceKindSchema = z.enum(SEQUENCE_KINDS);

export type SequenceKind = z.infer<typeof sequenceKindSchema>;

/** Smallest and largest zero-padding a format may ask for (U18). */
export const MIN_SEQUENCE_PADDING = 1;
export const MAX_SEQUENCE_PADDING = 12;

/**
 * How a number is printed and when its counter restarts. Validated because P8.9 exposes it as a
 * setting: an admin typo must be rejected at the edge, not discovered on a signed contract.
 * `reset: 'yearly'` gives `PRO-2026-0001`; `'never'` gives one continuous run.
 */
export const sequenceFormatSchema = z
  .object({
    prefix: z
      .string()
      .min(1)
      .regex(/^[A-Z0-9]+$/, 'prefix must be upper-case letters and digits'),
    reset: z.enum(['yearly', 'never']),
    padding: z
      .number()
      .int()
      .min(MIN_SEQUENCE_PADDING)
      .max(MAX_SEQUENCE_PADDING),
    separator: z.string().min(1).max(1),
  })
  .strict();

export type SequenceFormat = z.infer<typeof sequenceFormatSchema>;

/** The coded defaults (U9) — P8.9 lets an admin override them per kind. */
export const SEQUENCE_FORMAT_DEFAULTS: Readonly<
  Record<SequenceKind, SequenceFormat>
> = {
  proposal: { prefix: 'PRO', reset: 'yearly', padding: 4, separator: '-' },
  contract: { prefix: 'CTR', reset: 'yearly', padding: 4, separator: '-' },
  invoice: { prefix: 'INV', reset: 'yearly', padding: 4, separator: '-' },
  document: { prefix: 'DOC', reset: 'yearly', padding: 4, separator: '-' },
};
