import type { BrandingRecord } from '@sanad/contracts';
import type { ResolvedValue } from './resolved-value.js';

/** A leaf in the branding tree — exactly a resolved value (scalar / localized / null). */
export type BrandingLeaf = ResolvedValue;

/** A generic view of the branding record for path-addressed get/set. */
export type BrandingTree = { [key: string]: BrandingTree | BrandingLeaf };

/**
 * Bridge a precisely-typed `BrandingRecord` to its generic tree view (and back). The
 * two describe the SAME data; only the index-signature gap needs an explicit cast —
 * the repo's accepted idiom (also used for typed test mocks). Returns the same object
 * reference, so mutating the tree mutates the record.
 */
export function asTree(record: BrandingRecord): BrandingTree {
  return record as unknown as BrandingTree;
}

/** Read the leaf at a dotted path; `null` when any segment is missing. */
export function getAtPath(
  tree: BrandingTree,
  path: readonly string[],
): BrandingLeaf {
  let node: BrandingTree | BrandingLeaf = tree;
  for (const key of path) {
    if (node === null || typeof node !== 'object') {
      return null;
    }
    // A localized leaf is also an object; paths only navigate real subtrees, so a
    // narrowing cast to the tree node is safe (no `any`/`unknown`).
    node = (node as BrandingTree)[key] ?? null;
  }
  return node as BrandingLeaf;
}

/** Set the leaf at a dotted path, creating intermediate objects as needed. */
export function setAtPath(
  tree: BrandingTree,
  path: readonly string[],
  value: BrandingLeaf,
): void {
  let node: BrandingTree = tree;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (key === undefined) {
      return;
    }
    const next = node[key];
    if (next === null || next === undefined || typeof next !== 'object') {
      const created: BrandingTree = {};
      node[key] = created;
      node = created;
    } else {
      node = next as BrandingTree;
    }
  }
  const last = path[path.length - 1];
  if (last !== undefined) {
    node[last] = value;
  }
}
