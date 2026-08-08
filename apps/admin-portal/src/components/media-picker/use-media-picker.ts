import type { ReactNode } from 'react';
import { useMediaLibraryPicker } from './use-media-library-picker';

interface UseMediaPickerArgs {
  onSelect: (url: string) => void;
}

interface UseMediaPickerResult {
  /** Whether the user may browse the library (media.read); false → URL-input only. */
  canBrowse: boolean;
  /** Open the full media-library modal (browse + folders + upload). */
  openPicker: () => void;
  /** The library modal element to render (null when the user can't browse). */
  pickerElement: ReactNode;
}

/**
 * Media-**url**-picker logic (U5/W5): opens the reusable `MediaLibraryModal` (browse + folder nav
 * + create-folder + upload) and emits the chosen asset's public url — for URL-valued fields
 * (e.g. branding logos). Bridges via the shared lookups/write bridge, never the media module.
 */
export function useMediaPicker({
  onSelect,
}: UseMediaPickerArgs): UseMediaPickerResult {
  const { open, canBrowse, element } = useMediaLibraryPicker({
    onPick: (asset) => onSelect(asset.url),
  });
  return { canBrowse, openPicker: open, pickerElement: element };
}
