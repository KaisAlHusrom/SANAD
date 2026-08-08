import { z } from 'zod';

/**
 * How a collection-backed section (services/work/testimonials/blog…) selects the records it
 * shows. Stored non-translatably on the section (`section.config` jsonb) and used by the
 * content-service to **hydrate** the collection in-service (same DB, no RMQ — MS5), attaching
 * the resolved items onto the returned `SectionNode.collection` (F7 null-safe). `.strict()`
 * (N7); `.zod.types` (U16).
 *
 * - `mode: 'all'` — the collection's own order (`sortOrder`/`publishedAt`), capped at `limit`.
 * - `mode: 'featured'` — only the collection's featured records (falls back to `all` for
 *   collections without a `featured` flag, e.g. services — documented per-collection).
 * - `mode: 'picked'` — exactly the records in `ids`, IN THE GIVEN ORDER.
 */
export const sectionConfigSchema = z
  .object({
    mode: z.enum(['featured', 'picked', 'all']).default('all'),
    limit: z.number().int().min(1).max(50).optional(),
    ids: z.array(z.string().uuid()).default([]),
  })
  .strict();

export type SectionCollectionConfig = z.infer<typeof sectionConfigSchema>;
