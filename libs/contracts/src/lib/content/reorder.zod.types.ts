import { z } from 'zod';

/**
 * Reorder an orderable collection (U21 drag-and-drop): the full ordered list of ids — the
 * server renumbers `sortOrder` to the array index, atomically. Shared by every orderable
 * resource's `*.reorder` message + gateway `PATCH /…/reorder` route. Strict (N7). `.zod.types` (U16).
 */
export const reorderRequestSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1),
  })
  .strict();

export type ReorderRequest = z.infer<typeof reorderRequestSchema>;
