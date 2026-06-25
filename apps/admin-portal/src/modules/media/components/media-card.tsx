import type { MediaAsset } from '@sanad/contracts';
import { FileText } from 'lucide-react';
import { useMediaCard } from '../hooks/use-media-card';
import { DeleteMediaButton } from './delete-media-button';

interface MediaCardProps {
  asset: MediaAsset;
  canManage: boolean;
}

/** One media tile (presentational — `isImage` derivation in `useMediaCard`, U5). */
export function MediaCard({ asset, canManage }: MediaCardProps) {
  const { isImage } = useMediaCard(asset);

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex aspect-square items-center justify-center bg-surface-2">
        {isImage ? (
          <img
            src={asset.url}
            alt={asset.alt.en || asset.filename}
            className="size-full object-cover"
          />
        ) : (
          <FileText className="size-10 text-faint" aria-hidden="true" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="truncate text-sm text-text" title={asset.filename}>
          {asset.filename}
        </span>
        {canManage ? <DeleteMediaButton assetId={asset.id} /> : null}
      </div>
    </div>
  );
}
