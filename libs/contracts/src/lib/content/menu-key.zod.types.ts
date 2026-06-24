import { z } from 'zod';

/**
 * A navigation menu's stable machine key (NOT a user slug): `primary` (header nav) or
 * `footer`. A fixed enum so the website can't request a typo'd key and the admin picks from a
 * known set. Mirrors the `menu_key` Postgres enum (U3).
 */
export const menuKeySchema = z.enum(['primary', 'footer']);

export type MenuKey = z.infer<typeof menuKeySchema>;

/** Address a menu by its key (the public `getByKey` payload). Strict (N7). `.zod.types` (U16). */
export const menuKeyParamSchema = z
  .object({
    key: menuKeySchema,
  })
  .strict();

export type MenuKeyParam = z.infer<typeof menuKeyParamSchema>;
