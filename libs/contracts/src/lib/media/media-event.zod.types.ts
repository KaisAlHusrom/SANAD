import { z } from 'zod';

/**
 * The `media.deleted` event payload (MS3 Outbox). Carries the deleted asset's id + R2 key so
 * the content-service (P5) reconciles any references. Zod-first because the consumer
 * runtime-validates the inbound broker message (U16); the producer (media) builds the same
 * inferred shape.
 */
export const mediaDeletedEventSchema = z
  .object({
    id: z.string().uuid(),
    key: z.string().min(1),
  })
  .strict();

export type MediaDeletedEvent = z.infer<typeof mediaDeletedEventSchema>;
