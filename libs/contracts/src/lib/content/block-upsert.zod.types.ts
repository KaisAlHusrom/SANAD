import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { blockTypeSchema } from './block-type.zod.types.js';

/**
 * Create-or-update a block within a section (admin, `content.manage`). `id` present → update;
 * absent → create under `sectionId`. `data` holds non-translatable structured values (stat
 * numbers in Western digits, icon keys, urls); `imageMediaId` is a soft media reference
 * (NOT a cross-service FK, MS5). Translatable `title`/`body` are optional, both locales.
 * Strict (N7); `.zod.types` (U16).
 */
export const blockUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    sectionId: z.string().uuid(),
    type: blockTypeSchema,
    sortOrder: z.number().int().min(0).default(0),
    data: z.record(z.unknown()).default({}),
    imageMediaId: z.string().uuid().nullable().optional(),
    title: localizedTextSchema.optional(),
    body: localizedTextSchema.optional(),
  })
  .strict();

export type BlockUpsertRequest = z.infer<typeof blockUpsertSchema>;
