/** A confirmation's tone (drives icon + token color). */
export type ConfirmTone = 'danger' | 'warning' | 'info';

/** Caller-facing options for an imperative confirmation. */
export interface ConfirmOptions {
  title: string;
  message: string;
  subMessage?: string;
  variant?: ConfirmTone;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Optional mutation-aware mode: run while the dialog shows a loading state. If it throws,
   * the dialog stays open and surfaces the error; otherwise it resolves the confirmation.
   */
  onConfirm?: () => Promise<void>;
}

/** The confirmation currently shown (read by `ConfirmationRoot`). */
export interface ActiveConfirm {
  options: ConfirmOptions;
  pending: boolean;
  error?: string;
}
