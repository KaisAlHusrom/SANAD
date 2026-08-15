import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `media.folder.changed` — A media folder was renamed, re-parented or deleted, so the tree shape moved. */
export const mediaFolderChangedEvent = {
  name: 'media.folder.changed',
  transport: 'client-bus',
  payloadSchema: z.object({ folderId: z.string().uuid() }).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/data/media-manage.api.ts',
  description:
    'A media folder was renamed, re-parented or deleted, so the tree shape moved.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/components/media-explorer/use-media-explorer.ts',
      reacts:
        'Re-reads the whole tree — a rename, a move and a delete all reshape it.',
    },
  ],
} as const satisfies EventDefinition;
