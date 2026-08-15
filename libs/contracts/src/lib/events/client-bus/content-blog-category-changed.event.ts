import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `content.blog-category.changed` — A blog category was created, edited, reordered or deleted. */
export const contentBlogCategoryChangedEvent = {
  name: 'content.blog-category.changed',
  transport: 'client-bus',
  payloadSchema: z.object({}).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/modules/blog/api/blog-categories.api.ts',
  description: 'A blog category was created, edited, reordered or deleted.',
  consumers: [],
  orphanReason:
    'No admin surface outside the owning module reads this collection, and `DashboardCounts` does not ' +
    'count it — so a subscriber today would be a refetch nobody is waiting for. The website is a ' +
    'separate app and revalidates over the BROKER, which P8.23 adds on the producer side. Declared ' +
    'now so the first cross-module reader subscribes to this name instead of inventing another.',
} as const satisfies EventDefinition;
