import { z } from 'zod';

/**
 * Publication state of a page (and blog posts later). `draft` is admin-only; the website
 * renders `published` pages. Mirrored by the `page_status` Postgres enum in the service.
 */
export const pageStatusSchema = z.enum(['draft', 'published']);

export type PageStatus = z.infer<typeof pageStatusSchema>;
