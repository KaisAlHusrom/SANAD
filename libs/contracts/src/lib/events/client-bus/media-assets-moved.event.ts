import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `media.assets.moved` — A selection of assets was moved into a folder (`null` is the library root). */
export const mediaAssetsMovedEvent = {
  name: 'media.assets.moved',
  transport: 'client-bus',
  payloadSchema: z.object({ folderId: z.string().uuid().nullable() }).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/data/media-manage.api.ts',
  description:
    'A selection of assets was moved into a folder (`null` is the library root).',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/components/media-explorer/use-media-explorer.ts',
      reacts:
        'Refetches both the tree counts and the current folder listing, which shift together.',
    },
  ],
} as const satisfies EventDefinition;
