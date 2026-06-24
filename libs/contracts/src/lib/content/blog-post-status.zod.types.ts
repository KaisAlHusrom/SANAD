import { z } from 'zod';

/**
 * A blog post's editorial state (WEB2): `draft` (admin-only) or `published` (live on the
 * website). Mirrors the `blog_post_status` Postgres enum (U3). The gateway forces `published`
 * on the public list/detail so drafts never leak. Kept distinct from `portfolio_status`.
 */
export const blogPostStatusSchema = z.enum(['draft', 'published']);

export type BlogPostStatus = z.infer<typeof blogPostStatusSchema>;
