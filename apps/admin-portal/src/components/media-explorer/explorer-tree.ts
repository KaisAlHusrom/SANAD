import type { MediaFolderNode } from '@sanad/contracts';

/**
 * Pure reads over the folder tree the gateway already sent (U10 — one concept, no React).
 *
 * Everything the explorer needs to know about *where it is* — the breadcrumb chain, the current
 * node, what lies beneath a folder — is derivable from that single response, so none of it costs
 * a request. Keeping the maths here (and unit-tested) also means the drag guard and the backend's
 * cycle guard can agree without the UI having to try a move to find out it was illegal.
 */

/**
 * The chain of folders from a top-level ancestor down to `folderId`, inclusive — the breadcrumb.
 *
 * Empty for the root (`null`) and, deliberately, for an id that is no longer in the tree: a folder
 * deleted in another tab must land the user back at the root, not crash the crumb bar (U23).
 */
export function findFolderPath(
  roots: MediaFolderNode[],
  folderId: string | null,
): MediaFolderNode[] {
  if (!folderId) return [];

  for (const root of roots) {
    const path = pathFrom(root, folderId);
    if (path) return path;
  }
  return [];
}

function pathFrom(
  node: MediaFolderNode,
  folderId: string,
): MediaFolderNode[] | null {
  if (node.id === folderId) return [node];
  for (const child of node.children) {
    const below = pathFrom(child, folderId);
    if (below) return [node, ...below];
  }
  return null;
}

/** The node for `folderId`, or null for the root / an id that has gone. */
export function findFolderNode(
  roots: MediaFolderNode[],
  folderId: string | null,
): MediaFolderNode | null {
  const path = findFolderPath(roots, folderId);
  return path.length > 0 ? (path[path.length - 1] ?? null) : null;
}

/** A folder's id plus every id beneath it — the set a folder may never be dropped into. */
export function collectDescendantIds(node: MediaFolderNode): string[] {
  return [node.id, ...node.children.flatMap(collectDescendantIds)];
}

/** How many folders exist in total, at any depth. */
export function countFolders(roots: MediaFolderNode[]): number {
  return roots.reduce(
    (total, node) => total + countFolders(node.children),
    roots.length,
  );
}
