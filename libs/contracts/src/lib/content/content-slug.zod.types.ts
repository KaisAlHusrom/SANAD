import { z } from 'zod';

/**
 * A URL slug: lowercase letters/digits/hyphens (e.g. `landing`, `multi-tenant-saas`).
 * Used both as a request param (page tree / service detail) and inside upsert bodies.
 */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'must be a lowercase slug (a-z, 0-9, hyphens)',
  );

/** Address a content entity by its slug (page tree / service detail payloads). Strict (N7). */
export const contentSlugSchema = z
  .object({
    slug: slugSchema,
  })
  .strict();

export type ContentSlug = z.infer<typeof contentSlugSchema>;
