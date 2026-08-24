import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { MediaAsset } from '@sanad/contracts';
import { Files, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { downloadFile } from '../../lib/download-file';
import { formatBytes } from '../../lib/format/bytes';
import { useDirection } from '../../providers/direction/use-direction';
import { EmptyState } from '../feedback/empty-state';
import { ErrorState } from '../feedback/error-state';
import { RenderGate } from '../feedback/render-gate';
import { Skeleton } from '../feedback/skeleton';
import { Button } from '../ui/button';
import { AssetGridView } from './asset-grid-view';
import { AssetListView } from './asset-list-view';
import { AssetPreview } from './asset-preview';
import { ExplorerBreadcrumbs } from './explorer-breadcrumbs';
import { findFolderNode } from './explorer-tree';
import type { SelectModifiers } from './select-modifiers';
import { ExplorerToolbar } from './explorer-toolbar';
import { FolderTree } from './folder-tree';
import {
  EXPLORER_GRID_COLUMNS,
  EXPLORER_GRID_SKELETON_TILES,
} from './media-explorer.constants';
import { SelectionBar } from './selection-bar';
import { UploadTray } from './upload-tray';
import { useExplorerDnd } from './use-explorer-dnd';
import {
  useMediaExplorer,
  type ExplorerSelectionMode,
} from './use-media-explorer';
import type { ExplorerMode } from './use-explorer-nav-state';

interface MediaExplorerProps {
  mode: ExplorerMode;
  selectionMode?: ExplorerSelectionMode;
  /** Restrict to one MIME family — an image field's picker passes `image`. */
  typeLock?: string;
  /** False while a picker modal is closed: nothing is fetched until it opens (F5). */
  enabled?: boolean;
  /**
   * The picker's "take this one" — wired to the preview's "Use this image" button and to a
   * double-click. Its presence also tells the explorer it is running as a picker (the preview
   * then offers a choose action instead of a delete one).
   */
  onActivate?: (asset: MediaAsset) => void;
  className?: string;
}

/**
 * THE media explorer — a two-pane file manager for the library: folders on the inline-start side,
 * their contents beside them, and drag-and-drop between the two. One component serves both the
 * Media page and the picker modal that any form opens, so the two can never diverge (F9).
 *
 * It carries the drop target for the OS as well: dragging files in from Finder/Explorer is a
 * NATIVE browser event that dnd-kit cannot see, so the content pane handles `dragover`/`drop`
 * itself. The two mechanisms coexist because dnd-kit only claims pointer events on its own
 * draggables.
 */
export function MediaExplorer({
  mode,
  selectionMode = 'multi',
  typeLock,
  enabled = true,
  onActivate,
  className,
}: MediaExplorerProps) {
  const { t } = useTranslation('mediaExplorer');
  const { t: tCommon } = useTranslation('common');
  const { locale } = useDirection();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileOver, setFileOver] = useState(false);
  /** Which parent a new folder is being created under; `undefined` = the form is closed. */
  const [createParentId, setCreateParentId] = useState<
    string | null | undefined
  >(undefined);

  const explorer = useMediaExplorer({ mode, selectionMode, typeLock, enabled });
  const { nav, selection, assets } = explorer;

  const dnd = useExplorerDnd({
    roots: explorer.roots,
    selectedIds: selection.ids,
    currentFolderId: nav.folderId,
    onMoveAssets: (ids, folderId) => {
      void explorer.move
        .moveAssets(ids, folderId)
        .then(() => selection.clear());
    },
    onMoveFolder: (id, parentId) => {
      void explorer.move.moveFolder(id, parentId);
    },
    enabled: explorer.canManage,
  });

  const onFilesChosen = (event: ChangeEvent<HTMLInputElement>) => {
    // `event.target.files` is a LIVE FileList bound to the input — clearing `value` to allow
    // re-picking the same file empties that very list. So snapshot to a real array FIRST, then
    // clear. Reading length after the clear was always 0 → the upload silently never started
    // (owner: "nothing happened, no request sent", 2026-07-25).
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length > 0) explorer.uploadHere(files);
  };

  const onNativeDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setFileOver(false);
    if (!explorer.canManage) return;
    const files = event.dataTransfer.files;
    if (files && files.length > 0) explorer.uploadHere(files);
  };

  // The file open in the full-screen preview. Tracked by id, not object, so a background refetch
  // that returns a new array (same file) doesn't blink the lightbox shut.
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewIndex = assets.findIndex((asset) => asset.id === previewId);
  const previewAsset =
    previewIndex >= 0 ? (assets[previewIndex] ?? null) : null;

  // A plain click OPENS the file; a modifier click SELECTS it for a bulk action (owner, 2026-07-25).
  const onAssetClick = (asset: MediaAsset, modifiers: SelectModifiers) => {
    if (modifiers.additive || modifiers.range)
      selection.select(asset.id, modifiers);
    else setPreviewId(asset.id);
  };

  const onDownload = (asset: MediaAsset) =>
    downloadFile(asset.url, asset.filename);

  // A right-click "Delete" on a file that is part of a multi-selection deletes the whole
  // selection (as a file manager does); on an unselected file, just that one.
  const onDeleteAsset = (asset: MediaAsset) => {
    const ids =
      selection.isSelected(asset.id) && selection.count > 1
        ? selection.ids
        : [asset.id];
    void explorer.deleteAssets(ids);
  };

  const onDeleteFromPreview = (asset: MediaAsset) => {
    setPreviewId(null);
    void explorer.deleteAssets([asset.id]);
  };

  // The grid and list share these — folders and files behave identically in both views (F9).
  const surfaceProps = {
    onAssetClick,
    onActivate,
    onPreview: (asset: MediaAsset) => setPreviewId(asset.id),
    onDownload,
    onDeleteAsset,
    onOpenFolder: nav.openFolder,
    onNewSubfolder: (parentId: string) => setCreateParentId(parentId),
    folderActions: explorer.folders,
    canManage: explorer.canManage,
    isValidDropTarget: dnd.isValidTarget,
  };

  // Someone without `media.read` sees nothing at all — there is no partial library to show.
  if (!explorer.canBrowse) {
    return (
      <EmptyState title={t('errors.forbidden')} description={t('readOnly')} />
    );
  }

  const totalPages = explorer.meta?.totalPages ?? 1;
  const totalFiles = explorer.meta?.total ?? 0;
  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0);

  return (
    <DndContext
      sensors={dnd.sensors}
      onDragStart={dnd.onDragStart}
      onDragOver={dnd.onDragOver}
      onDragEnd={dnd.onDragEnd}
      onDragCancel={dnd.onDragCancel}
    >
      <div
        className={cn(
          'flex min-h-0 flex-1 overflow-hidden rounded-card border border-border-2 bg-surface',
          className,
        )}
      >
        <FolderTree
          roots={explorer.roots}
          rootAssetCount={explorer.rootAssetCount}
          isLoading={explorer.isTreeLoading}
          isError={explorer.isTreeError}
          onRetry={explorer.refetchTree}
          currentFolderId={nav.folderId}
          path={explorer.path}
          openFolder={nav.openFolder}
          canManage={explorer.canManage}
          folders={explorer.folders}
          isValidDropTarget={dnd.isValidTarget}
          createParentId={createParentId}
          onOpenCreate={setCreateParentId}
          onCloseCreate={() => setCreateParentId(undefined)}
        />

        <div
          className="flex min-w-0 flex-1 flex-col gap-3 p-4"
          onDragOver={(event) => {
            // Only a drag carrying FILES from the OS — an in-app dnd-kit drag has no files.
            if (!event.dataTransfer.types.includes('Files')) return;
            event.preventDefault();
            setFileOver(true);
          }}
          onDragLeave={() => setFileOver(false)}
          onDrop={onNativeDrop}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ExplorerBreadcrumbs
              path={explorer.path}
              openFolder={nav.openFolder}
              isValidDropTarget={dnd.isValidTarget}
            />
            <span className="text-sm text-dim">
              {totalFiles > 0
                ? t('summary', {
                    files: totalFiles,
                    size: formatBytes(totalBytes, locale),
                  })
                : t('summaryEmpty')}
            </span>
          </div>

          <ExplorerToolbar
            search={nav.searchInput}
            onSearch={nav.setSearch}
            type={nav.type}
            onType={nav.setType}
            showTypeFilter={!typeLock}
            view={nav.view}
            onView={nav.setView}
            canManage={explorer.canManage}
            isUploading={explorer.uploads.isUploading}
            // A new folder is created INSIDE the folder you are looking at — the same place a
            // file dropped here would land.
            onNewFolder={() => setCreateParentId(nav.folderId)}
            onUpload={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={typeLock ? `${typeLock}/*` : undefined}
            className="hidden"
            onChange={onFilesChosen}
          />

          {/* A search leaves the current folder behind — say so, rather than letting the folder
              highlighted in the tree quietly disagree with what is on screen (U23a). */}
          {explorer.isSearching ? (
            <p className="text-xs text-faint">{t('searchingEverywhere')}</p>
          ) : null}

          {/* Read-only is stated once, plainly, instead of write actions silently missing. */}
          {!explorer.canManage ? (
            <p className="text-xs text-faint">{t('readOnly')}</p>
          ) : null}

          <SelectionBar
            count={selection.count}
            onClear={selection.clear}
            onDelete={() => void explorer.deleteSelected()}
            canManage={explorer.canManage}
          />

          {/*
           * A REFETCH dims the pane instead of replacing it with a skeleton: the files on screen
           * are still true while the next page loads, and blanking them would make paging or a
           * background refresh look like the folder had emptied. The skeleton belongs to the
           * FIRST load only — which is what `isLoading` (not `isFetching`) means (F2).
           */}
          <div
            aria-busy={explorer.isFetching}
            className={cn(
              'scroll-area relative min-h-0 flex-1 overflow-y-auto transition-opacity',
              explorer.isFetching && !explorer.isLoading && 'opacity-60',
              isFileOver && 'rounded-card ring-2 ring-accent-line',
            )}
          >
            {isFileOver ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-card bg-veil-accent text-sm font-medium text-accent">
                <Upload className="size-4" aria-hidden="true" />
                {t('drop.uploadHint')}
              </div>
            ) : null}

            <RenderGate
              isLoading={explorer.isLoading}
              isError={explorer.isError}
              isEmpty={explorer.emptyKind !== null}
              skeleton={
                <div className={cn('grid gap-4', EXPLORER_GRID_COLUMNS)}>
                  {Array.from({ length: EXPLORER_GRID_SKELETON_TILES }).map(
                    (_, index) => (
                      <Skeleton key={index} className="aspect-square w-full" />
                    ),
                  )}
                </div>
              }
              error={
                <ErrorState
                  message={t(
                    explorer.isStorageUnconfigured
                      ? 'errors.storageUnconfigured'
                      : 'errors.loadFailed',
                  )}
                  onRetry={explorer.refetch}
                  retryLabel={tCommon('actions.retry')}
                />
              }
              empty={
                <ExplorerEmpty
                  kind={explorer.emptyKind}
                  term={nav.search}
                  canManage={explorer.canManage}
                  onUpload={() => fileInputRef.current?.click()}
                  onClearSearch={() => nav.setSearch('')}
                />
              }
            >
              {nav.view === 'grid' ? (
                <AssetGridView
                  folders={explorer.childFolders}
                  assets={assets}
                  isSelected={selection.isSelected}
                  {...surfaceProps}
                />
              ) : (
                <AssetListView
                  folders={explorer.childFolders}
                  assets={assets}
                  isSelected={selection.isSelected}
                  {...surfaceProps}
                />
              )}
            </RenderGate>
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 text-sm text-dim">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={nav.page <= 1}
                onClick={() => nav.setPage(nav.page - 1)}
              >
                {t('pagination.prev')}
              </Button>
              <span>
                {t('pagination.pageInfo', {
                  page: nav.page,
                  total: totalPages,
                })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={nav.page >= totalPages}
                onClick={() => nav.setPage(nav.page + 1)}
              >
                {t('pagination.next')}
              </Button>
            </div>
          ) : null}

          <UploadTray queue={explorer.uploads} />
        </div>
      </div>

      {/* What the cursor carries, and — when the target would refuse it — why. */}
      <DragOverlay dropAnimation={null}>
        {dnd.payload ? (
          <div className="pointer-events-none flex items-center gap-2 rounded-card border border-accent-line bg-surface px-3 py-2 text-sm shadow-portal">
            <Files className="size-4 text-accent" aria-hidden="true" />
            <span className="text-text">
              {dnd.payload.kind === 'assets'
                ? t('fileCount', { count: dnd.payload.ids.length })
                : (findFolderNode(explorer.roots, dnd.payload.id)?.name ??
                  t('tree.label'))}
            </span>
            {dnd.rejection ? (
              <span className="text-xs text-bad">
                {t(`drop.${dnd.rejection}`)}
              </span>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>

      {/*
       * The full-screen view a plain click opens. In a picker (`onActivate` set) it also carries
       * the "Use this image" action, so choosing a file means seeing it large first. On a page,
       * a manager can delete straight from it. Arrow keys page through the current folder.
       */}
      <AssetPreview
        asset={previewAsset}
        onClose={() => setPreviewId(null)}
        onPrev={() => {
          const prev = assets[previewIndex - 1];
          if (prev) setPreviewId(prev.id);
        }}
        onNext={() => {
          const next = assets[previewIndex + 1];
          if (next) setPreviewId(next.id);
        }}
        hasPrev={previewIndex > 0}
        hasNext={previewIndex >= 0 && previewIndex < assets.length - 1}
        onDownload={onDownload}
        onChoose={onActivate}
        onDelete={
          onActivate || !explorer.canManage ? undefined : onDeleteFromPreview
        }
      />
    </DndContext>
  );
}

/**
 * Three different nothings, three different answers (U23a): a library nobody has uploaded to, a
 * folder that happens to be empty, and a search that matched nothing. Collapsing them into one
 * "No files" would tell the user nothing they didn't already know.
 */
function ExplorerEmpty({
  kind,
  term,
  canManage,
  onUpload,
  onClearSearch,
}: {
  kind: 'library' | 'folder' | 'search' | null;
  term: string;
  canManage: boolean;
  onUpload: () => void;
  onClearSearch: () => void;
}) {
  const { t } = useTranslation('mediaExplorer');
  if (kind === null) return null;

  if (kind === 'search') {
    return (
      <EmptyState
        title={t('empty.search.title', { term })}
        description={t('empty.search.description')}
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClearSearch}
          >
            {t('toolbar.clearSearch')}
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      title={t(
        kind === 'library' ? 'empty.library.title' : 'empty.folder.title',
      )}
      description={t(
        kind === 'library'
          ? 'empty.library.description'
          : 'empty.folder.description',
      )}
      action={
        canManage ? (
          <Button type="button" size="sm" onClick={onUpload}>
            <Upload className="size-4" aria-hidden="true" />
            {t('toolbar.upload')}
          </Button>
        ) : undefined
      }
    />
  );
}
