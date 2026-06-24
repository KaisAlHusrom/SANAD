import { z } from 'zod';
import { menuKeySchema } from './menu-key.zod.types.js';

/**
 * Create a navigation menu (admin, `content.manage`). A menu is a keyed container with no
 * translatable copy of its own (its items carry the labels). `key` is unique. Strict (N7);
 * `.zod.types` (U16).
 */
export const menuCreateSchema = z
  .object({
    key: menuKeySchema,
    sortOrder: z.number().int().min(0).default(0),
  })
  .strict();

export type MenuCreateRequest = z.infer<typeof menuCreateSchema>;
