import { slugSchema } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable team-member fields (edited per-locale under LocaleTabs, W6). */
export const TEAM_TRANSLATABLE_KEYS = ['name', 'role', 'bio'] as const;

/** Optional fields whose empty form value ('') becomes `null` in the upsert body. */
export const TEAM_NULLABLE_KEYS = [
  'avatarMediaId',
  'email',
  'linkedinUrl',
  'githubUrl',
] as const;

/**
 * The team-member DynamicForm shape (U16). `slug` is the unique key; `email`/`linkedinUrl`/
 * `githubUrl` are '' (none) or validated; the translatable `name`/`role`/`bio` live under
 * `translations` (the `localized-form` helpers pivot to the contract `{ar,en}`).
 */
export const teamMemberFormSchema = z.object({
  slug: slugSchema,
  email: z.union([z.literal(''), z.string().trim().email().max(254)]),
  linkedinUrl: z.union([z.literal(''), z.string().trim().url().max(2048)]),
  githubUrl: z.union([z.literal(''), z.string().trim().url().max(2048)]),
  featured: z.boolean(),
  avatarMediaId: z.union([z.literal(''), z.string().uuid()]),
  ...phantomTranslatableKeys(TEAM_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({
    required: ['name', 'role'],
    optional: ['bio'],
  }),
});

export type TeamMemberFormValues = z.infer<typeof teamMemberFormSchema>;
