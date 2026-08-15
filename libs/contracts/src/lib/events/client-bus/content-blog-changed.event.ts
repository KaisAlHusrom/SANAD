import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `content.blog.changed` — A blog post was created, edited, published or deleted. */
export const contentBlogChangedEvent = {
  name: 'content.blog.changed',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/blog/api/blog.api.ts',
  description: 'A blog post was created, edited, published or deleted.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/modules/dashboard/hooks/use-dashboard/use-dashboard.ts',
      reacts:
        'Refetches the dashboard counts — `DashboardCounts.blogPosts` is derived from this collection.',
    },
  ],
} as const satisfies EventDefinition;
