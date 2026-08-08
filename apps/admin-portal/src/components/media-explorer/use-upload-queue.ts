import type { MediaAsset } from '@sanad/contracts';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useConfirmUploadMutation,
  useSignUploadMutation,
} from '../../data/media-manage.api';
import { toast } from '../../data/toast/use-toast';
import {
  classifyUploadError,
  formatUploadFailure,
  runMediaUpload,
} from '../../lib';

/**
 * Where one file is in its own upload. Every one of these is a state the tray RENDERS (U23) —
 * "waiting", "63%", "finishing", "done", and a failure that names its cause and offers a way on.
 * The old single `isUploading` boolean could say none of it: five files looked like one spinner,
 * and a file that failed halfway through a batch vanished without a word.
 */
export type UploadItemStatus =
  | 'queued'
  | 'uploading'
  | 'confirming'
  | 'done'
  | 'failed';

export interface UploadQueueItem {
  /** Client-side id — a File has no identity of its own and the same name can be queued twice. */
  id: string;
  name: string;
  size: number;
  /** Where this file is going; `null` is the library root. */
  folderId: string | null;
  status: UploadItemStatus;
  /** 0→1, meaningful while `uploading`. */
  progress: number;
  /** The id of the created asset, once confirmed. */
  assetId: string | null;
  /** The cause, in the user's words — never a bare status code. */
  error: string | null;
  /** Whether re-sending the same bytes could plausibly work (offline → yes; 413 → no). */
  retryable: boolean;
}

export interface UseUploadQueueResult {
  items: UploadQueueItem[];
  /** Anything still moving — drives the toolbar's busy affordance. */
  isUploading: boolean;
  doneCount: number;
  failedCount: number;
  enqueue: (files: FileList | File[], folderId: string | null) => void;
  retry: (id: string) => void;
  retryAll: () => void;
  dismiss: (id: string) => void;
  clearFinished: () => void;
}

interface UseUploadQueueArgs {
  /** Called for each asset that lands, so the explorer can refresh and auto-select it. */
  onUploaded?: (asset: MediaAsset) => void;
}

/**
 * The explorer's upload queue (U5): many files, one at a time, each with its own visible life.
 *
 * Uploads run **sequentially** on purpose — a presigned PUT streams the whole file, and five
 * parallel streams make every one of them slower and the progress unreadable. The queue is a plain
 * ref-mirrored list rather than RTK state because it is ephemeral UI truth (like a selection), and
 * because the pump must read the CURRENT list between awaits without waiting for a re-render.
 */
export function useUploadQueue({
  onUploaded,
}: UseUploadQueueArgs = {}): UseUploadQueueResult {
  const { t } = useTranslation('mediaExplorer');
  const [signUpload] = useSignUploadMutation();
  const [confirmUpload] = useConfirmUploadMutation();

  const [items, setItems] = useState<UploadQueueItem[]>([]);
  /** The list as the pump sees it — updated synchronously, unlike `items` between renders. */
  const itemsRef = useRef<UploadQueueItem[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const runningRef = useRef(false);
  const seqRef = useRef(0);

  const commit = useCallback((next: UploadQueueItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback(
    (id: string, changes: Partial<UploadQueueItem>) => {
      commit(
        itemsRef.current.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      );
    },
    [commit],
  );

  const uploadOne = useCallback(
    async (item: UploadQueueItem): Promise<boolean> => {
      const file = filesRef.current.get(item.id);
      if (!file) {
        // The bytes are gone (a retry after a reload) — say so rather than hang on `queued`.
        patch(item.id, {
          status: 'failed',
          error: t('errors.unknown'),
          retryable: false,
        });
        return false;
      }

      patch(item.id, { status: 'uploading', progress: 0, error: null });
      try {
        const asset = await runMediaUpload({
          sign: (request) => signUpload(request).unwrap(),
          confirm: (id, body) => confirmUpload({ id, body }).unwrap(),
          file,
          folderId: item.folderId ?? undefined,
          onStage: (stage) => {
            if (stage === 'confirming') {
              patch(item.id, { status: 'confirming', progress: 1 });
            }
          },
          onProgress: (ratio) => patch(item.id, { progress: ratio }),
        });
        patch(item.id, {
          status: 'done',
          progress: 1,
          assetId: asset.id,
          error: null,
        });
        onUploaded?.(asset);
        return true;
      } catch (caught) {
        const failure = classifyUploadError(caught);
        patch(item.id, {
          status: 'failed',
          error: formatUploadFailure(failure, (key) => t(key)),
          retryable: failure.retryable,
        });
        return false;
      }
    },
    [confirmUpload, onUploaded, patch, signUpload, t],
  );

  /**
   * Drain the queue. Re-entrant-safe: a second call while one is draining simply returns, because
   * the running pump will pick up anything that was added or re-queued behind it.
   */
  const pump = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    let failed = 0;
    let succeeded = 0;
    try {
      for (;;) {
        const next = itemsRef.current.find((item) => item.status === 'queued');
        if (!next) break;
        const ok = await uploadOne(next);
        if (ok) succeeded += 1;
        else failed += 1;
      }
    } finally {
      runningRef.current = false;
    }

    // ONE summary per batch, not one per file: the tray already lists each row, and a toast per
    // file in a ten-file drop would bury the very message it is meant to deliver (U23a).
    if (succeeded > 0) {
      toast.success(t('upload.success', { count: succeeded }));
    }
    if (failed > 0) {
      const firstError = itemsRef.current.find(
        (item) => item.status === 'failed' && item.error,
      )?.error;
      toast.error(firstError ?? t('errors.uploadFailed'));
    }
  }, [t, uploadOne]);

  const enqueue = useCallback(
    (files: FileList | File[], folderId: string | null) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      const added = list.map((file) => {
        seqRef.current += 1;
        const id = `upload-${seqRef.current}`;
        filesRef.current.set(id, file);
        return {
          id,
          name: file.name,
          size: file.size,
          folderId,
          status: 'queued' as const,
          progress: 0,
          assetId: null,
          error: null,
          retryable: false,
        };
      });
      commit([...itemsRef.current, ...added]);
      void pump();
    },
    [commit, pump],
  );

  const retry = useCallback(
    (id: string) => {
      patch(id, { status: 'queued', progress: 0, error: null });
      void pump();
    },
    [patch, pump],
  );

  const retryAll = useCallback(() => {
    commit(
      itemsRef.current.map((item) =>
        item.status === 'failed'
          ? { ...item, status: 'queued', progress: 0, error: null }
          : item,
      ),
    );
    void pump();
  }, [commit, pump]);

  const dismiss = useCallback(
    (id: string) => {
      filesRef.current.delete(id);
      commit(itemsRef.current.filter((item) => item.id !== id));
    },
    [commit],
  );

  const clearFinished = useCallback(() => {
    const kept = itemsRef.current.filter((item) => item.status !== 'done');
    for (const item of itemsRef.current) {
      if (item.status === 'done') filesRef.current.delete(item.id);
    }
    commit(kept);
  }, [commit]);

  return {
    items,
    isUploading: items.some(
      (item) =>
        item.status === 'queued' ||
        item.status === 'uploading' ||
        item.status === 'confirming',
    ),
    doneCount: items.filter((item) => item.status === 'done').length,
    failedCount: items.filter((item) => item.status === 'failed').length,
    enqueue,
    retry,
    retryAll,
    dismiss,
    clearFinished,
  };
}
