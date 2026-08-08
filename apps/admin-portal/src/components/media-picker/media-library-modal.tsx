import type { MediaAsset } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { MediaExplorer } from '../media-explorer';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogStackHeader,
} from '../ui/dialog';

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the chosen asset (the field decides url vs id) once the user confirms. */
  onPick: (asset: MediaAsset) => void;
  /**
   * The title of the surface this picker was opened FROM (e.g. "New project"), shown as the
   * first breadcrumb so a nested layer never reads as a replacement for its parent.
   */
  parentTitle?: string;
}

/**
 * The reusable media-library modal (F9): the FULL explorer — folders, drag-and-drop, upload —
 * openable from any form so the user never leaves it. All of its behaviour lives in
 * `MediaExplorer`; this file is the frame around it: a stacked header, and the two-step
 * Select → confirm footer that makes a misclick cheap.
 *
 * It takes the near-full-screen `full` size and a breadcrumb header, while `DialogContent`'s
 * stack tracking makes the form beneath it recede — the fix for "the picker appears above the
 * other modal with the same width and confuses the user" (owner, 2026-07-20). A file manager
 * squeezed into a form-sized box would have been the same mistake in a new place.
 *
 * Picking happens by clicking an image to see it full-screen and pressing "Use this image", or by
 * double-clicking it (owner, 2026-07-25: a click views the image, it doesn't just select it) —
 * so there is no dead "Select" button in the footer waiting on a selection that a click no longer
 * makes; only a way back out.
 */
export function MediaLibraryModal({
  open,
  onOpenChange,
  onPick,
  parentTitle,
}: MediaLibraryModalProps) {
  const { t } = useTranslation('common');

  const confirm = (asset: MediaAsset) => {
    onPick(asset);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="full"
        className="gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogStackHeader
          parentTitle={parentTitle}
          title={t('mediaPicker.title')}
          backLabel={t('actions.back')}
          onBack={() => onOpenChange(false)}
        />

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <MediaExplorer
            mode="picker"
            selectionMode="single"
            typeLock="image"
            enabled={open}
            // Clicking a file previews it; "Use this image" (or a double-click) is "this one".
            onActivate={confirm}
            className="border-0"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {t('actions.cancel')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
