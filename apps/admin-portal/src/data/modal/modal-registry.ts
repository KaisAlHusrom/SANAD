import type { ComponentType } from 'react';

/** Props every registered modal component receives from the `GlobalModalManager`. */
export interface ModalComponentProps {
  open: boolean;
  onClose: () => void;
  data: Record<string, unknown>;
  type: string;
}

/** A registry entry — a component that serves one or more modal `types` (e.g. add + edit). */
export interface ModalEntry {
  component: ComponentType<ModalComponentProps>;
  types: string[];
}

const entries = new Map<string, ModalEntry>();

/**
 * Register a modal entry for global rendering (W7). Each module declares its modals in a
 * `modals.config.ts` registered at import (mirrors the api registry). Idempotent per type —
 * re-registering a type replaces it.
 */
export function registerModal(entry: ModalEntry): void {
  for (const type of entry.types) {
    entries.set(type, entry);
  }
}

/** The entry that serves a given modal `type`, or `undefined` if none is registered. */
export function findModal(type: string): ModalEntry | undefined {
  return entries.get(type);
}

/** Clear all registered modals (test isolation). */
export function clearModals(): void {
  entries.clear();
}
