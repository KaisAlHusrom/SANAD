import type { MediaFolderNode } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import {
  collectDescendantIds,
  countFolders,
  findFolderNode,
  findFolderPath,
} from './explorer-tree';

/** A node builder — only the fields the explorer actually reads matter to these tests. */
function node(
  id: string,
  name: string,
  children: MediaFolderNode[] = [],
  assetCount = 0,
): MediaFolderNode {
  return {
    id,
    name,
    parentId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    assetCount,
    children,
  };
}

const logos = node('logos', 'Logos');
const colors = node('colors', 'Colors', [node('dark', 'Dark')]);
const brand = node('brand', 'Brand', [colors, logos]);
const clients = node('clients', 'Clients');
const roots = [brand, clients];

describe('findFolderPath — the breadcrumb, derived from the tree (no extra request)', () => {
  it('returns the chain from the root down to the folder', () => {
    expect(findFolderPath(roots, 'dark').map((item) => item.id)).toEqual([
      'brand',
      'colors',
      'dark',
    ]);
  });

  it('returns a single crumb for a top-level folder', () => {
    expect(findFolderPath(roots, 'clients').map((item) => item.id)).toEqual([
      'clients',
    ]);
  });

  it('returns nothing for the root itself, and for a folder that is gone', () => {
    expect(findFolderPath(roots, null)).toEqual([]);
    // Deleted in another tab: the crumb bar falls back to the root rather than throwing.
    expect(findFolderPath(roots, 'ghost')).toEqual([]);
  });
});

describe('findFolderNode', () => {
  it('finds a deeply nested node', () => {
    expect(findFolderNode(roots, 'dark')?.name).toBe('Dark');
  });

  it('is null for the root and for an unknown id', () => {
    expect(findFolderNode(roots, null)).toBeNull();
    expect(findFolderNode(roots, 'ghost')).toBeNull();
  });
});

describe('collectDescendantIds — the guard behind "a folder cannot move into itself"', () => {
  it('includes the folder and every level beneath it', () => {
    expect(collectDescendantIds(brand).sort()).toEqual(
      ['brand', 'colors', 'dark', 'logos'].sort(),
    );
  });

  it('is just the folder itself when it has no children', () => {
    expect(collectDescendantIds(logos)).toEqual(['logos']);
  });
});

describe('countFolders — the "N folders" the empty/summary states need', () => {
  it('counts every node at every depth', () => {
    expect(countFolders(roots)).toBe(5);
  });

  it('is zero for a library with no folders at all', () => {
    expect(countFolders([])).toBe(0);
  });
});
