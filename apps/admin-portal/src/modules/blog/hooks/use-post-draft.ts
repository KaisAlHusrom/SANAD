import { useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

const SAVE_DEBOUNCE_MS = 600;

interface UsePostDraftResult {
  /** A stored draft exists from a previous (unsubmitted) session for this key. */
  draftAvailable: boolean;
  /** Seed the form from the stored draft and dismiss the restore prompt. */
  restoreDraft: () => void;
  /** Delete the stored draft and dismiss the restore prompt (explicit "start fresh"). */
  discardDraft: () => void;
  /** Delete the stored draft without touching the form (call on successful submit). */
  clearDraft: () => void;
}

/**
 * Local autosave for the blog post editor (U21 — never lose in-progress content). Debounce-
 * persists the form values to `localStorage` under `key` while the form is dirty; on mount it
 * detects a previous unsaved draft and exposes a restore/discard prompt. Cleared on successful
 * submit. Values round-trip as JSON (cover = media id, body = HTML — all serializable).
 */
export function usePostDraft<TValues extends FieldValues>(
  key: string,
  form: UseFormReturn<TValues>,
): UsePostDraftResult {
  // Read any stored draft exactly once on mount (before the user starts typing over it).
  const storedRef = useRef<TValues | null>(null);
  const [draftAvailable, setDraftAvailable] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        storedRef.current = JSON.parse(raw) as TValues;
        setDraftAvailable(true);
      }
    } catch {
      // corrupt/inaccessible storage → no draft to offer
    }
    // mount-only: `key` is stable per editor instance
  }, []);

  // Debounced autosave. `watch` only fires on a value change (never on mount), and we persist
  // only once the values actually diverge from the initial snapshot — so a server prefill or a
  // same-value reset never writes a spurious draft (this is more reliable than RHF's `isDirty`,
  // whose proxy only updates when read during render).
  const initialJsonRef = useRef<string>('');
  useEffect(() => {
    initialJsonRef.current = JSON.stringify(form.getValues());
    // capture once per editor instance
  }, []);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        const json = JSON.stringify(values);
        if (json === initialJsonRef.current) {
          return;
        }
        try {
          localStorage.setItem(key, json);
        } catch {
          // storage full / unavailable — best-effort
        }
      }, SAVE_DEBOUNCE_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [form, key]);

  const clearDraft = (): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const restoreDraft = (): void => {
    if (storedRef.current) {
      form.reset(storedRef.current, { keepDefaultValues: true });
    }
    setDraftAvailable(false);
  };

  const discardDraft = (): void => {
    clearDraft();
    setDraftAvailable(false);
  };

  return { draftAvailable, restoreDraft, discardDraft, clearDraft };
}
