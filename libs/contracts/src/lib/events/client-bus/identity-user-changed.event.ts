import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `identity.user.changed` — A staff user was created, edited, deactivated, or had a role assigned or revoked. */
export const identityUserChangedEvent = {
  name: 'identity.user.changed',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/users/api/users.api.ts',
  description:
    'A staff user was created, edited, deactivated, or had a role assigned or revoked.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/modules/dashboard/hooks/use-dashboard/use-dashboard.ts',
      reacts:
        'Refetches the dashboard user count, which the change may have moved.',
    },
  ],
} as const satisfies EventDefinition;
