import { describe, expect, it, vi } from 'vitest';
import { createConsentUiStore, consentUiStore } from './consent-ui-store';

describe('createConsentUiStore', () => {
  it('starts closed, and reports closed on the server', () => {
    const store = createConsentUiStore();
    expect(store.getSnapshot()).toBe(false);
    expect(store.getServerSnapshot()).toBe(false);
  });

  it('opens and closes, notifying subscribers on each real change', () => {
    const store = createConsentUiStore();
    const seen = vi.fn();
    const unsubscribe = store.subscribe(seen);

    store.open();
    expect(store.getSnapshot()).toBe(true);
    expect(seen).toHaveBeenCalledTimes(1);

    // Opening an already-open dialog is not a change; re-notifying would re-render every
    // subscriber for nothing.
    store.open();
    expect(seen).toHaveBeenCalledTimes(1);

    store.close();
    expect(store.getSnapshot()).toBe(false);
    expect(seen).toHaveBeenCalledTimes(2);

    store.close();
    expect(seen).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.open();
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it('reaches every subscriber, which is the point — the footer button and the layer are far apart', () => {
    const store = createConsentUiStore();
    const footer = vi.fn();
    const layer = vi.fn();
    store.subscribe(footer);
    store.subscribe(layer);

    store.open();

    expect(footer).toHaveBeenCalledTimes(1);
    expect(layer).toHaveBeenCalledTimes(1);
  });
});

describe('consentUiStore', () => {
  it('is the shared singleton both surfaces read', () => {
    expect(consentUiStore.getSnapshot()).toBe(false);
    consentUiStore.open();
    expect(consentUiStore.getSnapshot()).toBe(true);
    consentUiStore.close();
    expect(consentUiStore.getSnapshot()).toBe(false);
  });
});
