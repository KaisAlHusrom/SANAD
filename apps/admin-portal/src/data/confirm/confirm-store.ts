import type { ActiveConfirm, ConfirmOptions } from './confirm.types';

type Listener = () => void;

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
  pending: boolean;
  error?: string;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * A headless confirmation store — a module-level singleton (mirrors `EventBus`) read in
 * React via `useSyncExternalStore`. A confirmation carries a non-serializable `resolve` +
 * `onConfirm`, so it lives here, NOT in the Redux modal slice. `request()` returns a
 * `Promise<boolean>` that callers await inline. Exported as a class for per-test isolation
 * plus a singleton.
 */
export class ConfirmStore {
  private active: PendingConfirm | null = null;
  private snapshot: ActiveConfirm | null = null;
  private readonly listeners = new Set<Listener>();

  /** Open a confirmation; resolves `true` on confirm, `false` on cancel/replace/reset. */
  request = (options: ConfirmOptions): Promise<boolean> => {
    if (this.active) {
      // Replacing an open confirmation cancels the previous one.
      this.active.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      this.active = { options, resolve, pending: false };
      this.emit();
    });
  };

  /** Confirm the active request. Mutation-aware: runs `onConfirm`, staying open on error. */
  confirm = async (): Promise<void> => {
    const current = this.active;
    if (!current) {
      return;
    }
    if (!current.options.onConfirm) {
      this.active = null;
      this.emit();
      current.resolve(true);
      return;
    }
    this.active = { ...current, pending: true, error: undefined };
    this.emit();
    try {
      await current.options.onConfirm();
      this.active = null;
      this.emit();
      current.resolve(true);
    } catch (error) {
      // Stay open so the user can retry or cancel; surface the error inline.
      if (this.active) {
        this.active = {
          ...this.active,
          pending: false,
          error: messageOf(error),
        };
        this.emit();
      }
    }
  };

  /** Cancel the active request (resolves `false`). */
  cancel = (): void => {
    const current = this.active;
    if (!current) {
      return;
    }
    this.active = null;
    this.emit();
    current.resolve(false);
  };

  /** Clear any active confirmation, resolving it `false` so awaiters never deadlock. */
  reset = (): void => {
    this.cancel();
  };

  getSnapshot = (): ActiveConfirm | null => this.snapshot;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit = (): void => {
    this.snapshot = this.active
      ? {
          options: this.active.options,
          pending: this.active.pending,
          error: this.active.error,
        }
      : null;
    for (const listener of [...this.listeners]) {
      listener();
    }
  };
}

/** The app-wide confirmation store singleton. */
export const confirmStore = new ConfirmStore();
