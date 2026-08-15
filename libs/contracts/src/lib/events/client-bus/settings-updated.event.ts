import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `settings.updated` — A settings group was saved from the admin, so the resolved values changed. */
export const settingsUpdatedEvent = {
  name: 'settings.updated',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/settings/api/settings.api.ts',
  description:
    'A settings group was saved from the admin, so the resolved values changed.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/providers/branding/use-branding-theme.ts',
      reacts:
        'Re-reads the resolved branding and re-applies the theme tokens without a reload.',
    },
  ],
} as const satisfies EventDefinition;
