import { z } from 'zod';

/** The most ids one public batch-resolve may request (bounds the `IN` query + query string). */
export const MEDIA_PUBLIC_RESOLVE_MAX_IDS = 100;

/**
 * Batch-resolve a set of media ids → public URLs (the payload behind the UNGUARDED
 * `GET /media/public` gateway route). Strict (N7); ids are UUIDs, capped so a hostile
 * caller can't request an unbounded page. `.zod.types` (U16).
 */
export const mediaPublicResolveRequestSchema = z
  .object({
    ids: z.array(z.string().uuid()).max(MEDIA_PUBLIC_RESOLVE_MAX_IDS),
  })
  .strict();

export type MediaPublicResolveRequest = z.infer<
  typeof mediaPublicResolveRequestSchema
>;
