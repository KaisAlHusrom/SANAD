import { CONSENT_STORAGE_KEY } from '../constants/consent.constants';
import { parseConsentRecord } from '../parse-consent-record/parse-consent-record';
import type { ConsentRecord } from '../types/consent-record.zod.types';

/**
 * localStorage rather than a cookie, deliberately: a cookie would let the server render the
 * banner, but reading one in the App Router opts every page out of static rendering — the whole
 * site's caching traded for one bar. The blocking bootstrap script reads this same key before
 * paint, which removes the only real advantage a cookie had.
 *
 * Every call is wrapped: Safari's private mode throws on read AND write, and a consent layer
 * that can crash the page it is meant to protect is worse than one that simply asks again.
 */
export function readConsentRecord(): ConsentRecord | null {
  return parseConsentRecord(readConsentRaw());
}

/**
 * The stored text, unparsed. The store compares it to decide whether it may reuse the record it
 * already parsed — so its cache is keyed on what storage actually says, never on a flag it hopes
 * is still true (U30b).
 */
export function readConsentRaw(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Returns whether the decision actually reached storage. The caller MUST act on `false` — a
 * private-mode browser throws here, and a `save` that silently did nothing would leave the
 * visitor clicking Accept forever with no visible outcome (U23). The store keeps the record in
 * memory instead, so the decision at least holds for this page view.
 */
export function writeConsentRecord(record: ConsentRecord): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** Returns whether storage was actually cleared — same contract as the write, for the same reason. */
export function clearConsentRecord(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
