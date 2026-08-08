import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { MediaFolderNode } from '@sanad/contracts';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { Input } from '../ui/input';
import { FolderContextMenu } from './folder-context-menu';
import { folderDropId } from './use-explorer-dnd';
import type { UseFolderActionsResult } from './use-folder-actions';
import { useInlineRename } from './use-inline-rename';

/**
 * A subfolder shown in the content pane, alongside the files and — since the owner's 2026-07-25
 * pass — as the SAME card as a file: a square-ratio icon plate above the name, so folders and
 * files line up in one wall instead of two differently-shaped rows. It is what makes this an
 * explorer rather than a filtered gallery: you walk INTO folders from the files view.
 *
 * It is draggable (a folder can be re-filed), droppable (files and folders drop into it), inline-
 * renameable, and carries the same right-click menu as the sidebar tree (F9).
 */
export function FolderTile({
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
    isDragging,
  } = useDraggable({
    id: `folder-tile:${node.id}`,
    disabled: !canManage || rename.isRenaming,
    data: {
      payload: { kind: 'folder', id: node.id, parentId: node.parentId },
    },
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
      <div
        ref={setDropRef}
        className={cn(
          'flex flex-col overflow-hidden rounded-card border border-border bg-surface text-start shadow-portal transition-colors',
          'hover:border-border-2 focus-within:ring-2 focus-within:ring-accent-line',
          isValidDropTarget(dropId) &&
            'border-accent-line ring-2 ring-accent-line',
          isDragging && 'opacity-40',
        )}
      >
        <button
          ref={setDragRef}
          type="button"
          onClick={() => onOpen(node.id)}
          onDoubleClick={() => onOpen(node.id)}
          className="flex aspect-[1.3] items-center justify-center bg-surface-2 focus-visible:outline-none"
          aria-label={node.name}
          {...attributes}
          {...listeners}
        >
          <Folder className="size-12 text-accent" aria-hidden="true" />
        </button>

        <div className="px-3 py-2.5">
          {rename.isRenaming ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void rename.submit();
              }}
            >
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
                <p role="alert" className="mt-1 text-xs text-bad">
                  {rename.error}
                </p>
              ) : null}
            </form>
          ) : (
            <>
              <div className="truncate text-sm text-text" title={node.name}>
                {node.name}
              </div>
              <div className="mt-0.5 text-xs text-faint">
                {node.assetCount > 0
                  ? t('fileCount', { count: node.assetCount })
                  : t('summaryEmpty')}
              </div>
            </>
          )}
        </div>
      </div>
    </FolderContextMenu>
  );
}
