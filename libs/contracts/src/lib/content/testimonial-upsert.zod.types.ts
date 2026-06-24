import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';

/**
 * Create a testimonial (admin, `content.manage`). `authorName` is the required proper noun;
 * the translatable `quote` is supplied in BOTH locales (`authorRole`/`companyDescriptor`
 * optional). `avatarMediaId` is a soft media reference (MS5). Strict (N7); `.zod.types` (U16).
 */
export const testimonialCreateSchema = z
  .object({
    authorName: z.string().trim().min(1).max(160),
    companyName: z.string().trim().min(1).max(160).nullable().optional(),
    avatarMediaId: z.string().uuid().nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().min(0).default(0),
    quote: localizedTextSchema,
    authorRole: localizedTextSchema.optional(),
    companyDescriptor: localizedTextSchema.optional(),
  })
  .strict();

export type TestimonialCreateRequest = z.infer<typeof testimonialCreateSchema>;

/**
 * Update a testimonial by id (admin). All fields optional (partial); translatable fields,
 * when present, carry both locales. Strict (N7).
 */
export const testimonialUpdateSchema = z
  .object({
    id: z.string().uuid(),
    authorName: z.string().trim().min(1).max(160).optional(),
    companyName: z.string().trim().min(1).max(160).nullable().optional(),
    avatarMediaId: z.string().uuid().nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    featured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    quote: localizedTextSchema.optional(),
    authorRole: localizedTextSchema.optional(),
    companyDescriptor: localizedTextSchema.optional(),
  })
  .strict();

export type TestimonialUpdateRequest = z.infer<typeof testimonialUpdateSchema>;
