import { useDroppable } from '@dnd-kit/core';
import type { MediaFolderNode } from '@sanad/contracts';
import { ChevronLeft } from 'lucide-react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { folderDropId } from './use-explorer-dnd';

interface ExplorerBreadcrumbsProps {
  /** Root → … → current folder. Empty at the library root. */
  path: MediaFolderNode[];
  openFolder: (folderId: string | null) => void;
  isValidDropTarget: (dropId: string) => boolean;
}

/**
 * Where you are, and the way back up. Every crumb is also a DROP target, which is how a file
 * moves out of a subfolder without hunting for its parent in the tree — the same gesture a
 * desktop file manager offers.
 */
export function ExplorerBreadcrumbs({
  path,
  openFolder,
  isValidDropTarget,
}: ExplorerBreadcrumbsProps) {
  const { t } = useTranslation('mediaExplorer');

  return (
    <nav
      aria-label={t('breadcrumb.label')}
      className="flex min-w-0 items-center gap-1 text-sm"
    >
      <Crumb
        label={t('root')}
        folderId={null}
        isCurrent={path.length === 0}
        onOpen={openFolder}
        isValidDropTarget={isValidDropTarget}
      />
      {path.map((node, index) => (
        <Fragment key={node.id}>
          {/* Points along the reading direction: mirrored, never a left/right class (U7). */}
          <ChevronLeft
            className="size-3.5 shrink-0 rotate-180 text-faint rtl:rotate-0"
            aria-hidden="true"
          />
          <Crumb
            label={node.name}
            folderId={node.id}
            isCurrent={index === path.length - 1}
            onOpen={openFolder}
            isValidDropTarget={isValidDropTarget}
          />
        </Fragment>
      ))}
    </nav>
  );
}

function Crumb({
  label,
  folderId,
  isCurrent,
  onOpen,
  isValidDropTarget,
}: {
  label: string;
  folderId: string | null;
  isCurrent: boolean;
  onOpen: (folderId: string | null) => void;
  isValidDropTarget: (dropId: string) => boolean;
}) {
  const dropId = folderDropId(folderId);
  const { setNodeRef } = useDroppable({ id: dropId });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onOpen(folderId)}
      aria-current={isCurrent ? 'page' : undefined}
      className={cn(
        'max-w-48 truncate rounded-xs px-1.5 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
        isCurrent ? 'font-medium text-text' : 'text-dim hover:text-text',
        isValidDropTarget(dropId) &&
          'bg-accent-soft text-accent ring-2 ring-accent-line',
      )}
    >
      {label}
    </button>
  );
}
