import { useSyncExternalStore } from 'react';
import { confirmStore } from '../../../data/confirm';
import { ConfirmationDialog } from './confirmation-dialog';

/**
 * The single confirmation host (W1 — mounted once in the app shell). Reads the active
 * confirmation from the store and wires its actions; call sites use `useConfirm()` and
 * never mount a dialog themselves.
 */
export function ConfirmationRoot() {
  const active = useSyncExternalStore(
    confirmStore.subscribe,
    confirmStore.getSnapshot,
  );
  if (!active) {
    return null;
  }
  return (
    <ConfirmationDialog
      open
      options={active.options}
      pending={active.pending}
      error={active.error}
      onConfirm={confirmStore.confirm}
      onCancel={confirmStore.cancel}
    />
  );
}
