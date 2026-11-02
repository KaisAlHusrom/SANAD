'use client';

import { useSyncExternalStore } from 'react';
import { consentUiStore } from '../consent-ui-store/consent-ui-store';

export interface ConsentUiApi {
  dialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

/**
 * Read/write the preferences dialog's open state from anywhere in the tree — the footer link that
 * opens it sits inside the landing finale, oceans away from the layer that renders it.
 */
export function useConsentUi(): ConsentUiApi {
  const dialogOpen = useSyncExternalStore(
    consentUiStore.subscribe,
    consentUiStore.getSnapshot,
    consentUiStore.getServerSnapshot,
  );

  return {
    dialogOpen,
    openDialog: consentUiStore.open,
    closeDialog: consentUiStore.close,
  };
}
