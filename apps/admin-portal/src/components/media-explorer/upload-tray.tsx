import { AlertCircle, Check, ChevronDown, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { Button } from '../ui/button';
import type { UploadQueueItem, UseUploadQueueResult } from './use-upload-queue';

/**
 * The upload tray: one row per file, each showing exactly where it is — waiting, a real
 * percentage, finishing, done, or failed with the reason and (where it can help) a retry.
 *
 * This component exists because of the owner's report that an upload which failed inside a modal
 * did nothing at all — no spinner, no message, no clue (U23b). A tray cannot be "forgotten by the
 * caller": as long as anything has been queued, its outcome is on screen.
 */
export function UploadTray({ queue }: { queue: UseUploadQueueResult }) {
  const { t } = useTranslation('mediaExplorer');
  const [isCollapsed, setCollapsed] = useState(false);

  if (queue.items.length === 0) return null;

  const total = queue.items.length;
  const done = queue.doneCount;
  const failed = queue.failedCount;

  return (
    <section
      aria-label={t('upload.trayTitle')}
      className="rounded-card border border-border-2 bg-surface"
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="text-sm font-medium text-text">
          {t('upload.trayTitle')}
        </span>
        <span className="text-xs text-dim">
          {t('upload.trayProgress', { done, total })}
        </span>
        {failed > 0 ? (
          <span className="text-xs text-bad">
            {t('upload.trayFailed', { count: failed })}
          </span>
        ) : null}

        <div className="ms-auto flex items-center gap-1">
          {failed > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={queue.retryAll}
            >
              {t('upload.retryAll')}
            </Button>
          ) : null}
          {done > 0 && !queue.isUploading ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={queue.clearFinished}
            >
              {t('upload.clearDone')}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? t('upload.expand') : t('upload.collapse')}
            className="inline-flex size-7 items-center justify-center rounded-xs text-faint transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
          >
            {/* Vertical glyph → no RTL flip needed (U7). */}
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                isCollapsed && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {isCollapsed ? null : (
        <ul className="scroll-area max-h-48 overflow-y-auto border-t border-border-2">
          {queue.items.map((item) => (
            <UploadRow
              key={item.id}
              item={item}
              onRetry={() => queue.retry(item.id)}
              onDismiss={() => queue.dismiss(item.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function UploadRow({
  item,
  onRetry,
  onDismiss,
}: {
  item: UploadQueueItem;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('mediaExplorer');
  const percent = Math.round(item.progress * 100);

  return (
    <li className="flex items-center gap-3 border-b border-border-2 px-3 py-2 last:border-b-0">
      <StatusIcon status={item.status} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-text" dir="ltr" title={item.name}>
          {item.name}
        </div>
        {item.status === 'failed' ? (
          <p role="alert" className="text-xs text-bad">
            {item.error}
          </p>
        ) : (
          <p className="text-xs text-dim">
            {item.status === 'queued' ? t('upload.queued') : null}
            {item.status === 'uploading'
              ? t('upload.uploading', { percent })
              : null}
            {item.status === 'confirming' ? t('upload.confirming') : null}
            {item.status === 'done' ? t('upload.done') : null}
          </p>
        )}
        {item.status === 'uploading' ? (
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-1 h-1 w-full overflow-hidden rounded-pill bg-surface-2"
          >
            {/* A live percentage — a genuine computed value, not a design token (U6 carve-out). */}
            <div
              className="h-full bg-accent transition-[width]"
              style={{ inlineSize: `${percent}%` }}
            />
          </div>
        ) : null}
      </div>

      {item.status === 'failed' && item.retryable ? (
        <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
          {t('upload.retry')}
        </Button>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('upload.dismiss')}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-xs text-faint transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-line"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

function StatusIcon({ status }: { status: UploadQueueItem['status'] }) {
  if (status === 'failed') {
    return (
      <AlertCircle className="size-4 shrink-0 text-bad" aria-hidden="true" />
    );
  }
  if (status === 'done') {
    return <Check className="size-4 shrink-0 text-good" aria-hidden="true" />;
  }
  if (status === 'queued') {
    return <span className="size-4 shrink-0" aria-hidden="true" />;
  }
  return (
    <Loader2
      className="size-4 shrink-0 animate-spin text-accent"
      aria-hidden="true"
    />
  );
}
