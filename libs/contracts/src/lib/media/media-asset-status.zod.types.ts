import { z } from 'zod';

/**
 * The lifecycle status of a media asset. `pending` = the row exists + a presigned
 * URL was issued, bytes not yet confirmed; `ready` = upload confirmed, the asset is
 * usable. Runtime-validated + mirrored by a Postgres enum in the media-service schema
 * → a `.zod.types` file (U16).
 */
export const mediaAssetStatusSchema = z.enum(['pending', 'ready']);

export type MediaAssetStatus = z.infer<typeof mediaAssetStatusSchema>;
