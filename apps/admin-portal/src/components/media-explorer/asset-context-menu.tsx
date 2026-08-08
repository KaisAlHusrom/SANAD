import type { MediaAsset } from '@sanad/contracts';
import { Download, Eye, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu';

interface AssetContextMenuProps {
  asset: MediaAsset;
  canManage: boolean;
  onPreview: (asset: MediaAsset) => void;
  onDownload: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
  /** The element the right-click opens the menu on — a tile or a table row. */
  children: ReactNode;
}

/**
 * The right-click menu shared by a file's grid tile and its list row, so the same file offers the
 * same actions however it is shown (F9). Preview and Download need no permission; Delete appears
 * only for a manager (U23c) — it is never a dead, greyed row for a viewer, it simply isn't there.
 */
export function AssetContextMenu({
  asset,
  canManage,
  onPreview,
  onDownload,
  onDelete,
  children,
}: AssetContextMenuProps) {
  const { t } = useTranslation('mediaExplorer');

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onPreview(asset)}>
          <Eye className="size-4" aria-hidden="true" />
          {t('asset.preview')}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onDownload(asset)}>
          <Download className="size-4" aria-hidden="true" />
          {t('asset.download')}
        </ContextMenuItem>
        {canManage ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-bad"
              onSelect={() => onDelete(asset)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t('asset.delete')}
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
