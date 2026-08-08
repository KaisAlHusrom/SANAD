import type { MediaAsset } from '@sanad/contracts';
import type { ReactNode } from 'react';
import { useGetMediaLookupByIdQuery } from '../../data/lookups/media-lookup.api';
import { useMediaLibraryPicker } from './use-media-library-picker';

interface UseMediaIdPickerArgs {
  /** The currently-selected media id, or '' when none. */
  value: string;
  onChange: (id: string) => void;
}

interface UseMediaIdPickerResult {
  /** Whether the user may browse the library (media.read); false → no picker. */
  canBrowse: boolean;
  /** Open the full media-library modal (browse + folders + upload). */
  openPicker: () => void;
  /** The library modal element to render (null when the user can't browse). */
  pickerElement: ReactNode;
  /** The resolved asset for the current value (for the thumbnail preview), or null. */
  preview: MediaAsset | null;
  clear: () => void;
}

/**
 * Media-**id**-picker logic (U5/W5): binds a media UUID (content `coverMediaId`/`avatarMediaId`)
 * and opens the reusable `MediaLibraryModal` (browse + folder nav + create-folder + upload) so the
 * user never leaves the form. The current id is resolved to an asset for the thumbnail preview via
 * the read-only `media-lookup` bridge. Picking commits the id; clearing empties it.
 */
export function useMediaIdPicker({
  value,
  onChange,
}: UseMediaIdPickerArgs): UseMediaIdPickerResult {
  const { open, canBrowse, element } = useMediaLibraryPicker({
    onPick: (asset) => onChange(asset.id),
  });
  const { data: preview } = useGetMediaLookupByIdQuery(value, {
    skip: !value || !canBrowse,
  });

  return {
    canBrowse,
    openPicker: open,
    pickerElement: element,
    preview: preview ?? null,
    clear: () => onChange(''),
  };
}
