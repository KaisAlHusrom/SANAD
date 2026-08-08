import type { MediaAsset, MediaFolderNode } from '@sanad/contracts';
import { cn } from '../../lib/cn';
import { AssetTile } from './asset-tile';
import { FolderTile } from './folder-tile';
import { EXPLORER_GRID_COLUMNS } from './media-explorer.constants';
import type { SelectModifiers } from './select-modifiers';
import type { UseFolderActionsResult } from './use-folder-actions';

interface AssetGridViewProps {
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
 * The thumbnail wall from the design canon: ONE auto-filling grid at the canon's column width,
 * with subfolders first and files after — folders and files the SAME card size, so the eye reads
 * a single even wall (owner, 2026-07-25). Upload is the toolbar's job now, not a mismatched tile
 * wedged into the grid.
 */
export function AssetGridView({
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
}: AssetGridViewProps) {
  return (
    <div className={cn('grid gap-4', EXPLORER_GRID_COLUMNS)}>
      {folders.map((node) => (
        <FolderTile
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
        <AssetTile
          key={asset.id}
          asset={asset}
          isSelected={isSelected(asset.id)}
          onClick={onAssetClick}
          onActivate={onActivate}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDeleteAsset}
          canManage={canManage}
        />
      ))}
    </div>
  );
}
