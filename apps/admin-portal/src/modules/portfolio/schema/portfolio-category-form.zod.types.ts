import { slugSchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable portfolio-category fields (edited per-locale under LocaleTabs, W6). */
export const PORTFOLIO_CATEGORY_TRANSLATABLE_KEYS = ['name'] as const;

/**
 * The portfolio-category DynamicForm shape (U16) — a translatable lookup: `slug` plus the
 * per-locale `name` under `translations` (pivoted to the contract `{ar,en}` by the
 * `localized-form` helpers). Order is managed via drag-reorder (sortOrder), not this form.
 */
export const portfolioCategoryFormSchema = z.object({
  slug: slugSchema,
  ...phantomTranslatableKeys(PORTFOLIO_CATEGORY_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({ required: ['name'], optional: [] }),
});

export type PortfolioCategoryFormValues = z.infer<
  typeof portfolioCategoryFormSchema
>;
