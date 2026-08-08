import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { MediaFolderNode } from '@sanad/contracts';
import { ChevronRight, Folder, FolderOpen, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { EXPLORER_TREE_INDENT_REM } from './media-explorer.constants';
import { folderDropId } from './use-explorer-dnd';

/** Everything the tree hands each of its nodes — one object rather than a dozen props. */
export interface FolderTreeApi {
  currentFolderId: string | null;
  expanded: ReadonlySet<string>;
  toggleExpanded: (id: string) => void;
  openFolder: (id: string | null) => void;
  canManage: boolean;
  /** The node being renamed inline, if any. */
  renamingId: string | null;
  renameDraft: string;
  renameError: string | null;
  isRenaming: boolean;
  setRenameDraft: (value: string) => void;
  startRename: (node: MediaFolderNode) => void;
  submitRename: () => void;
  cancelRename: () => void;
  createSubfolder: (parent: MediaFolderNode) => void;
  deleteFolder: (node: MediaFolderNode) => void;
  isValidDropTarget: (dropId: string) => boolean;
}

/**
 * One folder in the sidebar tree: a disclosure triangle, the folder itself, its file count, and —
 * for someone who may manage the library — a menu. It is BOTH draggable (a folder can be
 * re-filed) and droppable (files and folders can be dropped into it).
 *
 * The row is a button, not a div with a click handler, so the whole tree is keyboard-navigable
 * and screen readers announce it as a tree item with its expanded state.
 */
export function FolderTreeNode({
  node,
  depth,
  api,
}: {
  node: MediaFolderNode;
  depth: number;
  api: FolderTreeApi;
}) {
  const { t } = useTranslation('mediaExplorer');
  const isOpen = api.expanded.has(node.id);
  const isCurrent = api.currentFolderId === node.id;
  const hasChildren = node.children.length > 0;
  const dropId = folderDropId(node.id);

  const { setNodeRef: setDropRef } = useDroppable({ id: dropId });
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({
    id: `folder:${node.id}`,
    disabled: !api.canManage || api.renamingId === node.id,
    data: {
      payload: { kind: 'folder', id: node.id, parentId: node.parentId },
    },
  });

  const isRenamingThis = api.renamingId === node.id;

  return (
    <li>
      <div
        ref={setDropRef}
        className={cn(
          'group flex items-center gap-1 rounded-nav pe-1 transition-colors',
          isCurrent && 'bg-accent-soft text-accent',
          !isCurrent && 'hover:bg-surface-2',
          // The drop target lights up only when the drop would actually be ACCEPTED (U23a) —
          // an illegal target never glows, so the "no" is felt before the release.
          api.isValidDropTarget(dropId) && 'ring-2 ring-accent-line',
          isDragging && 'opacity-40',
        )}
        // Indent is a computed depth, not a design token — a genuine runtime value (U6 carve-out).
        style={{ paddingInlineStart: `${depth * EXPLORER_TREE_INDENT_REM}rem` }}
      >
        <button
          type="button"
          onClick={() => api.toggleExpanded(node.id)}
          aria-label={isOpen ? t('tree.collapse') : t('tree.expand')}
          className={cn(
            'inline-flex size-5 shrink-0 items-center justify-center rounded-xs text-faint transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
            !hasChildren && 'invisible',
          )}
        >
          {/* A disclosure chevron points along the reading direction — mirrored, never a
              left/right class (U7). */}
          <ChevronRight
            className={cn(
              'size-4 transition-transform rtl:-rotate-180',
              isOpen && 'rotate-90 rtl:rotate-90',
            )}
            aria-hidden="true"
          />
        </button>

        {isRenamingThis ? (
          <form
            className="flex-1 py-1"
            onSubmit={(event) => {
              event.preventDefault();
              api.submitRename();
            }}
          >
            <Input
              autoFocus
              value={api.renameDraft}
              disabled={api.isRenaming}
              aria-label={t('folder.nameLabel')}
              aria-invalid={api.renameError ? true : undefined}
              onChange={(event) => api.setRenameDraft(event.target.value)}
              onBlur={api.submitRename}
              onKeyDown={(event) => {
                if (event.key === 'Escape') api.cancelRename();
              }}
              className="h-7 text-sm"
            />
            {/* A name clash belongs ON the field the user is still typing in — a toast would
                disappear while the rejected name stayed (U23a). */}
            {api.renameError ? (
              <p role="alert" className="mt-1 text-xs text-bad">
                {api.renameError}
              </p>
            ) : null}
          </form>
        ) : (
          <>
            <button
              ref={setDragRef}
              type="button"
              onClick={() => api.openFolder(node.id)}
              aria-current={isCurrent ? 'true' : undefined}
              className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-start text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
              {...attributes}
              {...listeners}
            >
              {isCurrent || isOpen ? (
                <FolderOpen className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Folder
                  className="size-4 shrink-0 text-faint"
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{node.name}</span>
              {node.assetCount > 0 ? (
                <span className="ms-auto shrink-0 text-xs text-faint">
                  {node.assetCount}
                </span>
              ) : null}
            </button>

            {api.canManage ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t('tree.menu')}
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-xs text-faint opacity-0 transition-opacity hover:text-text focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line group-hover:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => api.createSubfolder(node)}>
                    {t('folder.newSub')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => api.startRename(node)}>
                    {t('folder.rename')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-bad"
                    onSelect={() => api.deleteFolder(node)}
                  >
                    {t('folder.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        )}
      </div>

      {hasChildren && isOpen ? (
        <ul>
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              api={api}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
