import { z } from 'zod';

/**
 * Rename and/or re-parent a folder (`PATCH /api/media/folders/:id`). Strict (N7).
 *
 * `parentId` is a **tri-state** and the distinction is load-bearing:
 *   - absent  → leave the parent alone (a pure rename)
 *   - `null`  → move to the root
 *   - a uuid  → move under that folder
 * A plain `.optional()` uuid could not express "move to root", and `.nullable()` alone could not
 * express "don't touch it" — so both are allowed and the service reads `'parentId' in body`.
 */
export const folderUpdateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    parentId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine(
    (body) => body.name !== undefined || 'parentId' in body,
    // An empty PATCH is a client bug, not a no-op to absorb silently (U23). The message is a
    // CATALOG KEY, not prose — the validation pipe passes an author-written key straight
    // through, and the edge renders it in the caller's locale (U24).
    { message: 'validation.emptyUpdate' },
  );

export type FolderUpdateRequest = z.infer<typeof folderUpdateRequestSchema>;

/** The gateway-folded update payload (id from the path + the body). */
export const folderUpdatePayloadSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(120).optional(),
    parentId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type FolderUpdatePayload = z.infer<typeof folderUpdatePayloadSchema>;

/**
 * How to handle a folder that still has children/assets when it is deleted.
 *   - `block`  (default) → refuse, and say what's inside. The safe answer for a click.
 *   - `reparent`         → move its children + assets up to its own parent, then delete.
 * There is deliberately NO recursive-delete option: destroying an unknown number of assets
 * behind one confirm is not a mistake we want to make possible.
 */
export const folderDeleteStrategySchema = z.enum(['block', 'reparent']);
export type FolderDeleteStrategy = z.infer<typeof folderDeleteStrategySchema>;

/** `DELETE /api/media/folders/:id?strategy=` */
export const folderDeleteQuerySchema = z
  .object({
    strategy: folderDeleteStrategySchema.default('block'),
  })
  .strict();

export type FolderDeleteQuery = z.infer<typeof folderDeleteQuerySchema>;

/** The gateway-folded delete payload. */
export const folderDeletePayloadSchema = z
  .object({
    id: z.string().uuid(),
    strategy: folderDeleteStrategySchema,
  })
  .strict();

export type FolderDeletePayload = z.infer<typeof folderDeletePayloadSchema>;
