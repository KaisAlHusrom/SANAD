import { confirmStore } from './confirm-store';
import type { ConfirmOptions } from './confirm.types';

interface UseConfirmResult {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

/**
 * The imperative confirmation trigger (W-kit): `const { confirm } = useConfirm()` then
 * `if (await confirm({ … })) { … }`. The single `ConfirmationRoot` renders the dialog;
 * call sites never mount one. `confirmStore.request` is stable, so the result is too.
 */
export function useConfirm(): UseConfirmResult {
  return { confirm: confirmStore.request };
}
