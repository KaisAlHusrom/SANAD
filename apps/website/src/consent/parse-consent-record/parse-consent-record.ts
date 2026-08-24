import {
  consentRecordSchema,
  type ConsentRecord,
} from '../types/consent-record.zod.types';

/**
 * Turn whatever is in storage into a record, or into "never decided". Every rejection collapses
 * to `null` on purpose: a decision we cannot read in full is not a decision, and asking again is
 * the only safe way to be wrong (U23 degraded state).
 *
 * Takes the raw string rather than the storage handle so the malformed cases are testable
 * without a DOM.
 */
export function parseConsentRecord(raw: string | null): ConsentRecord | null {
  if (!raw) return null;

  try {
    const parsed = consentRecordSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
