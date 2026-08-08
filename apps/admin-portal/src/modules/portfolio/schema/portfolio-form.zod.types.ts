import { portfolioStatusSchema, slugSchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable portfolio-project fields (edited per-locale under LocaleTabs, W6). */
export const PORTFOLIO_TRANSLATABLE_KEYS = [
  'title',
  'summary',
  'challenge',
  'solution',
  'result',
] as const;

/** Optional fields whose empty form value ('') becomes `null` in the upsert body. */
export const PORTFOLIO_NULLABLE_KEYS = [
  'categoryId',
  'coverMediaId',
  'clientName',
  'projectUrl',
] as const;

/**
 * The portfolio-project DynamicForm shape (U16) — the form's translatable case-study fields
 * (`title`/`summary`/`challenge`/`solution`/`result`) live under a `translations` map (kit
 * convention) while the contract carries them as top-level `{ar,en}` (the `localized-form`
 * helpers pivot between the two). `categoryId`/`coverMediaId` are '' (none) or a uuid; `status`
 * is the draft/published enum. Ordering is owned by the drag-reorder list (U21), not a form field.
 */
export const portfolioFormSchema = z.object({
  slug: slugSchema,
  categoryId: z.union([z.literal(''), z.string().uuid()]),
  coverMediaId: z.union([z.literal(''), z.string().uuid()]),
  clientName: z.string().trim().max(160),
  projectUrl: z.union([z.literal(''), z.string().trim().url().max(2048)]),
  status: portfolioStatusSchema,
  featured: z.boolean(),
  ...phantomTranslatableKeys(PORTFOLIO_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({
    required: ['title'],
    optional: ['summary', 'challenge', 'solution', 'result'],
  }),
});

export type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;
