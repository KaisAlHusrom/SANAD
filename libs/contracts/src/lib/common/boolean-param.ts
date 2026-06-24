import { z } from 'zod';

/**
 * A boolean list-query parameter. Query strings are text, so a boolean filter arrives as the
 * literal `'true'`/`'false'` — parsed with a strict transform, NEVER `z.coerce.boolean()`
 * (which treats every non-empty string, including `'false'`, as `true` — N7). Use as an
 * optional filter inside a `.strict()` list query.
 */
export const booleanParamSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export type BooleanParam = z.infer<typeof booleanParamSchema>;
