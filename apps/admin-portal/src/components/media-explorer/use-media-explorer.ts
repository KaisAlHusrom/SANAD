import {
  MEDIA_ROOT_FOLDER,
  type MediaAsset,
  type MediaFolderNode,
  type MediaListQuery,
  type PaginationMeta,
} from '@sanad/contracts';
import { useCallback, useEffect, useMemo } from 'react';
import { useRequirePermission } from '../../app/guards/use-require-permission';
import { useConfirm } from '../../data/confirm/use-confirm';
import { useEventBus } from '../../data/events/use-event-bus';
import { useGetFolderTreeQuery } from '../../data/lookups/folder-lookup.api';
import { useSearchMediaLookupQuery } from '../../data/lookups/media-lookup.api';
import { useDeleteAssetMutation } from '../../data/media-manage.api';
import { toast } from '../../data/toast/use-toast';
import { useBulkSelection } from '../data-table/use-bulk-selection';
import { findFolderNode, findFolderPath } from './explorer-tree';
import type { SelectModifiers } from './select-modifiers';
import {
  EXPLORER_PAGE_SIZE,
  EXPLORER_SORT_FIELD,
} from './media-explorer.constants';
import {
  useExplorerNavState,
  type ExplorerMode,
  type ExplorerNavState,
} from './use-explorer-nav-state';
import {
  useExplorerMove,
  type UseExplorerMoveResult,
} from './use-explorer-move';
import {
  useFolderActions,
  type UseFolderActionsResult,
} from './use-folder-actions';
import { useUploadQueue, type UseUploadQueueResult } from './use-upload-queue';
import { useTranslation } from 'react-i18next';

/**
 * Which "nothing to show" this is. Three different situations that a single "No files" would
 * flatten into one unhelpful sentence (U23): a library nobody has uploaded to yet, a folder that
 * happens to be empty, and a search that matched nothing. Each needs its own next action.
 */
export type ExplorerEmptyKind = 'library' | 'folder' | 'search' | null;

/** How clicking an item behaves — a picker resolves to ONE asset. */
export type ExplorerSelectionMode = 'single' | 'multi';

export interface UseMediaExplorerResult {
  canBrowse: boolean;
  canManage: boolean;
  nav: ExplorerNavState;
  /** The folders shown in the tree. */
  roots: MediaFolderNode[];
  rootAssetCount: number;
  isTreeLoading: boolean;
  isTreeError: boolean;
  refetchTree: () => void;
  /** Root → … → current folder. Empty at the root. */
  path: MediaFolderNode[];
  /** The subfolders of the open folder — shown as tiles alongside the files. */
  childFolders: MediaFolderNode[];
  assets: MediaAsset[];
  meta: PaginationMeta | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** The 503 that means R2 was never configured — a different message and a different fix. */
  isStorageUnconfigured: boolean;
  emptyKind: ExplorerEmptyKind;
  refetch: () => void;
  /** The exact query on screen — the cache entry an optimistic move patches. */
  query: MediaListQuery;
  selection: {
    ids: string[];
    count: number;
    isSelected: (id: string) => boolean;
    select: (id: string, modifiers?: SelectModifiers) => void;
    clear: () => void;
  };
  /** True while `search` is non-empty — the list then spans the WHOLE library, not this folder. */
  isSearching: boolean;
  folders: UseFolderActionsResult;
  move: UseExplorerMoveResult;
  uploads: UseUploadQueueResult;
  /** Upload the given files into the folder currently open. */
  uploadHere: (files: FileList | File[]) => void;
  /** Delete the given files, after one confirmation for the whole set (a right-click "Delete"). */
  deleteAssets: (ids: string[]) => Promise<void>;
  /** Delete the selected files, after one confirmation for the whole selection. */
  deleteSelected: () => Promise<void>;
}

interface UseMediaExplorerArgs {
  mode: ExplorerMode;
  selectionMode?: ExplorerSelectionMode;
  /** Restrict the whole surface to one MIME family (an image field's picker passes `image`). */
  typeLock?: string;
  /** False while a picker modal is closed — nothing is fetched until it opens (F5). */
  enabled?: boolean;
}

/**
 * THE media explorer engine (U5) — everything the file-explorer UI knows, in one hook, shared by
 * the Media page and the picker modal so the two can never drift apart.
 *
 * Two behaviours are worth stating outright:
 *
 * **The root is a place.** `folderId === null` lists the assets that are in NO folder
 * (`folderId=root` on the wire), exactly as a file manager's top level does — not "everything,
 * everywhere", which would make opening a folder look like it lost files.
 *
 * **Search leaves the folder.** A search term drops `folderId` entirely and looks through the
 * whole library, because someone searching for a file has stopped caring where they filed it. The
 * UI says so plainly while a term is active, so the change of scope is never a surprise.
 */
export function useMediaExplorer({
  mode,
  selectionMode = 'multi',
  typeLock,
  enabled = true,
}: UseMediaExplorerArgs): UseMediaExplorerResult {
  const { t } = useTranslation('mediaExplorer');
  const canBrowse = useRequirePermission('media.read');
  const canManage = useRequirePermission('media.manage');
  const active = enabled && canBrowse;
  const { confirm } = useConfirm();
  const [deleteAsset] = useDeleteAssetMutation();

  const nav = useExplorerNavState(mode);
  const isSearching = nav.search.trim().length > 0;

  const {
    data: tree,
    isLoading: isTreeLoading,
    isError: isTreeError,
    refetch: refetchTree,
  } = useGetFolderTreeQuery(undefined, { skip: !active });

  const roots = useMemo(() => tree?.roots ?? [], [tree]);

  const query = useMemo<MediaListQuery>(
    () => ({
      page: nav.page,
      pageSize: EXPLORER_PAGE_SIZE,
      sort: EXPLORER_SORT_FIELD,
      order: 'desc',
      ...(isSearching
        ? { search: nav.search.trim() }
        : { folderId: nav.folderId ?? MEDIA_ROOT_FOLDER }),
      ...((typeLock ?? nav.type) ? { type: typeLock ?? nav.type } : {}),
    }),
    [isSearching, nav.folderId, nav.page, nav.search, nav.type, typeLock],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useSearchMediaLookupQuery(query, { skip: !active });

  const isStorageUnconfigured = Boolean(
    error && 'status' in error && error.status === 503,
  );

  // The list, the tree and the write bridge all live in different reducerPaths, so a tag can't
  // reach across them — the client event bus is what keeps them in step (W4).
  const refreshAll = useCallback(() => {
    if (!active) return;
    void refetch();
    void refetchTree();
  }, [active, refetch, refetchTree]);
  useEventBus('media.asset.uploaded', refreshAll);
  useEventBus('media.asset.deleted', refreshAll);
  useEventBus('media.assets.moved', refreshAll);
  useEventBus('media.folder.created', refreshAll);
  useEventBus('media.folder.changed', refreshAll);

  const move = useExplorerMove();
  // Files being dragged elsewhere leave THIS folder immediately — a drop that visibly does
  // nothing for a round-trip reads as a drop that failed. If the move fails they reappear.
  const assets = useMemo(
    () =>
      (data?.items ?? []).filter((item) => !move.movingIds.includes(item.id)),
    [data, move.movingIds],
  );
  const selection = useBulkSelection(assets, (asset) => asset.id);

  // A selection is only meaningful against what is on screen: changing folder, page or search
  // silently keeps ids the user can no longer see, and a following "Delete" would surprise them.
  const { clear } = selection;
  useEffect(() => {
    clear();
  }, [clear, nav.folderId, nav.page, nav.search, nav.type]);

  const path = useMemo(
    () => findFolderPath(roots, nav.folderId),
    [roots, nav.folderId],
  );
  const childFolders = useMemo(() => {
    if (!nav.folderId) return roots;
    return findFolderNode(roots, nav.folderId)?.children ?? [];
  }, [roots, nav.folderId]);

  // A folder that vanished (deleted here or in another tab) must not leave the user staring at a
  // permanently empty view with a breadcrumb to nowhere — fall back to the root.
  const { openFolder } = nav;
  useEffect(() => {
    if (!nav.folderId || isTreeLoading || !tree) return;
    if (!findFolderNode(roots, nav.folderId)) openFolder(null);
  }, [isTreeLoading, nav.folderId, openFolder, roots, tree]);

  const uploads = useUploadQueue({ onUploaded: refreshAll });
  const folders = useFolderActions();

  const uploadHere = useCallback(
    (files: FileList | File[]) => uploads.enqueue(files, nav.folderId),
    [nav.folderId, uploads],
  );

  const selectedIds = selection.selectedIds;
  const { clear: clearSelection } = selection;
  const deleteAssets = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await confirm({
        title: t('asset.deleteTitle'),
        message: t('asset.deleteDescription'),
        variant: 'danger',
        confirmLabel: t('asset.delete'),
        onConfirm: async () => {
          // Sequential: the gateway sees one delete at a time, and a mid-way failure leaves a
          // truthful partial state rather than an unknown one.
          for (const id of ids) {
            await deleteAsset(id).unwrap();
          }
          toast.success(t('asset.deleted'));
          clearSelection();
        },
      });
    },
    [confirm, deleteAsset, clearSelection, t],
  );
  const deleteSelected = useCallback(
    () => deleteAssets(selectedIds),
    [deleteAssets, selectedIds],
  );

  const select = useCallback(
    (id: string, modifiers: SelectModifiers = {}) => {
      if (selectionMode === 'single') {
        selection.selectOnly(id);
        return;
      }
      if (modifiers.range) {
        selection.selectRange(id);
        return;
      }
      if (modifiers.additive) {
        selection.toggle(id);
        return;
      }
      selection.selectOnly(id);
    },
    [selection, selectionMode],
  );

  const isEmpty = assets.length === 0 && childFolders.length === 0;
  const emptyKind: ExplorerEmptyKind = !isEmpty
    ? null
    : isSearching
      ? 'search'
      : // Nothing anywhere — no folders at all and nothing at the root — is a first-use library,
        // which asks for "upload your first file", not "this folder is empty".
        roots.length === 0 && !nav.folderId && (tree?.rootAssetCount ?? 0) === 0
        ? 'library'
        : 'folder';

  return {
    canBrowse,
    canManage,
    nav,
    roots,
    rootAssetCount: tree?.rootAssetCount ?? 0,
    isTreeLoading,
    isTreeError,
    refetchTree: () => void refetchTree(),
    path,
    childFolders,
    assets,
    meta: data?.meta,
    isLoading,
    isFetching,
    isError,
    isStorageUnconfigured,
    emptyKind,
    refetch: refreshAll,
    query,
    selection: {
      ids: selection.selectedIds,
      count: selection.count,
      isSelected: selection.isSelected,
      select,
      clear: selection.clear,
    },
    isSearching,
    folders,
    move,
    uploads,
    uploadHere,
    deleteAssets,
    deleteSelected,
  };
}
