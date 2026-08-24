import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_STORAGE_KEY } from '../constants/consent.constants';
import type { ConsentRecord } from '../types/consent-record.zod.types';
import { consentStore } from './consent-store';

const record = (over: Partial<ConsentRecord> = {}): ConsentRecord => ({
  v: 1,
  policyVersion: 1,
  decidedAt: 1_700_000_000_000,
  analytics: true,
  marketing: false,
  ...over,
});

/** Another tab wrote a decision: jsdom never fires this itself, so we play the browser. */
function otherTabWrote(value: ConsentRecord | null, key = CONSENT_STORAGE_KEY) {
  const newValue = value === null ? null : JSON.stringify(value);
  if (newValue === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, newValue);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
}

afterEach(() => {
  window.localStorage.clear();
  consentStore.clear();
  vi.restoreAllMocks();
});

describe('consentStore', () => {
  it('returns the SAME snapshot object until something changes', () => {
    consentStore.save(record());

    // React tears down into an infinite render loop if this is a fresh object each call.
    expect(consentStore.getSnapshot()).toBe(consentStore.getSnapshot());
  });

  it('renders nothing on the server, whatever a previous request left behind', () => {
    consentStore.save(record());

    expect(consentStore.getServerSnapshot()).toBeNull();
  });

  it('reads a decision the browser was already carrying', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record()));

    expect(consentStore.getSnapshot()).toEqual(record());
  });

  it('never serves an answer storage has stopped agreeing with', () => {
    // The cache is keyed on the stored TEXT, not on a "loaded" flag: an earlier read that found
    // nothing must not be able to outlive the write that followed it (U30b). An earlier draft
    // cached the flag and this is exactly what it got wrong.
    expect(consentStore.getSnapshot()).toBeNull();

    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record()));
    expect(consentStore.getSnapshot()).toEqual(record());

    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    expect(consentStore.getSnapshot()).toBeNull();
  });

  describe('saving', () => {
    it('persists the decision and hands out a new snapshot', () => {
      const before = consentStore.getSnapshot();
      consentStore.save(record({ marketing: true }));

      expect(before).toBeNull();
      expect(consentStore.getSnapshot()?.marketing).toBe(true);
      expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toContain(
        '"marketing":true',
      );
    });

    it('tells every subscriber exactly once', () => {
      const first = vi.fn();
      const second = vi.fn();
      consentStore.subscribe(first);
      consentStore.subscribe(second);

      consentStore.save(record());

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearing', () => {
    it('forgets the decision and notifies', () => {
      consentStore.save(record());
      const listener = vi.fn();
      consentStore.subscribe(listener);

      consentStore.clear();

      expect(consentStore.getSnapshot()).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the browser refuses to persist', () => {
    it('keeps the decision in memory so it still applies to this page view', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      consentStore.save(record({ marketing: true }));

      expect(consentStore.getSnapshot()?.marketing).toBe(true);
      expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    });

    it('does not let a superseded decision resurface on the next load', () => {
      window.localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(record({ analytics: true, marketing: true })),
      );
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      consentStore.save(record({ analytics: false, marketing: false }));

      // The new answer holds now, and the OLD one is gone — the next load re-asks rather than
      // silently reinstating the decision the visitor just changed.
      expect(consentStore.getSnapshot()?.analytics).toBe(false);
      expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    });

    it('lets a withdrawal drop the in-memory decision too', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      consentStore.save(record());

      consentStore.clear();

      expect(consentStore.getSnapshot()).toBeNull();
    });

    it('stands aside once another tab writes a real decision', () => {
      const setItem = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });
      consentStore.save(record({ analytics: true, marketing: true }));
      setItem.mockRestore();

      otherTabWrote(record({ analytics: false, marketing: false }));

      expect(consentStore.getSnapshot()?.analytics).toBe(false);
    });
  });

  describe('another tab', () => {
    it('follows a decision made somewhere else', () => {
      const listener = vi.fn();
      consentStore.subscribe(listener);

      otherTabWrote(record({ analytics: false, marketing: true }));

      expect(listener).toHaveBeenCalledTimes(1);
      expect(consentStore.getSnapshot()?.marketing).toBe(true);
    });

    it('follows a withdrawal made somewhere else', () => {
      consentStore.save(record());
      otherTabWrote(null);

      expect(consentStore.getSnapshot()).toBeNull();
    });

    it('ignores an unrelated key', () => {
      const listener = vi.fn();
      consentStore.subscribe(listener);

      otherTabWrote(record(), 'sanad-sound');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribing', () => {
    it('stops the listener and stops listening to the browser', () => {
      const listener = vi.fn();
      const unsubscribe = consentStore.subscribe(listener);
      unsubscribe();

      consentStore.save(record());
      otherTabWrote(record({ marketing: true }));

      expect(listener).not.toHaveBeenCalled();
    });

    it('keeps following storage while any subscriber remains', () => {
      const staying = vi.fn();
      const leaving = vi.fn();
      consentStore.subscribe(staying);
      consentStore.subscribe(leaving)();

      otherTabWrote(record());

      expect(staying).toHaveBeenCalledTimes(1);
      expect(leaving).not.toHaveBeenCalled();
    });
  });
});
