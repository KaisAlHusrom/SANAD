import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Opens a record's editor when the URL carries `?edit=<id>` and that id is present in `rows` — the
 * deep-link target for the Content Studio's collection-cover affordance (a work/testimonial cover in
 * the preview links here). Fires `openEditor(row)` once per id, then strips the param so a refresh or
 * a modal-close doesn't reopen it. No-op when there's no `?edit` or the id isn't in the current list.
 */
export function useEditQueryParam<T>(
  rows: T[],
  getId: (row: T) => string,
  openEditor: (row: T) => void,
): void {
  const [params, setParams] = useSearchParams();
  const editId = params.get('edit');
  const openedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editId || openedRef.current === editId) return;
    const row = rows.find((item) => getId(item) === editId);
    if (!row) return;
    openedRef.current = editId;
    openEditor(row);
    const next = new URLSearchParams(params);
    next.delete('edit');
    setParams(next, { replace: true });
  }, [editId, rows, getId, openEditor, params, setParams]);
}
