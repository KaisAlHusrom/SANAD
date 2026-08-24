import type { MediaAsset } from '@sanad/contracts';
import { ChevronLeft, Download, FileText, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../../providers/direction/use-direction';
import { formatBytes } from '../../lib/format/bytes';
import { Button } from '../ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '../ui/dialog';

interface AssetPreviewProps {
  /** The file to show; `null` keeps the lightbox closed. */
  asset: MediaAsset | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onDownload: (asset: MediaAsset) => void;
  /** Picker only: "Use this image" — present ⇒ the picker's choose action is shown. */
  onChoose?: (asset: MediaAsset) => void;
  /** Page + manager only: delete this file straight from the preview. */
  onDelete?: (asset: MediaAsset) => void;
}

/**
 * The full-screen view a plain click opens (owner, 2026-07-25) — the file at its real size instead
 * of a thumbnail, with the neighbours one arrow-key away. It is where a picker's "Use this image"
 * lives too, so choosing a file means seeing it big first.
 *
 * It is a `full`-size dialog: opened over the picker it stacks one level up and the picker recedes
 * (dialog-stack), so the preview reads as ON TOP of the library, never as a replacement for it.
 */
export function AssetPreview({
  asset,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onDownload,
  onChoose,
  onDelete,
}: AssetPreviewProps) {
  const { t } = useTranslation('mediaExplorer');
  const { locale } = useDirection();
  const isImage = asset?.mimeType.startsWith('image/') ?? false;

  return (
    <Dialog open={asset !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="full"
        className="gap-0 overflow-hidden p-0"
        onKeyDown={(event) => {
          // Arrow keys page through the folder — mirrored, so in RTL "next" is the LEFT arrow.
          const forward = locale === 'ar' ? 'ArrowLeft' : 'ArrowRight';
          const back = locale === 'ar' ? 'ArrowRight' : 'ArrowLeft';
          if (event.key === forward && hasNext) onNext();
          if (event.key === back && hasPrev) onPrev();
        }}
      >
        {asset ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-2 px-4 py-3">
              <DialogTitle
                className="min-w-0 truncate text-sm font-medium text-text"
                dir="ltr"
              >
                {asset.filename}
              </DialogTitle>
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label={t('preview.close')}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-dim transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </DialogClose>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-surface-2 p-4">
              {isImage ? (
                <img
                  src={asset.url}
                  alt={asset.alt.en || asset.filename}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <FileText className="size-20 text-faint" aria-hidden="true" />
              )}

              {hasPrev ? (
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label={t('preview.prev')}
                  className="absolute start-4 inline-flex size-10 items-center justify-center rounded-full border border-border-2 bg-veil-surface text-text shadow-portal backdrop-blur transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
                >
                  <ChevronLeft
                    className="size-5 rtl:rotate-180"
                    aria-hidden="true"
                  />
                </button>
              ) : null}
              {hasNext ? (
                <button
                  type="button"
                  onClick={onNext}
                  aria-label={t('preview.next')}
                  className="absolute end-4 inline-flex size-10 items-center justify-center rounded-full border border-border-2 bg-veil-surface text-text shadow-portal backdrop-blur transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
                >
                  <ChevronLeft
                    className="size-5 rotate-180 rtl:rotate-0"
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border-2 px-4 py-3">
              <span className="text-xs text-faint">
                {formatBytes(asset.size, locale)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownload(asset)}
                >
                  <Download className="size-4" aria-hidden="true" />
                  {t('asset.download')}
                </Button>
                {onDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-bad hover:text-bad"
                    onClick={() => onDelete(asset)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    {t('asset.delete')}
                  </Button>
                ) : null}
                {onChoose ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onChoose(asset)}
                  >
                    {t('preview.select')}
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
