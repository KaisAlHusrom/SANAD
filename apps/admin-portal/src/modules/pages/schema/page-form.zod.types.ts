import { pageStatusSchema, slugSchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable page fields (edited per-locale under LocaleTabs, W6). */
export const PAGE_TRANSLATABLE_KEYS = [
  'title',
  'metaTitle',
  'metaDescription',
] as const;

/**
 * The page-meta DynamicForm shape (U16) — `slug` + `status` plus the translatable title and
 * SEO meta under a `translations` map (the kit convention; the `localized-form` helpers pivot
 * to the contract's top-level `{ar,en}`). Sections/blocks are edited in the builder, not here;
 * ordering is owned by the drag-reorder list (U21), not a form field.
 */
export const pageFormSchema = z.object({
  slug: slugSchema,
  status: pageStatusSchema,
  ...phantomTranslatableKeys(PAGE_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({
    required: ['title'],
    optional: ['metaTitle', 'metaDescription'],
  }),
});

export type PageFormValues = z.infer<typeof pageFormSchema>;
