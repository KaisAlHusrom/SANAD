import { slugSchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable blog-category fields (edited per-locale under LocaleTabs, W6). */
export const BLOG_CATEGORY_TRANSLATABLE_KEYS = ['name', 'description'] as const;

/**
 * The blog-category DynamicForm shape (U16) — a translatable taxonomy: `slug` plus the per-locale
 * `name` (required) and `description` (optional) under `translations` (pivoted to the contract
 * `{ar,en}` by the `localized-form` helpers). Ordering is managed by drag-reorder, not a field.
 */
export const blogCategoryFormSchema = z.object({
  slug: slugSchema,
  ...phantomTranslatableKeys(BLOG_CATEGORY_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({
    required: ['name'],
    optional: ['description'],
  }),
});

export type BlogCategoryFormValues = z.infer<typeof blogCategoryFormSchema>;
