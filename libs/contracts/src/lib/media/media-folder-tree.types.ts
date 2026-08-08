import type { MediaFolder } from './media-folder.types.js';

/**
 * One node of the media folder tree — a folder plus what the explorer needs to render it
 * WITHOUT a request per node: how many assets it holds directly, and its children.
 *
 * `assetCount` is direct (not recursive) on purpose: an explorer shows "what is in this folder",
 * and a recursive roll-up would make a parent look full when opening it shows nothing.
 */
export interface MediaFolderNode extends MediaFolder {
  assetCount: number;
  children: MediaFolderNode[];
}

/**
 * The whole tree, plus the count of assets sitting at the ROOT (no folder) — which is a real
 * place in the explorer ("All files") and would otherwise have no node to carry its count.
 */
export interface MediaFolderTree {
  roots: MediaFolderNode[];
  rootAssetCount: number;
}
