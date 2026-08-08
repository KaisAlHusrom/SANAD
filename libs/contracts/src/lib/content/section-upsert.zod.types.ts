import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { sectionConfigSchema } from './section-config.zod.types.js';
import { sectionTypeSchema } from './section-type.zod.types.js';

/**
 * Create-or-update a section within a page (admin, `content.manage`). `id` present → update;
 * absent → create under `pageId`. All translatable copy (eyebrow/title/subtitle) is optional
 * and supplied in BOTH locales. `config` links the section to a collection (services/work/…).
 * Strict (N7); `.zod.types` (U16).
 */
export const sectionUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    pageId: z.string().uuid(),
    type: sectionTypeSchema,
    sortOrder: z.number().int().min(0).default(0),
    published: z.boolean().default(true),
    eyebrow: localizedTextSchema.optional(),
    title: localizedTextSchema.optional(),
    subtitle: localizedTextSchema.optional(),
    config: sectionConfigSchema.optional(),
  })
  .strict();

export type SectionUpsertRequest = z.infer<typeof sectionUpsertSchema>;
