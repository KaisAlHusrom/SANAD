import type { LeadCreateRequest, LeadId } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Submit the public contact / request-a-project form (MS3) — POST /api/leads,
 * unauthenticated. Returns only the new lead's id (the row is never echoed back).
 * `no-store` — a submission is never cached. The gateway emits `lead.created`, which
 * the notifications-service consumes (P6).
 *
 * The submission's own `locale` is ALSO sent as the request locale (U24c): this is the one
 * website path whose backend message a visitor actually reads, so a failed submit must come
 * back in the language of the page they filled in.
 */
export function createLead(body: LeadCreateRequest): Promise<LeadId> {
  return fetchEnvelope<LeadId>('/leads', {
    method: 'POST',
    body,
    cache: 'no-store',
    locale: body.locale,
  });
}
