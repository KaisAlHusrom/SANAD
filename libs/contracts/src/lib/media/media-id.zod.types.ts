import { z } from 'zod';

/** Address a single asset by id (get/delete message payloads). Strict (N7). `.zod.types` (U16). */
export const mediaIdSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export type MediaId = z.infer<typeof mediaIdSchema>;
