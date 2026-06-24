import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';

/**
 * The confirm BODY (POST /api/media/uploads/:id/confirm) — the asset id is the `:id`
 * path param, not the body. The client reports the now-known image dimensions (optional)
 * and may finalize `alt`. Strict (N7). Runtime-validated → `.zod.types` file (U16).
 */
export const uploadConfirmBodySchema = z
  .object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    alt: localizedTextSchema.optional(),
  })
  .strict();

export type UploadConfirmBody = z.infer<typeof uploadConfirmBodySchema>;

/**
 * The full confirm message (gateway → media-service over RMQ): the body plus the
 * `assetId` lifted from the path. The service marks the asset `ready` and resolves its
 * CDN URL. Strict (N7).
 */
export const uploadConfirmRequestSchema = uploadConfirmBodySchema
  .extend({
    assetId: z.string().uuid(),
  })
  .strict();

export type UploadConfirmRequest = z.infer<typeof uploadConfirmRequestSchema>;
