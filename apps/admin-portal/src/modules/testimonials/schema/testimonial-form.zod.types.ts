import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable testimonial fields (edited per-locale under LocaleTabs, W6). */
export const TESTIMONIAL_TRANSLATABLE_KEYS = [
  'quote',
  'authorRole',
  'companyDescriptor',
] as const;

/** Optional fields whose empty form value ('') becomes `null` in the upsert body. */
export const TESTIMONIAL_NULLABLE_KEYS = [
  'companyName',
  'avatarMediaId',
  'rating',
] as const;

/**
 * The testimonials DynamicForm shape (U16). `authorName`/`companyName` are non-translatable
 * proper nouns; `rating` is '' (none) or 1–5; the translatable `quote`/`authorRole`/
 * `companyDescriptor` live under `translations` (the `localized-form` helpers pivot to the
 * contract `{ar,en}`). Numbers are coerced (native inputs register as strings).
 */
export const testimonialFormSchema = z.object({
  authorName: z.string().trim().min(1).max(160),
  companyName: z.string().trim().max(160),
  avatarMediaId: z.union([z.literal(''), z.string().uuid()]),
  rating: z.union([z.literal(''), z.coerce.number().int().min(1).max(5)]),
  featured: z.boolean(),
  ...phantomTranslatableKeys(TESTIMONIAL_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({
    required: ['quote'],
    optional: ['authorRole', 'companyDescriptor'],
  }),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;
