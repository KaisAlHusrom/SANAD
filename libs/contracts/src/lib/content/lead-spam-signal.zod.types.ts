import { z } from 'zod';

/**
 * The reasons a lead scored (P8.10.B3). Every id is detectable from the submitted payload alone —
 * no hand-maintained dataset, no third party (the B1 precedent).
 *
 * A per-ip burst signal is deliberately absent: P8.10.A's rate limiter already throttles
 * `POST /leads` per ip, and the submit ip already lives in `audit_log`.
 */
export const leadSpamSignalIdSchema = z.enum([
  /** Phrases from the coded bilingual spam-phrase list (SEO / backlinks / crypto / loans …). */
  'keywords',
  /** URLs in the message body. */
  'links',
  /** A URL where a person's name or company should be. */
  'contactLinks',
  /** The message is written in a script that is neither Arabic nor Latin. */
  'foreignScript',
  /** A long run of one repeated character. */
  'repeatedChars',
  /** Too short to be a real enquiry. */
  'shortMessage',
  /** Shouting — a Latin caps ratio or a run of `!`/`?`. */
  'shouting',
]);

export type LeadSpamSignalId = z.infer<typeof leadSpamSignalIdSchema>;

/**
 * One fired signal, as stored on the lead and rendered in the inbox breakdown. `weight` is
 * recorded with the signal so the stored score always adds up to what the row shows, and `n`
 * carries the count for the signals that have one (3 links, 2 phrases) — the label interpolates
 * it as `{{n}}`, never `{{count}}`, which i18next would read as a plural selector.
 */
export const leadSpamSignalSchema = z
  .object({
    id: leadSpamSignalIdSchema,
    weight: z.number().int().min(0),
    n: z.number().int().min(1).optional(),
  })
  .strict();

export type LeadSpamSignal = z.infer<typeof leadSpamSignalSchema>;
