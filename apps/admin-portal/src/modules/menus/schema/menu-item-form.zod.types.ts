import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/** Translatable menu-item fields (edited per-locale under LocaleTabs, W6). */
export const MENU_ITEM_TRANSLATABLE_KEYS = ['label'] as const;

/** Optional fields whose empty form value ('') becomes `null` in the request body. */
export const MENU_ITEM_NULLABLE_KEYS = ['icon'] as const;

/**
 * The menu-item DynamicForm shape (U16) — `url` (a route or external link) + an optional `icon`
 * key, plus the translatable `label` under a `translations` map. `parentId` is set by the
 * editor (add-child context), not a form field; ordering is owned by drag-reorder (U21).
 */
export const menuItemFormSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  icon: z.string().trim().max(64),
  ...phantomTranslatableKeys(MENU_ITEM_TRANSLATABLE_KEYS),
  translations: localizedFormSchema({ required: ['label'] }),
});

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;
