import { useDroppable } from '@dnd-kit/core';
import type { MediaFolderNode } from '@sanad/contracts';
import { FolderPlus, Library } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { ErrorState } from '../feedback/error-state';
import { RenderGate } from '../feedback/render-gate';
import { Skeleton } from '../feedback/skeleton';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FolderTreeNode, type FolderTreeApi } from './folder-tree-node';
import { EXPLORER_TREE_SKELETON_ROWS } from './media-explorer.constants';
import { ROOT_DROP_ID } from './use-explorer-dnd';
import type { UseFolderActionsResult } from './use-folder-actions';

interface FolderTreeProps {
  roots: MediaFolderNode[];
  rootAssetCount: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  currentFolderId: string | null;
  /** Root → … → current folder; used to auto-reveal wherever the user lands. */
  path: MediaFolderNode[];
  openFolder: (folderId: string | null) => void;
  canManage: boolean;
  folders: UseFolderActionsResult;
  isValidDropTarget: (dropId: string) => boolean;
  /**
   * The parent a new folder is being created under, or `undefined` when the form is closed.
   * Controlled from the explorer so the toolbar's "New folder" and a node's "New subfolder"
   * open the SAME one field, rather than two competing ways to name a folder.
   */
  createParentId: string | null | undefined;
  onOpenCreate: (parentId: string | null) => void;
  onCloseCreate: () => void;
}

/**
 * The folder sidebar — the "left pane" of the explorer (inline-start in both directions, U7).
 *
 * It carries all four of its own states (U23): a skeleton shaped like folder rows, a failure with
 * a retry, "no folders yet" with the action that fixes it, and the tree itself. The library root
 * is always present above them as a real, droppable destination — dragging a file onto it is how
 * you take the file back OUT of a folder.
 */
export function FolderTree({
  roots,
  rootAssetCount,
  isLoading,
  isError,
  onRetry,
  currentFolderId,
  path,
  openFolder,
  canManage,
  folders,
  isValidDropTarget,
  createParentId,
  onOpenCreate,
  onCloseCreate,
}: FolderTreeProps) {
  const { t } = useTranslation('mediaExplorer');
  const { t: tCommon } = useTranslation('common');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  /** The name the rename started from — renaming to itself is a no-op, not a 409. */
  const [renameOriginal, setRenameOriginal] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState('');
  const isCreateOpen = createParentId !== undefined;

  const { setNodeRef: setRootDropRef } = useDroppable({ id: ROOT_DROP_ID });

  // Reveal wherever the user is: opening a folder from a breadcrumb, a search result or a
  // deep link must expand its ancestors, or the tree would show a selection nobody can see.
  const pathIds = path.map((node) => node.id).join('/');
  useEffect(() => {
    if (!pathIds) return;
    setExpanded((prev) => new Set([...prev, ...pathIds.split('/')]));
  }, [pathIds]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRename = (node: MediaFolderNode) => {
    setRenamingId(node.id);
    setRenameDraft(node.name);
    setRenameOriginal(node.name);
    setRenameError(null);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
    setRenameOriginal('');
    setRenameError(null);
  };

  const submitRename = async () => {
    if (!renamingId) return;
    const current = renameDraft.trim();
    if (!current || current === renameOriginal) {
      cancelRename();
      return;
    }
    const error = await folders.rename(renamingId, current);
    if (error) {
      setRenameError(error);
      return;
    }
    cancelRename();
  };

  const openCreate = (parentId: string | null) => {
    setCreateDraft('');
    onOpenCreate(parentId);
    if (parentId) setExpanded((prev) => new Set([...prev, parentId]));
  };

  const closeCreate = () => {
    setCreateDraft('');
    onCloseCreate();
  };

  const submitCreate = async () => {
    const created = await folders.create(createDraft, createParentId ?? null);
    if (!created) return;
    closeCreate();
    openFolder(created.id);
  };

  const api: FolderTreeApi = {
    currentFolderId,
    expanded,
    toggleExpanded,
    openFolder,
    canManage,
    renamingId,
    renameDraft,
    renameError,
    isRenaming: folders.busyId === renamingId && folders.isBusy,
    setRenameDraft,
    startRename,
    submitRename: () => void submitRename(),
    cancelRename,
    createSubfolder: (parent) => openCreate(parent.id),
    deleteFolder: (node) => {
      void folders.remove(node).then((removed) => {
        // Standing in a folder that no longer exists is not a place — step back to the root.
        if (removed && currentFolderId === node.id) openFolder(null);
      });
    },
    isValidDropTarget,
  };

  return (
    <nav
      aria-label={t('tree.label')}
      className="flex w-60 shrink-0 flex-col gap-2 border-e border-border-2 bg-sidebar p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-faint">
          {t('tree.label')}
        </span>
        {canManage ? (
          <button
            type="button"
            onClick={() => openCreate(null)}
            aria-label={t('tree.newRoot')}
            className="inline-flex size-6 items-center justify-center rounded-xs text-faint transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
          >
            <FolderPlus className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* The library root: a destination in its own right, above (and outside) the tree. */}
      <button
        ref={setRootDropRef}
        type="button"
        onClick={() => openFolder(null)}
        aria-current={currentFolderId === null ? 'true' : undefined}
        className={cn(
          'flex items-center gap-2 rounded-nav px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
          currentFolderId === null
            ? 'bg-accent-soft text-accent'
            : 'text-text hover:bg-surface-2',
          isValidDropTarget(ROOT_DROP_ID) && 'ring-2 ring-accent-line',
        )}
      >
        <Library className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{t('root')}</span>
        {rootAssetCount > 0 ? (
          <span className="ms-auto shrink-0 text-xs text-faint">
            {rootAssetCount}
          </span>
        ) : null}
      </button>

      {isCreateOpen && canManage ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCreate();
          }}
        >
          <Input
            autoFocus
            value={createDraft}
            onChange={(event) => setCreateDraft(event.target.value)}
            placeholder={t('folder.namePlaceholder')}
            aria-label={t('folder.nameLabel')}
            className="h-8 text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={!createDraft.trim()}
              loading={folders.isBusy}
            >
              {t('folder.create')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={closeCreate}
            >
              {tCommon('actions.cancel')}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="scroll-area -mx-1 flex-1 overflow-y-auto px-1">
        <RenderGate
          isLoading={isLoading}
          isError={isError}
          isEmpty={roots.length === 0}
          skeleton={
            <div className="flex flex-col gap-2 py-1">
              {Array.from({ length: EXPLORER_TREE_SKELETON_ROWS }).map(
                (_, index) => (
                  <Skeleton key={index} className="h-7 w-full" />
                ),
              )}
            </div>
          }
          error={
            <ErrorState
              message={t('tree.error')}
              onRetry={onRetry}
              retryLabel={tCommon('actions.retry')}
            />
          }
          empty={
            <p className="px-2 py-3 text-sm text-faint">{t('tree.empty')}</p>
          }
        >
          <ul>
            {roots.map((node) => (
              <FolderTreeNode key={node.id} node={node} depth={0} api={api} />
            ))}
          </ul>
        </RenderGate>
      </div>
    </nav>
  );
}
