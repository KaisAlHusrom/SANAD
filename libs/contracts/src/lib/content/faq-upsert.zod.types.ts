import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { faqCategorySchema } from './faq-category.zod.types.js';

/**
 * Create an FAQ (admin, `content.manage`). The translatable `question`/`answer` are supplied
 * in BOTH locales; `category` is an optional grouping. Strict (N7); `.zod.types` (U16).
 */
export const faqCreateSchema = z
  .object({
    category: faqCategorySchema.nullable().optional(),
    sortOrder: z.number().int().min(0).default(0),
    question: localizedTextSchema,
    answer: localizedTextSchema,
  })
  .strict();

export type FaqCreateRequest = z.infer<typeof faqCreateSchema>;

/**
 * Update an FAQ by id (admin). All fields optional (partial); translatable fields, when
 * present, carry both locales. Strict (N7).
 */
export const faqUpdateSchema = z
  .object({
    id: z.string().uuid(),
    category: faqCategorySchema.nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    question: localizedTextSchema.optional(),
    answer: localizedTextSchema.optional(),
  })
  .strict();

export type FaqUpdateRequest = z.infer<typeof faqUpdateSchema>;
