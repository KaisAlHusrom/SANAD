import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';

/**
 * Create a menu item (admin, `content.manage`). Belongs to a `menuId`; `parentId` nests it one
 * level under another item (footer columns / dropdowns). `url` is required (a route or external
 * link); the translatable `label` is supplied in BOTH locales. Strict (N7); `.zod.types` (U16).
 */
export const menuItemCreateSchema = z
  .object({
    menuId: z.string().uuid(),
    parentId: z.string().uuid().nullable().optional(),
    url: z.string().trim().min(1).max(2048),
    icon: z.string().trim().min(1).max(64).nullable().optional(),
    sortOrder: z.number().int().min(0).default(0),
    label: localizedTextSchema,
  })
  .strict();

export type MenuItemCreateRequest = z.infer<typeof menuItemCreateSchema>;

/**
 * Update a menu item by id (admin). All fields optional (partial); `label`, when present,
 * carries both locales. Strict (N7).
 */
export const menuItemUpdateSchema = z
  .object({
    id: z.string().uuid(),
    parentId: z.string().uuid().nullable().optional(),
    url: z.string().trim().min(1).max(2048).optional(),
    icon: z.string().trim().min(1).max(64).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    label: localizedTextSchema.optional(),
  })
  .strict();

export type MenuItemUpdateRequest = z.infer<typeof menuItemUpdateSchema>;
