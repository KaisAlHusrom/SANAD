import { z } from 'zod';

/** Address a single content entity by id (get/delete payloads). Strict (N7). `.zod.types` (U16). */
export const contentIdSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export type ContentId = z.infer<typeof contentIdSchema>;
