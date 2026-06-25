import type { MediaAsset } from '@sanad/contracts';
import { MediaCard } from './media-card';

interface MediaGridProps {
  items: MediaAsset[];
  canManage: boolean;
}

/** The media library grid. */
export function MediaGrid({ items, canManage }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((asset) => (
        <MediaCard key={asset.id} asset={asset} canManage={canManage} />
      ))}
    </div>
  );
}
