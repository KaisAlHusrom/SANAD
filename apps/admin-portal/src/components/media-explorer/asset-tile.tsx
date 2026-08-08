import { useDraggable } from '@dnd-kit/core';
import type { MediaAsset } from '@sanad/contracts';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../providers/direction/use-direction';
import { cn } from '../../lib/cn';
import { formatBytes } from '../../lib/format/bytes';
import { AssetContextMenu } from './asset-context-menu';
import { modifiersOf, type SelectModifiers } from './select-modifiers';

interface AssetTileProps {
  asset: MediaAsset;
  isSelected: boolean;
  /**
   * A plain click OPENS the file (full-screen preview); a ⌘/Ctrl/Shift click SELECTS it for a
   * bulk action. The shell reads the modifiers and decides — the tile only reports the click.
   * (Owner, 2026-07-25: "I want to view the image full screen when I click on it, not select it.")
   */
  onClick: (asset: MediaAsset, modifiers: SelectModifiers) => void;
  /** Double-click / Enter — the picker's "take this one and close". */
  onActivate?: (asset: MediaAsset) => void;
  onPreview: (asset: MediaAsset) => void;
  onDownload: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
  canManage: boolean;
}

/**
 * One file, as a card — the media tile from the design canon (§4): 1px border, card radius, a
 * 1.3-ratio thumbnail, the filename, and the size beneath it in `--faint`. A folder tile is the
 * same shape, so the two sit in one even wall.
 *
 * The filename is `dir="ltr"` even in Arabic: a file called `hero-banner@2x.png` is an identifier,
 * not prose, and rendering it right-to-left would move the extension to the wrong end.
 *
 * A still-`pending` asset (its bytes are mid-flight, or its upload never confirmed) says so
 * instead of showing a broken image — the state that used to leave silent orphans in the library.
 */
export function AssetTile({
  asset,
  isSelected,
  onClick,
  onActivate,
  onPreview,
  onDownload,
  onDelete,
  canManage,
}: AssetTileProps) {
  const { t } = useTranslation('mediaExplorer');
  const { locale } = useDirection();
  const isImage = asset.mimeType.startsWith('image/');
  const isPending = asset.status === 'pending';

  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `asset:${asset.id}`,
    disabled: !canManage,
    data: {
      payload: {
        kind: 'assets',
        ids: [asset.id],
        sourceFolderId: asset.folderId,
      },
    },
  });

  return (
    <AssetContextMenu
      asset={asset}
      canManage={canManage}
      onPreview={onPreview}
      onDownload={onDownload}
      onDelete={onDelete}
    >
      <button
        ref={setNodeRef}
        type="button"
        // dnd-kit's attributes come FIRST so the tile's own selected state wins over the
        // draggable's default `aria-pressed` — the selection is what a reader must hear.
        {...attributes}
        {...listeners}
        aria-pressed={isSelected}
        aria-label={asset.filename}
        onClick={(event) => onClick(asset, modifiersOf(event))}
        onDoubleClick={() => onActivate?.(asset)}
        className={cn(
          'flex flex-col overflow-hidden rounded-card border border-border bg-surface text-start shadow-portal transition-colors',
          'hover:border-border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line',
          isSelected && 'border-accent-line ring-2 ring-accent-line',
          isDragging && 'opacity-40',
        )}
      >
        <div className="relative flex aspect-[1.3] items-center justify-center bg-surface-2">
          {isImage && !isPending ? (
            <img
              src={asset.url}
              alt={asset.alt.en || asset.filename}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <FileText className="size-8 text-faint" aria-hidden="true" />
          )}
          {isPending ? (
            <span className="absolute bottom-2 start-2 rounded-pill bg-warn px-2 py-0.5 text-xs text-bg">
              {t('pending')}
            </span>
          ) : null}
        </div>
        <div className="px-3 py-2.5">
          <div
            className="truncate text-sm text-text"
            dir="ltr"
            title={asset.filename}
          >
            {asset.filename}
          </div>
          <div className="mt-0.5 text-xs text-faint">
            {formatBytes(asset.size, locale)}
          </div>
        </div>
      </button>
    </AssetContextMenu>
  );
}
