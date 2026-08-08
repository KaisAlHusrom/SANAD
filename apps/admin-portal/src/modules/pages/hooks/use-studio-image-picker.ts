import type { Locale, MediaAsset } from '@sanad/contracts';
import type { EditableFieldPath } from '@sanad/web-ui';
import { useState } from 'react';
import { useRequirePermission } from '../../../app/guards/use-require-permission';

interface UseStudioImagePickerArgs {
  /** Commit an image pick — the chosen asset id becomes the block's `imageMediaId` (locale-agnostic). */
  onCommit: (path: EditableFieldPath, value: string, locale: Locale) => void;
  /** The preview locale (passed through to `onCommit`; block images are locale-agnostic). */
  locale: Locale;
}

interface StudioImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (asset: MediaAsset) => void;
}

interface UseStudioImagePickerResult {
  /** Whether the user may browse the library (media.read). */
  canBrowse: boolean;
  /** The `EditContext.onPickImage` callback — undefined (no affordance) when the user can't browse. */
  onPickImage?: (path: EditableFieldPath) => void;
  /** Props for the shared `MediaLibraryModal`, opened imperatively when a frame is clicked. */
  dialog: StudioImageDialogProps;
}

/**
 * The Content Studio's imperative image picker (U5): the `EditableImage` affordance in the preview
 * calls `onPickImage(path)`, which opens the shared media-library modal — the FULL explorer, so
 * choosing a Studio image offers the same folders, search and upload as everywhere else (F9).
 * Picking an asset commits its id to the block's `imageMediaId` via the injected `onCommit`, then
 * closes. Gated on `media.read`; without it there is no affordance at all.
 *
 * The hook owns no data of its own — the explorer inside the modal fetches, and only while it is
 * open (F5).
 */
export function useStudioImagePicker({
  onCommit,
  locale,
}: UseStudioImagePickerArgs): UseStudioImagePickerResult {
  const canBrowse = useRequirePermission('media.read');
  const [pendingPath, setPendingPath] = useState<EditableFieldPath | null>(
    null,
  );

  const onPick = (asset: MediaAsset): void => {
    if (pendingPath) onCommit(pendingPath, asset.id, locale);
    setPendingPath(null);
  };

  return {
    canBrowse,
    onPickImage: canBrowse ? (path) => setPendingPath(path) : undefined,
    dialog: {
      open: pendingPath !== null,
      onOpenChange: (next) => {
        if (!next) setPendingPath(null);
      },
      onPick,
    },
  };
}
