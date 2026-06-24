import type { BrandingRecord } from '@sanad/contracts';
import { BRANDING_DEFAULTS, BRANDING_FIELDS } from './branding-catalog.js';
import { asTree, setAtPath } from './branding-tree.js';
import type { ResolvedValue } from './resolved-value.js';

/**
 * Build a complete `BrandingRecord` from a sparse map of resolved values, deep-merged
 * over the coded defaults. Starts from a clone of `BRANDING_DEFAULTS`, so every leaf is
 * ALWAYS present (F7) — only keys with a resolved value override their default.
 */
export function assembleBranding(
  resolved: Readonly<Record<string, ResolvedValue>>,
): BrandingRecord {
  const record = structuredClone(BRANDING_DEFAULTS);
  const tree = asTree(record);
  for (const field of BRANDING_FIELDS) {
    const value = resolved[field.key];
    if (value !== undefined) {
      setAtPath(tree, field.path, value);
    }
  }
  return record;
}
