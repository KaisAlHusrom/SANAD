'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TogglableConsentCategory } from '@sanad/contracts';
import { useConsent } from '../use-consent/use-consent';
import { useConsentUi } from '../use-consent-ui/use-consent-ui';
import type { ConsentDecision } from '../types/consent-state.types';

export interface ConsentPreferencesApi {
  draft: ConsentDecision;
  /** The browser refused to persist the last save; it holds for this tab only. */
  notStored: boolean;
  setCategory: (category: TogglableConsentCategory, next: boolean) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  save: () => void;
  withdraw: () => void;
}

const ALL = { analytics: true, marketing: true } as const;
const NONE = { analytics: false, marketing: false } as const;

/**
 * The preferences dialog's own state (U5), so the dialog body stays presentation.
 *
 * The draft is deliberately separate from the stored decision: a visitor flipping switches has not
 * consented to anything until they press save, and recording as they go would be recording a
 * choice they were still making.
 */
export function useConsentPreferences(): ConsentPreferencesApi {
  const { granted, decide, withdraw: withdrawConsent } = useConsent();
  const { dialogOpen, closeDialog } = useConsentUi();
  const [draft, setDraft] = useState<ConsentDecision>(NONE);
  const [notStored, setNotStored] = useState(false);

  // Re-seed on each OPEN, not once per mount: the layer keeps this mounted for the whole session,
  // so a visitor reopening after deciding must see what they actually chose, not a stale draft.
  //
  // Keyed on the open TRANSITION, not on `granted` — a successful save changes `granted` while the
  // dialog is still open, and re-running here would wipe the "we could not store this" notice the
  // save had just raised.
  const wasOpen = useRef(false);
  const grantedRef = useRef(granted);
  grantedRef.current = granted;

  useEffect(() => {
    if (dialogOpen && !wasOpen.current) {
      setDraft({
        analytics: grantedRef.current.analytics,
        marketing: grantedRef.current.marketing,
      });
      setNotStored(false);
    }
    wasOpen.current = dialogOpen;
  }, [dialogOpen]);

  const commit = useCallback(
    (decision: ConsentDecision) => {
      setDraft(decision);
      if (decide(decision)) {
        closeDialog();
        return;
      }
      // Stay open: the choice applies to this page view but will not survive the tab, and the
      // visitor is owed that rather than a promise the browser has already refused (U23).
      setNotStored(true);
    },
    [decide, closeDialog],
  );

  return {
    draft,
    notStored,
    setCategory: useCallback(
      (category, next) =>
        setDraft((current) => ({ ...current, [category]: next })),
      [],
    ),
    acceptAll: useCallback(() => commit(ALL), [commit]),
    rejectAll: useCallback(() => commit(NONE), [commit]),
    save: useCallback(() => commit(draft), [commit, draft]),
    withdraw: useCallback(() => {
      withdrawConsent();
      closeDialog();
    }, [withdrawConsent, closeDialog]),
  };
}
