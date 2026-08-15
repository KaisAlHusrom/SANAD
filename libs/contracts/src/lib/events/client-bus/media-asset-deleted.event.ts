import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `media.asset.deleted` — An asset was deleted from the library and from R2 storage. */
export const mediaAssetDeletedEvent = {
  name: 'media.asset.deleted',
  transport: 'client-bus',
  payloadSchema: z.object({ assetId: z.string().uuid() }).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/data/media-manage.api.ts',
  description: 'An asset was deleted from the library and from R2 storage.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/components/media-explorer/use-media-explorer.ts',
      reacts:
        'Drops the asset from the listing and clears it from the current selection.',
    },
  ],
} as const satisfies EventDefinition;
