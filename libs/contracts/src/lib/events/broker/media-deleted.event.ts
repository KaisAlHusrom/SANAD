import { mediaDeletedEventSchema } from '../../media/media-event.zod.types.js';
import { MEDIA_DELETED_EVENT } from '../../media/message-pattern.js';
import type { EventDefinition } from '../event-definition.types.js';

/**
 * `media.deleted` — an asset was removed from the library and from R2. Enqueued in the same
 * transaction as the delete (MS3) so a reference elsewhere can never outlive the bytes.
 */
export const mediaDeletedEvent = {
  name: MEDIA_DELETED_EVENT,
  transport: 'broker',
  payloadSchema: mediaDeletedEventSchema,
  producer: 'media-service',
  producedAt: 'apps/media-service/src/media/application/media.service.ts',
  description:
    'A media asset was deleted; its id and R2 key may still be referenced elsewhere.',
  consumers: [
    {
      actor: 'content-service',
      at: 'apps/content-service/src/content/infrastructure/consumers/media-deleted.consumer.ts',
      reacts:
        'Reconciles every content reference to the deleted asset so nothing renders a dead image.',
    },
  ],
} as const satisfies EventDefinition;
