import type { MediaAsset } from '@sanad/contracts';
import { useState, type ReactNode } from 'react';
import { useRequirePermission } from '../../app/guards/use-require-permission';
import { useParentDialogTitle } from '../ui/dialog-stack';
import { MediaLibraryModal } from './media-library-modal';

interface UseMediaLibraryPickerArgs {
  /** Commit a chosen asset (the field maps it to a url or an id). */
  onPick: (asset: MediaAsset) => void;
}

interface UseMediaLibraryPickerResult {
  /** Open the library modal. */
  open: () => void;
  /** Whether the user may browse (media.read); false → the field renders no picker. */
  canBrowse: boolean;
  /** The modal element to render next to the field (null when the user can't browse). */
  element: ReactNode;
}

/**
 * The reusable imperative bridge (U5/F9) any image field mounts to open the full media-library
 * modal (browse + folders + create-folder + upload) — mirrors `useStudioImagePicker`. Gated on
 * `media.read`: without it there's no affordance. Picking commits via `onPick` and closes.
 */
export function useMediaLibraryPicker({
  onPick,
}: UseMediaLibraryPickerArgs): UseMediaLibraryPickerResult {
  const canBrowse = useRequirePermission('media.read');
  const [open, setOpen] = useState(false);
  // Undefined when the field isn't inside a dialog (the Media page itself) — then the picker
  // renders a plain header with no breadcrumb, which is correct: there is nothing to go back to.
  const parentTitle = useParentDialogTitle();

  const element = canBrowse ? (
    <MediaLibraryModal
      open={open}
      onOpenChange={setOpen}
      parentTitle={parentTitle}
      onPick={(asset) => {
        onPick(asset);
        setOpen(false);
      }}
    />
  ) : null;

  return { open: () => setOpen(true), canBrowse, element };
}
