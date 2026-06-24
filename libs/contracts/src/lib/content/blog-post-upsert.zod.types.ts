import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { blogPostStatusSchema } from './blog-post-status.zod.types.js';
import { slugSchema } from './content-slug.zod.types.js';

/**
 * Create a blog post (admin, `content.manage`). `categoryId`/`authorTeamMemberId` are soft FKs
 * and `tagIds` is the M2M tag set (ids-on-write); the translatable `title` is supplied in BOTH
 * locales (`excerpt`/`body` optional). `status` defaults `draft`; `publishedAt` is server-managed
 * (set on first publish), never client-supplied. Strict (N7); `.zod.types` (U16).
 */
export const blogPostCreateSchema = z
  .object({
    slug: slugSchema,
    categoryId: z.string().uuid().nullable().optional(),
    authorTeamMemberId: z.string().uuid().nullable().optional(),
    coverMediaId: z.string().uuid().nullable().optional(),
    status: blogPostStatusSchema.default('draft'),
    readMinutes: z.number().int().min(0).max(600).nullable().optional(),
    sortOrder: z.number().int().min(0).default(0),
    tagIds: z.array(z.string().uuid()).default([]),
    title: localizedTextSchema,
    excerpt: localizedTextSchema.optional(),
    body: localizedTextSchema.optional(),
  })
  .strict();

export type BlogPostCreateRequest = z.infer<typeof blogPostCreateSchema>;

/**
 * Update a blog post by id (admin). All fields optional (partial); translatable fields carry
 * both locales when present. `tagIds`, when present, REPLACES the post's tag set. `publishedAt`
 * stays server-managed. Strict (N7).
 */
export const blogPostUpdateSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema.optional(),
    categoryId: z.string().uuid().nullable().optional(),
    authorTeamMemberId: z.string().uuid().nullable().optional(),
    coverMediaId: z.string().uuid().nullable().optional(),
    status: blogPostStatusSchema.optional(),
    readMinutes: z.number().int().min(0).max(600).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    title: localizedTextSchema.optional(),
    excerpt: localizedTextSchema.optional(),
    body: localizedTextSchema.optional(),
  })
  .strict();

export type BlogPostUpdateRequest = z.infer<typeof blogPostUpdateSchema>;
