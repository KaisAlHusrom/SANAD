import { slugSchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable blog-tag fields (edited per-locale under LocaleTabs, W6). */
export const BLOG_TAG_TRANSLATABLE_KEYS = ['name'] as const;

/**
 * The blog-tag DynamicForm shape (U16) — a translatable lookup: `slug` plus the per-locale
 * `name` under `translations` (pivoted to the contract `{ar,en}`). Order is set by drag-reorder
 * on the list (the server owns `sortOrder`), not a form field.
 */
export const blogTagFormSchema = z.object({
  slug: slugSchema,
  ...phantomTranslatableKeys(BLOG_TAG_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({ required: ['name'], optional: [] }),
});

export type BlogTagFormValues = z.infer<typeof blogTagFormSchema>;
