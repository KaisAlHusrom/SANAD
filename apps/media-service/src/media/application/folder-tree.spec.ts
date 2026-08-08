import type { MediaFolder } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildFolderTree,
  collectDescendantIds,
  wouldCreateCycle,
} from './folder-tree.js';

function folder(
  id: string,
  name: string,
  parentId: string | null,
): MediaFolder {
  return {
    id,
    name,
    parentId,
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-20T00:00:00.000Z',
  };
}

/*
 *  brand ─┬─ logos
 *         └─ colors
 *  projects (root, no children)
 */
const FLAT: MediaFolder[] = [
  folder('brand', 'Brand', null),
  folder('logos', 'Logos', 'brand'),
  folder('colors', 'Colors', 'brand'),
  folder('projects', 'Projects', null),
];

describe('buildFolderTree', () => {
  it('nests children under their parent and keeps roots at the top', () => {
    const tree = buildFolderTree(FLAT, new Map(), 0);

    expect(tree.roots.map((node) => node.id)).toEqual(['brand', 'projects']);
    // siblings come back name-sorted (Colors before Logos), not in insertion order
    expect(tree.roots[0]?.children.map((node) => node.id)).toEqual([
      'colors',
      'logos',
    ]);
    expect(tree.roots[1]?.children).toEqual([]);
  });

  it('attaches each folder its OWN asset count, defaulting to zero', () => {
    const counts = new Map([
      ['brand', 3],
      ['logos', 7],
    ]);
    const tree = buildFolderTree(FLAT, counts, 5);

    expect(tree.rootAssetCount).toBe(5);
    expect(tree.roots[0]?.assetCount).toBe(3);
    // children are name-sorted: [0] = Colors (uncounted), [1] = Logos (7)
    expect(tree.roots[0]?.children[1]?.assetCount).toBe(7);
    // a folder nobody counted is 0, never undefined
    expect(tree.roots[0]?.children[0]?.assetCount).toBe(0);
  });

  it('sorts siblings by name so the tree does not reshuffle between requests', () => {
    const tree = buildFolderTree(
      [
        folder('b', 'Beta', null),
        folder('a', 'Alpha', null),
        folder('c', 'Gamma', null),
      ],
      new Map(),
      0,
    );
    expect(tree.roots.map((node) => node.name)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ]);
  });

  it('rescues an orphan (parent missing/deleted) to the root instead of dropping it', () => {
    // Losing a folder from the UI because its parent vanished would look like data loss (U23).
    const tree = buildFolderTree([folder('x', 'Orphan', 'gone')], new Map(), 0);
    expect(tree.roots.map((node) => node.id)).toEqual(['x']);
  });

  it('handles an empty library', () => {
    expect(buildFolderTree([], new Map(), 0)).toEqual({
      roots: [],
      rootAssetCount: 0,
    });
  });
});

describe('collectDescendantIds', () => {
  it('returns the whole subtree below a folder, excluding the folder itself', () => {
    expect([...collectDescendantIds(FLAT, 'brand')].sort()).toEqual([
      'colors',
      'logos',
    ]);
  });

  it('returns nothing for a leaf', () => {
    expect([...collectDescendantIds(FLAT, 'logos')]).toEqual([]);
  });
});

describe('wouldCreateCycle', () => {
  it('rejects moving a folder into itself', () => {
    expect(wouldCreateCycle(FLAT, 'brand', 'brand')).toBe(true);
  });

  it('rejects moving a folder into its own descendant (the classic explorer trap)', () => {
    expect(wouldCreateCycle(FLAT, 'brand', 'logos')).toBe(true);
  });

  it('allows any move that does not close a loop', () => {
    expect(wouldCreateCycle(FLAT, 'logos', 'projects')).toBe(false);
    expect(wouldCreateCycle(FLAT, 'brand', null)).toBe(false);
    expect(wouldCreateCycle(FLAT, 'logos', null)).toBe(false);
  });
});
