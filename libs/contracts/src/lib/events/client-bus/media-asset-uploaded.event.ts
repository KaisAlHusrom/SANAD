import { z } from 'zod';
import type { EventDefinition } from '../event-definition.types.js';

/** `media.asset.uploaded` — An asset finished uploading and is now listed in the media library. */
export const mediaAssetUploadedEvent = {
  name: 'media.asset.uploaded',
  transport: 'client-bus',
  payloadSchema: z.object({ assetId: z.string().uuid() }).strict(),
  producer: 'admin-portal',
  producedAt: 'apps/admin-portal/src/data/media-manage.api.ts',
  description:
    'An asset finished uploading and is now listed in the media library.',
  consumers: [
    {
      actor: 'admin-portal',
      at: 'apps/admin-portal/src/components/media-explorer/use-media-explorer.ts',
      reacts:
        'Refetches the open folder listing so the new asset appears where it was dropped.',
    },
  ],
} as const satisfies EventDefinition;
