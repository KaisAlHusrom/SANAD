import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { MediaAsset, MediaFolderNode } from '@sanad/contracts';
import { FileText, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { formatBytes } from '../../lib/format/bytes';
import { useFormatDateTime } from '../../lib/format/use-format-datetime';
import { useDirection } from '../../providers/direction/use-direction';
import { Input } from '../ui/input';
import { AssetContextMenu } from './asset-context-menu';
import { FolderContextMenu } from './folder-context-menu';
import { modifiersOf, type SelectModifiers } from './select-modifiers';
import { folderDropId } from './use-explorer-dnd';
import type { UseFolderActionsResult } from './use-folder-actions';
import { useInlineRename } from './use-inline-rename';

interface AssetListViewProps {
  folders: MediaFolderNode[];
  assets: MediaAsset[];
  isSelected: (id: string) => boolean;
  onAssetClick: (asset: MediaAsset, modifiers: SelectModifiers) => void;
  onActivate?: (asset: MediaAsset) => void;
  onPreview: (asset: MediaAsset) => void;
  onDownload: (asset: MediaAsset) => void;
  onDeleteAsset: (asset: MediaAsset) => void;
  onOpenFolder: (folderId: string) => void;
  onNewSubfolder: (parentId: string) => void;
  folderActions: UseFolderActionsResult;
  canManage: boolean;
  isValidDropTarget: (dropId: string) => boolean;
}

/**
 * The details view: name, size and date in columns. The same rows carry the same click-to-preview,
 * the same right-click menu, the same selection and the same drag targets as the grid — only
 * denser, for finding one file by name rather than recognizing it by sight (F9, U21).
 */
export function AssetListView({
  folders,
  assets,
  isSelected,
  onAssetClick,
  onActivate,
  onPreview,
  onDownload,
  onDeleteAsset,
  onOpenFolder,
  onNewSubfolder,
  folderActions,
  canManage,
  isValidDropTarget,
}: AssetListViewProps) {
  const { t } = useTranslation('mediaExplorer');
  const { locale } = useDirection();
  const formatDateTime = useFormatDateTime();

  return (
    <div className="overflow-hidden rounded-card border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-2 bg-surface-2 text-start text-xs text-faint">
            <th scope="col" className="px-3 py-2 text-start font-medium">
              {t('columns.name')}
            </th>
            <th scope="col" className="px-3 py-2 text-start font-medium">
              {t('columns.size')}
            </th>
            <th scope="col" className="px-3 py-2 text-start font-medium">
              {t('columns.modified')}
            </th>
          </tr>
        </thead>
        <tbody>
          {folders.map((node) => (
            <FolderRow
              key={node.id}
              node={node}
              onOpen={onOpenFolder}
              onNewSubfolder={onNewSubfolder}
              folders={folderActions}
              canManage={canManage}
              isValidDropTarget={isValidDropTarget}
            />
          ))}
          {assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              isSelected={isSelected(asset.id)}
              onClick={onAssetClick}
              onActivate={onActivate}
              onPreview={onPreview}
              onDownload={onDownload}
              onDelete={onDeleteAsset}
              canManage={canManage}
              size={formatBytes(asset.size, locale)}
              modified={formatDateTime(asset.updatedAt)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FolderRow({
  node,
  onOpen,
  onNewSubfolder,
  folders,
  canManage,
  isValidDropTarget,
}: {
  node: MediaFolderNode;
  onOpen: (folderId: string) => void;
  onNewSubfolder: (parentId: string) => void;
  folders: UseFolderActionsResult;
  canManage: boolean;
  isValidDropTarget: (dropId: string) => boolean;
}) {
  const { t } = useTranslation('mediaExplorer');
  const dropId = folderDropId(node.id);
  const { setNodeRef: setDropRef } = useDroppable({ id: dropId });
  const rename = useInlineRename(node, folders);
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
  } = useDraggable({
    id: `folder-row:${node.id}`,
    disabled: !canManage || rename.isRenaming,
    data: { payload: { kind: 'folder', id: node.id, parentId: node.parentId } },
  });

  return (
    <FolderContextMenu
      node={node}
      canManage={canManage}
      onOpen={(target) => onOpen(target.id)}
      onNewSubfolder={(target) => onNewSubfolder(target.id)}
      onRename={rename.start}
      onDelete={(target) => void folders.remove(target)}
    >
      <tr
        ref={setDropRef}
        className={cn(
          'border-b border-border-2 last:border-b-0',
          isValidDropTarget(dropId) && 'bg-accent-soft',
        )}
      >
        <td colSpan={3} className="p-0">
          {rename.isRenaming ? (
            <form
              className="flex items-center gap-2 px-3 py-2"
              onSubmit={(event) => {
                event.preventDefault();
                void rename.submit();
              }}
            >
              <Folder
                className="size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span className="flex-1">
                <Input
                  autoFocus
                  value={rename.draft}
                  disabled={rename.isBusy}
                  aria-label={t('folder.nameLabel')}
                  aria-invalid={rename.error ? true : undefined}
                  onChange={(event) => rename.setDraft(event.target.value)}
                  onBlur={() => void rename.submit()}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') rename.cancel();
                  }}
                  className="h-7 text-sm"
                />
                {rename.error ? (
                  <span role="alert" className="mt-1 block text-xs text-bad">
                    {rename.error}
                  </span>
                ) : null}
              </span>
            </form>
          ) : (
            <button
              ref={setDragRef}
              type="button"
              onClick={() => onOpen(node.id)}
              className="flex w-full items-center gap-2 px-3 py-2 text-start transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
              {...attributes}
              {...listeners}
            >
              <Folder
                className="size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span className="truncate text-text">{node.name}</span>
              <span className="ms-auto shrink-0 text-xs text-faint">
                {node.assetCount > 0
                  ? t('fileCount', { count: node.assetCount })
                  : t('summaryEmpty')}
              </span>
            </button>
          )}
        </td>
      </tr>
    </FolderContextMenu>
  );
}

function AssetRow({
  asset,
  isSelected,
  onClick,
  onActivate,
  onPreview,
  onDownload,
  onDelete,
  canManage,
  size,
  modified,
}: {
  asset: MediaAsset;
  isSelected: boolean;
  onClick: (asset: MediaAsset, modifiers: SelectModifiers) => void;
  onActivate?: (asset: MediaAsset) => void;
  onPreview: (asset: MediaAsset) => void;
  onDownload: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
  canManage: boolean;
  size: string;
  modified: string;
}) {
  const { t } = useTranslation('mediaExplorer');
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `asset-row:${asset.id}`,
    disabled: !canManage,
    data: {
      payload: {
        kind: 'assets',
        ids: [asset.id],
        sourceFolderId: asset.folderId,
      },
    },
  });
  const isImage = asset.mimeType.startsWith('image/');

  return (
    <AssetContextMenu
      asset={asset}
      canManage={canManage}
      onPreview={onPreview}
      onDownload={onDownload}
      onDelete={onDelete}
    >
      <tr
        ref={setNodeRef}
        aria-selected={isSelected}
        onClick={(event) => onClick(asset, modifiersOf(event))}
        onDoubleClick={() => onActivate?.(asset)}
        className={cn(
          'cursor-pointer border-b border-border-2 transition-colors last:border-b-0 hover:bg-surface-2',
          isSelected && 'bg-accent-soft',
          isDragging && 'opacity-40',
        )}
        {...attributes}
        {...listeners}
      >
        <td className="px-3 py-2">
          <span className="flex items-center gap-2">
            {isImage && asset.status !== 'pending' ? (
              <img
                src={asset.url}
                alt=""
                loading="lazy"
                className="size-7 shrink-0 rounded-xs object-cover"
              />
            ) : (
              <FileText
                className="size-4 shrink-0 text-faint"
                aria-hidden="true"
              />
            )}
            <span
              className="truncate text-text"
              dir="ltr"
              title={asset.filename}
            >
              {asset.filename}
            </span>
            {asset.status === 'pending' ? (
              <span className="shrink-0 rounded-pill bg-warn px-2 py-0.5 text-xs text-bg">
                {t('pending')}
              </span>
            ) : null}
          </span>
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-dim">{size}</td>
        <td className="whitespace-nowrap px-3 py-2 text-dim">{modified}</td>
      </tr>
    </AssetContextMenu>
  );
}
