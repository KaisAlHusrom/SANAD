import { leadCreatedEventSchema } from '../../content/lead-event.zod.types.js';
import { LEAD_CREATED_EVENT } from '../../content/message-pattern.js';
import type { EventDefinition } from '../event-definition.types.js';

/**
 * `lead.created` — the website contact / request-a-project form was submitted. Written to the
 * Outbox in the SAME transaction as the lead row (MS3); the relay publishes it. The name
 * constant and the payload schema stay in the content domain — the catalog INDEXES them, it
 * never restates them (U3).
 */
export const leadCreatedEvent = {
  name: LEAD_CREATED_EVENT,
  transport: 'broker',
  payloadSchema: leadCreatedEventSchema,
  producer: 'content-service',
  producedAt:
    'apps/content-service/src/content/application/services/lead/lead.service.ts',
  description:
    'A visitor submitted the contact or request-a-project form on the website.',
  consumers: [
    {
      actor: 'notifications-service',
      at: 'apps/notifications-service/src/notification/infrastructure/consumers/lead-created.consumer.ts',
      reacts:
        'Emails the team, acknowledges the visitor in their own locale, and records an in-app notification.',
    },
  ],
} as const satisfies EventDefinition;
