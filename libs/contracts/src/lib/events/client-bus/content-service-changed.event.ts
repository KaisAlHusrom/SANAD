import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `content.service.changed` — A website service offering was created, edited, reordered or deleted. */
export const contentServiceChangedEvent = {
  name: 'content.service.changed',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/services/api/services.api.ts',
  description:
    'A website service offering was created, edited, reordered or deleted.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/modules/dashboard/hooks/use-dashboard/use-dashboard.ts',
      reacts:
        'Refetches the dashboard counts — `DashboardCounts.services` is derived from this collection.',
    },
  ],
} as const satisfies EventDefinition;
