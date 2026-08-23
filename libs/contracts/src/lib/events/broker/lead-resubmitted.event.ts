import { leadResubmittedEventSchema } from '../../content/lead-resubmitted-event.zod.types.js';
import { LEAD_RESUBMITTED_EVENT } from '../../content/message-pattern.js';
import type { EventDefinition } from '../event-definition.types.js';

/**
 * `lead.resubmitted` — a submission was folded into an EXISTING lead instead of creating a second
 * one (P8.10.B2). Written to the Outbox in the SAME transaction as the counter bump and the audit
 * row (MS3); the relay publishes it. The name constant and the payload schema stay in the content
 * domain — the catalog INDEXES them, it never restates them (U3).
 */
export const leadResubmittedEvent = {
  name: LEAD_RESUBMITTED_EVENT,
  transport: 'broker',
  payloadSchema: leadResubmittedEventSchema,
  producer: 'content-service',
  producedAt:
    'apps/content-service/src/content/application/services/lead/lead.service.ts',
  description:
    'A visitor submitted again inside the duplicate window, so the existing lead absorbed it instead of a second row being created.',
  consumers: [
    {
      actor: 'notifications-service',
      at: 'apps/notifications-service/src/notification/infrastructure/consumers/lead-resubmitted/lead-resubmitted.consumer.ts',
      reacts:
        'Alerts the team that this person wrote again, carrying their new message and the submission count. The visitor is not acknowledged a second time.',
    },
  ],
} as const satisfies EventDefinition;
