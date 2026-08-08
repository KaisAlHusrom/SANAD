import { faqCategorySchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable FAQ fields (edited per-locale under LocaleTabs, W6). */
export const FAQ_TRANSLATABLE_KEYS = ['question', 'answer'] as const;

/** Optional fields whose empty form value ('') becomes `null` in the upsert body. */
export const FAQ_NULLABLE_KEYS = ['category'] as const;

/**
 * The FAQs DynamicForm shape (U16). `category` is an optional grouping ('' → ungrouped); the
 * translatable `question`/`answer` live under `translations` (the `localized-form` helpers
 * pivot to the contract `{ar,en}`). No slug — FAQs are list-only. `sortOrder` is not a form
 * field; it's set via drag-reorder (PATCH `/content/faqs/reorder`, U21).
 */
export const faqFormSchema = z.object({
  category: z.union([z.literal(''), faqCategorySchema]),
  ...phantomTranslatableKeys(FAQ_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({
    required: ['question', 'answer'],
    optional: [],
  }),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;
