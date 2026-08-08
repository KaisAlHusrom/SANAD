import type { MediaFolderNode } from '@sanad/contracts';
import { FolderOpen, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu';

interface FolderContextMenuProps {
  node: MediaFolderNode;
  canManage: boolean;
  onOpen: (node: MediaFolderNode) => void;
  onNewSubfolder: (node: MediaFolderNode) => void;
  onRename: (node: MediaFolderNode) => void;
  onDelete: (node: MediaFolderNode) => void;
  children: ReactNode;
}

/**
 * The right-click menu shared by a folder's grid tile and its list row (F9). Open is always
 * offered; the three write actions appear only for a manager (U23c) — the same rule the sidebar
 * tree's "⋯" menu follows, so a folder behaves the same wherever it is shown.
 */
export function FolderContextMenu({
  node,
  canManage,
  onOpen,
  onNewSubfolder,
  onRename,
  onDelete,
  children,
}: FolderContextMenuProps) {
  const { t } = useTranslation('mediaExplorer');

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onOpen(node)}>
          <FolderOpen className="size-4" aria-hidden="true" />
          {t('folder.open')}
        </ContextMenuItem>
        {canManage ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => onNewSubfolder(node)}>
              <FolderPlus className="size-4" aria-hidden="true" />
              {t('folder.newSub')}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onRename(node)}>
              <Pencil className="size-4" aria-hidden="true" />
              {t('folder.rename')}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-bad"
              onSelect={() => onDelete(node)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t('folder.delete')}
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
