import {
  DEFAULT_PAGE_SIZE,
  type MediaAsset,
  type MediaListQuery,
} from '@sanad/contracts';
import { useState } from 'react';
import { useRequirePermission } from '../../app/guards/use-require-permission';
import { useSearchMediaLookupQuery } from '../../data/lookups/media-lookup.api';

interface UseMediaPickerArgs {
  onSelect: (url: string) => void;
}

interface UseMediaPickerResult {
  /** Whether the user may browse the library (media.read); false → URL-input only. */
  canBrowse: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  items: MediaAsset[];
  isLoading: boolean;
  isError: boolean;
  pick: (asset: MediaAsset) => void;
}

/**
 * Media-picker logic (U5/W5): bridges to the shared `media-lookup` api (never the media
 * module's own api). Only fetches while the dialog is open and the user can browse, and
 * filters to images (logos/favicons). Picking an asset emits its url and closes.
 */
export function useMediaPicker({
  onSelect,
}: UseMediaPickerArgs): UseMediaPickerResult {
  const canBrowse = useRequirePermission('media.read');
  const [open, setOpen] = useState(false);

  const query: MediaListQuery = {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    order: 'asc',
    type: 'image',
  };
  const { data, isLoading, isError } = useSearchMediaLookupQuery(query, {
    skip: !open || !canBrowse,
  });

  const pick = (asset: MediaAsset) => {
    onSelect(asset.url);
    setOpen(false);
  };

  return {
    canBrowse,
    open,
    setOpen,
    items: data?.items ?? [],
    isLoading,
    isError,
    pick,
  };
}
