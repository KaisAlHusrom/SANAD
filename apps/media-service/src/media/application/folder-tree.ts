import type {
  MediaFolder,
  MediaFolderNode,
  MediaFolderTree,
} from '@sanad/contracts';

/**
 * The PURE folder-tree logic — assembling the nesting, and the guard that keeps it a tree.
 * No repository, no Nest, fully unit-tested (TDD1); the service does the I/O and calls in here.
 */

/**
 * Flat rows → the nested tree the explorer renders, in ONE pass over the folders plus a lookup
 * of per-folder asset counts (so the pane needs one request, not one per node).
 *
 * Siblings are sorted by name so the tree does not reshuffle between requests, and a folder
 * whose parent is missing (deleted concurrently) is **rescued to the root** rather than dropped:
 * silently losing a folder from the UI reads as data loss (U23).
 */
export function buildFolderTree(
  folders: readonly MediaFolder[],
  assetCounts: ReadonlyMap<string, number>,
  rootAssetCount: number,
): MediaFolderTree {
  const nodes = new Map<string, MediaFolderNode>(
    folders.map((folder) => [
      folder.id,
      { ...folder, assetCount: assetCounts.get(folder.id) ?? 0, children: [] },
    ]),
  );

  const roots: MediaFolderNode[] = [];
  for (const folder of folders) {
    const node = nodes.get(folder.id);
    if (!node) continue;
    const parent = folder.parentId ? nodes.get(folder.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  sortByName(roots);
  for (const node of nodes.values()) {
    sortByName(node.children);
  }

  return { roots, rootAssetCount };
}

function sortByName(nodes: MediaFolderNode[]): void {
  nodes.sort((a, b) => a.name.localeCompare(b.name));
}

/** Every folder below `folderId`, exclusive of it. Iterative — a corrupt cycle can't hang it. */
export function collectDescendantIds(
  folders: readonly MediaFolder[],
  folderId: string,
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const siblings = childrenByParent.get(folder.parentId) ?? [];
    siblings.push(folder.id);
    childrenByParent.set(folder.parentId, siblings);
  }

  const descendants = new Set<string>();
  const queue = [...(childrenByParent.get(folderId) ?? [])];
  while (queue.length > 0) {
    const current = queue.pop();
    if (current === undefined || descendants.has(current)) continue;
    descendants.add(current);
    queue.push(...(childrenByParent.get(current) ?? []));
  }
  return descendants;
}

/**
 * Would moving `folderId` under `nextParentId` detach a subtree into a loop? Dropping a folder
 * onto itself or onto one of its own descendants is the classic file-explorer trap — the rows
 * survive but become unreachable from any root, so the folders simply vanish from the UI.
 * Refused up front, with an explanation, rather than written and discovered later.
 */
export function wouldCreateCycle(
  folders: readonly MediaFolder[],
  folderId: string,
  nextParentId: string | null,
): boolean {
  if (nextParentId === null) return false; // the root is always a safe destination
  if (nextParentId === folderId) return true;
  return collectDescendantIds(folders, folderId).has(nextParentId);
}
