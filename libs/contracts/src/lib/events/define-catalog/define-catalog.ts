import type { EventDefinition } from '../event-definition.types.js';

/**
 * Freeze a catalog literal into its own type while PROVING two of U27's laws at compile time:
 * (1) every key is exactly its entry's `name` — the constraint demands `{ name: K }` for the
 *     value at key `K`, so a mis-keyed entry does not compile (U3);
 * (2) a duplicate event name is a duplicate object key, which TypeScript rejects outright
 *     (TS1117) — "declared twice" is unrepresentable, not merely tested.
 * At runtime this is the identity function; it exists purely to carry the constraint.
 */
export function defineCatalog<
  const TCatalog extends Record<string, EventDefinition> & {
    readonly [TName in keyof TCatalog & string]: { readonly name: TName };
  },
>(catalog: TCatalog): TCatalog {
  return catalog;
}
