import { blogPostStatusSchema, slugSchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable blog-post fields (edited per-locale under LocaleTabs, W6). `body` is rich text. */
export const BLOG_TRANSLATABLE_KEYS = ['title', 'excerpt', 'body'] as const;

/** Optional fields whose empty form value ('') becomes `null` in the upsert body. */
export const BLOG_NULLABLE_KEYS = [
  'categoryId',
  'authorTeamMemberId',
  'coverMediaId',
  'readMinutes',
] as const;

/**
 * The blog-post DynamicForm shape (U16) — the form's translatable fields (`title`/`excerpt`/`body`)
 * live under a `translations` map (kit convention) while the contract carries them as top-level
 * `{ar,en}` (the `localized-form` helpers pivot between the two; `body` holds the rich-text HTML).
 * The single-select ids (`categoryId`/`authorTeamMemberId`/`coverMediaId`) and `readMinutes` are
 * '' (none) or a value, nulled in the body; `tagIds` is a uuid array (the multi ServerSelect);
 * `status` is the draft/published enum; numbers are coerced (native inputs register as strings).
 */
export const blogPostFormSchema = z.object({
  slug: slugSchema,
  status: blogPostStatusSchema,
  categoryId: z.union([z.literal(''), z.string().uuid()]),
  authorTeamMemberId: z.union([z.literal(''), z.string().uuid()]),
  coverMediaId: z.union([z.literal(''), z.string().uuid()]),
  // No `.default([])` — the field config seeds `[]` via `defaultValue` (build-default-values),
  // and a `.default` would make the schema's INPUT type optional, mismatching `ZodType<TValues>`.
  tagIds: z.array(z.string().uuid()),
  readMinutes: z.union([
    z.literal(''),
    z.coerce.number().int().min(0).max(600),
  ]),
  ...phantomTranslatableKeys(BLOG_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({
    required: ['title'],
    optional: ['excerpt', 'body'],
  }),
});

export type BlogPostFormValues = z.infer<typeof blogPostFormSchema>;
