import { z } from 'zod';
import { localeSchema } from '../common/locale.js';
import { leadSourceSchema } from './lead-source.zod.types.js';

/**
 * The `lead.created` event payload (MS3 Outbox). Zod-first (U16) so the consumer
 * (notifications-service, P6) runtime-validates the inbound broker message before acting —
 * the producer (content-service) constructs the object and never parses it, so it is
 * unaffected. Carries enough to email the team + the visitor and (later) seed a CRM record
 * without a follow-up read. `occurredAt` is an ISO string from the producer's
 * `DateTimeService` (N3).
 */
export const leadCreatedEventSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().email(),
    company: z.string().nullable(),
    projectType: z.string().nullable(),
    message: z.string().min(1),
    source: leadSourceSchema,
    locale: localeSchema,
    occurredAt: z.string().min(1),
  })
  .strict();

export type LeadCreatedEvent = z.infer<typeof leadCreatedEventSchema>;
