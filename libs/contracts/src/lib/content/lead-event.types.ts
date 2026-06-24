import type { Locale } from '../common/locale.js';
import type { LeadSource } from './lead-source.zod.types.js';

/**
 * The `lead.created` event payload (MS3 Outbox). Carries enough for the notifications
 * service (P6) to email the team + the visitor and for the CRM (later) to create a record,
 * without a follow-up read. `occurredAt` is an ISO string from the producer's
 * `DateTimeService` (N3). Pure shape (U16).
 */
export interface LeadCreatedEvent {
  id: string;
  name: string;
  email: string;
  company: string | null;
  projectType: string | null;
  message: string;
  source: LeadSource;
  locale: Locale;
  occurredAt: string;
}
