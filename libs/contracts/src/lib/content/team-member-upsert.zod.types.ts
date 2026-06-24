import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { slugSchema } from './content-slug.zod.types.js';

/**
 * Create a team member (admin, `content.manage`). `slug` is unique; the translatable
 * `name`/`role` are supplied in BOTH locales (`bio` optional). `avatarMediaId` is a soft media
 * reference (MS5); social links are validated URLs. Strict (N7); `.zod.types` (U16).
 */
export const teamMemberCreateSchema = z
  .object({
    slug: slugSchema,
    avatarMediaId: z.string().uuid().nullable().optional(),
    email: z.string().trim().email().max(254).nullable().optional(),
    linkedinUrl: z.string().trim().url().max(2048).nullable().optional(),
    githubUrl: z.string().trim().url().max(2048).nullable().optional(),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().min(0).default(0),
    name: localizedTextSchema,
    role: localizedTextSchema,
    bio: localizedTextSchema.optional(),
  })
  .strict();

export type TeamMemberCreateRequest = z.infer<typeof teamMemberCreateSchema>;

/**
 * Update a team member by id (admin). All fields optional (partial); translatable fields,
 * when present, carry both locales. Strict (N7).
 */
export const teamMemberUpdateSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema.optional(),
    avatarMediaId: z.string().uuid().nullable().optional(),
    email: z.string().trim().email().max(254).nullable().optional(),
    linkedinUrl: z.string().trim().url().max(2048).nullable().optional(),
    githubUrl: z.string().trim().url().max(2048).nullable().optional(),
    featured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    name: localizedTextSchema.optional(),
    role: localizedTextSchema.optional(),
    bio: localizedTextSchema.optional(),
  })
  .strict();

export type TeamMemberUpdateRequest = z.infer<typeof teamMemberUpdateSchema>;
