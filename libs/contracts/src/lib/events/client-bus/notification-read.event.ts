import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `notification.read` — An in-app notification was marked read by the signed-in user. */
export const notificationReadEvent = {
  name: 'notification.read',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt:
    'apps/admin-portal/src/modules/notifications/api/notifications.api.ts',
  description: 'An in-app notification was marked read by the signed-in user.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/modules/dashboard/hooks/use-dashboard/use-dashboard.ts',
      reacts:
        'Refetches the unread count and the recent-activity list on the dashboard.',
    },
  ],
} as const satisfies EventDefinition;
