export interface ConsentUiStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
  /** Constant: a dialog is never open on the server, and this value is shared across requests. */
  getServerSnapshot: () => false;
  open: () => void;
  close: () => void;
}

/**
 * Whether the preferences dialog is open — the one piece of state the "Cookie preferences" link
 * and the consent layer both need, from opposite ends of the tree.
 *
 * A module singleton read through `useSyncExternalStore`, mirroring `consentStore` and
 * `createCosmosScrollStore`: the website has no Redux, and React context is the wrong tool here —
 * the only provider high enough to cover both footers also covers the R3F canvas, so every open
 * and close would re-render the whole universe. A store re-renders its subscribers only.
 *
 * `consent-store.ts`'s warning about server-shared singletons does not apply: this value is
 * ephemeral browser UI state, mutated only from a click, and `getServerSnapshot` is a constant.
 */
export function createConsentUiStore(): ConsentUiStore {
  let open = false;
  const listeners = new Set<() => void>();

  const set = (next: boolean): void => {
    if (open === next) return;
    open = next;
    for (const listener of listeners) listener();
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => open,
    getServerSnapshot: () => false,
    open: () => set(true),
    close: () => set(false),
  };
}

export const consentUiStore = createConsentUiStore();
