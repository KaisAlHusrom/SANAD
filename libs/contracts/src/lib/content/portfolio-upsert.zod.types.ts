import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { portfolioStatusSchema } from './portfolio-status.zod.types.js';
import { slugSchema } from './content-slug.zod.types.js';

/**
 * Create a portfolio project (admin, `content.manage`). `categoryId` is a soft FK to a
 * portfolio category (ids-on-write); the translatable `title` is supplied in BOTH locales (the
 * case-study `summary`/`challenge`/`solution`/`result` optional). `status` defaults `draft`;
 * `publishedAt` is server-managed (set on first publish), never client-supplied. Strict (N7);
 * `.zod.types` (U16).
 */
export const portfolioCreateSchema = z
  .object({
    slug: slugSchema,
    categoryId: z.string().uuid().nullable().optional(),
    coverMediaId: z.string().uuid().nullable().optional(),
    clientName: z.string().trim().min(1).max(160).nullable().optional(),
    projectUrl: z.string().trim().url().max(2048).nullable().optional(),
    status: portfolioStatusSchema.default('draft'),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().min(0).default(0),
    title: localizedTextSchema,
    summary: localizedTextSchema.optional(),
    challenge: localizedTextSchema.optional(),
    solution: localizedTextSchema.optional(),
    result: localizedTextSchema.optional(),
  })
  .strict();

export type PortfolioCreateRequest = z.infer<typeof portfolioCreateSchema>;

/**
 * Update a portfolio project by id (admin). All fields optional (partial); translatable fields,
 * when present, carry both locales. `publishedAt` stays server-managed. Strict (N7).
 */
export const portfolioUpdateSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema.optional(),
    categoryId: z.string().uuid().nullable().optional(),
    coverMediaId: z.string().uuid().nullable().optional(),
    clientName: z.string().trim().min(1).max(160).nullable().optional(),
    projectUrl: z.string().trim().url().max(2048).nullable().optional(),
    status: portfolioStatusSchema.optional(),
    featured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    title: localizedTextSchema.optional(),
    summary: localizedTextSchema.optional(),
    challenge: localizedTextSchema.optional(),
    solution: localizedTextSchema.optional(),
    result: localizedTextSchema.optional(),
  })
  .strict();

export type PortfolioUpdateRequest = z.infer<typeof portfolioUpdateSchema>;
