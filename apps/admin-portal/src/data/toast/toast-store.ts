import type { ToastOptions, ToastRecord } from './toast.types';

/** Default auto-dismiss window (ms) when a caller doesn't specify one. */
const DEFAULT_DURATION = 4000;
/** How many toasts render at once; the rest queue and promote as visible ones clear. */
const VISIBLE_LIMIT = 3;

type Listener = () => void;

/**
 * A headless toast store — a module-level singleton (mirrors `EventBus`) read in React via
 * `useSyncExternalStore`. Toasts carry non-serializable bits (action callbacks) and are
 * ephemeral UI, so they live here, NOT in the Redux store. The store owns auto-dismiss
 * timers (deterministic under fake timers) so the presentation layer stays dumb; Radix
 * only provides a11y + swipe. Exported as a class for per-test isolation + a singleton.
 */
export class ToastStore {
  private records: ToastRecord[] = [];
  private cachedSnapshot: ToastRecord[] = [];
  private readonly listeners = new Set<Listener>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private seq = 0;

  /** Raise a toast (or update the live one sharing its `dedupeKey`); returns its id. */
  add = (options: ToastOptions): string => {
    if (options.dedupeKey !== undefined) {
      const existing = this.records.find(
        (r) => r.dedupeKey === options.dedupeKey,
      );
      if (existing) {
        this.update(existing.id, options);
        return existing.id;
      }
    }
    const id = `toast-${++this.seq}`;
    const record: ToastRecord = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? 'info',
      duration: options.duration ?? DEFAULT_DURATION,
      dedupeKey: options.dedupeKey,
      action: options.action,
    };
    this.records = [...this.records, record];
    this.emit();
    return id;
  };

  /** Patch a live toast in place (used by `toast.promise` to flip loading → success/error). */
  update = (id: string, patch: Partial<ToastOptions>): void => {
    let changed = false;
    this.records = this.records.map((record) => {
      if (record.id !== id) {
        return record;
      }
      changed = true;
      return {
        ...record,
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        ...(patch.variant !== undefined ? { variant: patch.variant } : {}),
        ...(patch.duration !== undefined ? { duration: patch.duration } : {}),
        ...(patch.action !== undefined ? { action: patch.action } : {}),
      };
    });
    if (!changed) {
      return;
    }
    // Reset this toast's timer so a new `duration` takes effect (re-armed in `emit`).
    this.clearTimer(id);
    this.emit();
  };

  /** Remove a toast (auto-dismiss, Close button, swipe). Promotes a queued toast. */
  dismiss = (id: string): void => {
    this.remove(id);
  };

  /** Hard-remove a toast from the store. */
  remove = (id: string): void => {
    if (!this.records.some((record) => record.id === id)) {
      return;
    }
    this.records = this.records.filter((record) => record.id !== id);
    this.clearTimer(id);
    this.emit();
  };

  /** Clear every toast + timer (test isolation, and a global "dismiss all"). */
  reset = (): void => {
    for (const handle of this.timers.values()) {
      clearTimeout(handle);
    }
    this.timers.clear();
    this.records = [];
    this.emit();
  };

  /** The visible window (first `VISIBLE_LIMIT`), cached so the reference stays stable. */
  getSnapshot = (): ToastRecord[] => this.cachedSnapshot;

  /** Subscribe to changes; returns an unsubscribe function. */
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private clearTimer = (id: string): void => {
    const handle = this.timers.get(id);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.timers.delete(id);
    }
  };

  private emit = (): void => {
    this.cachedSnapshot = this.records.slice(0, VISIBLE_LIMIT);
    this.syncTimers();
    for (const listener of [...this.listeners]) {
      listener();
    }
  };

  /** Arm an auto-dismiss timer for each visible finite-duration toast; drop the rest. */
  private syncTimers = (): void => {
    const visibleIds = new Set(this.cachedSnapshot.map((record) => record.id));
    for (const id of [...this.timers.keys()]) {
      if (!visibleIds.has(id)) {
        this.clearTimer(id);
      }
    }
    for (const record of this.cachedSnapshot) {
      if (record.duration > 0 && !this.timers.has(record.id)) {
        this.timers.set(
          record.id,
          setTimeout(() => this.remove(record.id), record.duration),
        );
      }
    }
  };
}

/** The app-wide toast store singleton. */
export const toastStore = new ToastStore();
