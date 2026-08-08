import { z } from 'zod';

/**
 * A boolean list-query parameter. Query strings are text, so a boolean filter arrives as the
 * literal `'true'`/`'false'` — parsed with a strict transform, NEVER `z.coerce.boolean()`
 * (which treats every non-empty string, including `'false'`, as `true` — N7). Use as an
 * optional filter inside a `.strict()` list query.
 *
 * **Idempotent (MS4):** the gateway validates a query (transforming `'true'` → `true`) and
 * then forwards the transformed object to the service, which re-validates with the SAME
 * schema. So the union also accepts an already-parsed boolean — a plain
 * `z.enum(['true','false'])` would reject the boolean on that second pass.
 */
export const booleanParamSchema = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

export type BooleanParam = z.infer<typeof booleanParamSchema>;
