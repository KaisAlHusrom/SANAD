import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `content.team-member.changed` — A team member was created, edited, reordered or deleted. */
export const contentTeamMemberChangedEvent = {
  name: 'content.team-member.changed',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/team/api/team.api.ts',
  description: 'A team member was created, edited, reordered or deleted.',
  consumers: [],
  orphanReason:
    'No admin surface outside the owning module reads this collection, and `DashboardCounts` does not ' +
    'count it — so a subscriber today would be a refetch nobody is waiting for. The website is a ' +
    'separate app and revalidates over the BROKER, which P8.23 adds on the producer side. Declared ' +
    'now so the first cross-module reader subscribes to this name instead of inventing another.',
} as const satisfies EventDefinition;
