import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';

/**
 * Request a presigned upload (POST /api/media/uploads). The client states the file it
 * intends to PUT directly to R2; the service validates MIME/size against its coded
 * allowlist (U18), creates a `pending` asset, and mints the signed URL. Strict (N7).
 * Runtime-validated → `.zod.types` file (U16). `alt` may be supplied now or at confirm.
 */
export const uploadSignRequestSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.string().trim().min(1).max(255),
    size: z.number().int().positive(),
    folderId: z.string().uuid().optional(),
    alt: localizedTextSchema.optional(),
  })
  .strict();

export type UploadSignRequest = z.infer<typeof uploadSignRequestSchema>;
