import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `media.folder.created` — A media folder was created somewhere in the library tree. */
export const mediaFolderCreatedEvent = {
  name: 'media.folder.created',
  transport: 'client-bus',
  payloadSchema: z.object({ folderId: z.string().uuid() }).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/data/media-manage.api.ts',
  description: 'A media folder was created somewhere in the library tree.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/components/media-explorer/use-media-explorer.ts',
      reacts:
        'Refetches the folder tree so the new folder appears in its parent.',
    },
  ],
} as const satisfies EventDefinition;
