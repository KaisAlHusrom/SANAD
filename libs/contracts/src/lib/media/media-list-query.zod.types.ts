import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';
import { mediaAssetStatusSchema } from './media-asset-status.zod.types.js';

/**
 * The sentinel that means "the ROOT folder" in a query string. `folderId` omitted means
 * "everywhere, any folder"; `folderId=root` means "only the assets that are in no folder" —
 * two genuinely different views in a file explorer, and a query string cannot carry `null`.
 */
export const MEDIA_ROOT_FOLDER = 'root';

/**
 * The media library list query (GET /api/media). Extends the shared paginated/searchable
 * list query (U17) with media-specific whitelisted filters: `folderId` (a uuid, or the `root`
 * sentinel), a `type` MIME-prefix (e.g. `image`), and `status`. Strict so unknown query keys
 * are rejected (N7). Runtime-validated → `.zod.types` file (U16).
 */
export const mediaListQuerySchema = listQuerySchema
  .extend({
    folderId: z
      .union([z.string().uuid(), z.literal(MEDIA_ROOT_FOLDER)])
      .optional(),
    type: z.string().trim().min(1).max(64).optional(),
    /**
     * Defaults to `ready` at the SERVICE, not here: a caller that says nothing wants usable
     * assets, but the explorer explicitly asks for `pending` to show an upload still in flight.
     */
    status: mediaAssetStatusSchema.optional(),
  })
  .strict();

export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
