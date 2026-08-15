import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `lead.updated` — A lead changed status or was edited from the leads inbox. */
export const leadUpdatedEvent = {
  name: 'lead.updated',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/leads/api/leads.api.ts',
  description: 'A lead changed status or was edited from the leads inbox.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/modules/dashboard/hooks/use-dashboard/use-dashboard.ts',
      reacts:
        'Refetches the dashboard counts and the recent-leads strip so neither goes stale.',
    },
  ],
} as const satisfies EventDefinition;
