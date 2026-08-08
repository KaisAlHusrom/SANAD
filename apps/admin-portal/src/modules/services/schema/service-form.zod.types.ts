import { serviceCategorySchema, slugSchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable service fields (edited per-locale under LocaleTabs, W6). */
export const SERVICE_TRANSLATABLE_KEYS = [
  'title',
  'summary',
  'detailBody',
] as const;

/** Optional fields whose empty form value ('') becomes `null` in the upsert body. */
export const SERVICE_NULLABLE_KEYS = ['iconKey', 'coverMediaId'] as const;

/**
 * The services DynamicForm shape (U16) — the form's translatable fields live under a
 * `translations` map (kit convention) while the contract carries them as top-level
 * `{ar,en}` (the `localized-form` helpers pivot between the two). Numbers are coerced
 * (native inputs register as strings); `coverMediaId` is '' or a media uuid. Distinct from
 * the contract `serviceCreateSchema` only in the translatable nesting + number coercion.
 */
export const serviceFormSchema = z.object({
  slug: slugSchema,
  category: serviceCategorySchema,
  iconKey: z.string().trim().max(64),
  coverMediaId: z.union([z.literal(''), z.string().uuid()]),
  ...phantomTranslatableKeys(SERVICE_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({
    required: ['title'],
    optional: ['summary', 'detailBody'],
  }),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
