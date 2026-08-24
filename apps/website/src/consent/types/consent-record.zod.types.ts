import { z } from 'zod';
import { CONSENT_RECORD_VERSION } from '../constants/consent.constants';

/**
 * A visitor's stored decision. Zod rather than a cast because `localStorage` is untrusted input
 * that any extension, any older build of this site, or the visitor themselves can rewrite —
 * `.strict()` so a record carrying a field this version does not understand is re-asked rather
 * than half-honoured.
 */
export const consentRecordSchema = z
  .object({
    v: z.literal(CONSENT_RECORD_VERSION),
    /** The operator's policy version this decision answered. */
    policyVersion: z.number().int().positive(),
    /** Epoch milliseconds — the record expires `rememberDays` after this. */
    decidedAt: z.number().int().positive(),
    analytics: z.boolean(),
    marketing: z.boolean(),
  })
  .strict();

export type ConsentRecord = z.infer<typeof consentRecordSchema>;

/**
 * How `.strict()` is expressed inside the inline bootstrap script, which has no Zod. **Derived**
 * from the schema on purpose: hand-writing the number would let a new field pass the React path
 * while the script still rejects it — or, far worse, the reverse.
 *
 * The equivalence holds only while every field is **required**. An `.optional()` one would be
 * counted here but absent from a real record, so the script would re-ask where Zod accepts —
 * safe, but a divergence; give the script an explicit range if that day comes.
 */
export const CONSENT_RECORD_KEY_COUNT = Object.keys(
  consentRecordSchema.shape,
).length;
