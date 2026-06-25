/** A toast's visual + semantic kind (drives icon + token color). */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

/** An optional inline action button (undo / retry). */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/** Caller-facing options for raising a toast (`title` required, the rest defaulted). */
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms; `0` persists until dismissed. */
  duration?: number;
  /** Collapse repeats: a new toast with a live `dedupeKey` updates the existing one. */
  dedupeKey?: string;
  action?: ToastAction;
}

/** A live toast in the store (options resolved to concrete values + a stable id). */
export interface ToastRecord {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  dedupeKey?: string;
  action?: ToastAction;
}
