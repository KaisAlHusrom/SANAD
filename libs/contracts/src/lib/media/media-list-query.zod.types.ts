import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';

/**
 * The media library list query (GET /api/media). Extends the shared paginated/searchable
 * list query (U17) with media-specific whitelisted filters: a `folderId` and a `type`
 * MIME-prefix (e.g. `image`). Strict so unknown query keys are rejected (N7).
 * Runtime-validated → `.zod.types` file (U16).
 */
export const mediaListQuerySchema = listQuerySchema
  .extend({
    folderId: z.string().uuid().optional(),
    type: z.string().trim().min(1).max(64).optional(),
  })
  .strict();

export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
