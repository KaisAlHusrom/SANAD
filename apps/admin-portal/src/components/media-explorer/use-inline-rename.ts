import type { MediaFolderNode } from '@sanad/contracts';
import { useState } from 'react';
import type { UseFolderActionsResult } from './use-folder-actions';

export interface InlineRename {
  isRenaming: boolean;
  draft: string;
  setDraft: (value: string) => void;
  /** The clash reason (409) to show under the field, or null. */
  error: string | null;
  isBusy: boolean;
  start: () => void;
  cancel: () => void;
  submit: () => Promise<void>;
}

/**
 * Inline folder rename (U5), shared by the grid tile and the list row so a folder renames the
 * same way however it is shown (F9). A name clash comes back as `error` — rendered ON the field
 * the user is still editing, not as a toast that vanishes while the rejected name stays (U23a).
 * Renaming to the same name is a no-op, never a needless request.
 */
export function useInlineRename(
  node: MediaFolderNode,
  folders: UseFolderActionsResult,
): InlineRename {
  const [isRenaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(node.name);
  const [error, setError] = useState<string | null>(null);
  const isBusy = folders.busyId === node.id && folders.isBusy;

  const start = () => {
    setDraft(node.name);
    setError(null);
    setRenaming(true);
  };

  const cancel = () => {
    setRenaming(false);
    setError(null);
  };

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === node.name) {
      cancel();
      return;
    }
    const message = await folders.rename(node.id, trimmed);
    if (message) {
      setError(message);
      return;
    }
    cancel();
  };

  return { isRenaming, draft, setDraft, error, isBusy, start, cancel, submit };
}
