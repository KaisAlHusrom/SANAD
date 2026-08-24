import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_STORAGE_KEY } from '../constants/consent.constants';
import type { ConsentRecord } from '../types/consent-record.zod.types';
import {
  clearConsentRecord,
  readConsentRecord,
  writeConsentRecord,
} from './consent-storage';

const record: ConsentRecord = {
  v: 1,
  policyVersion: 3,
  decidedAt: 1_700_000_000_000,
  analytics: false,
  marketing: true,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('consent storage', () => {
  it('round-trips a decision', () => {
    expect(writeConsentRecord(record)).toBe(true);
    expect(readConsentRecord()).toEqual(record);
  });

  it('reads nothing from a browser that has never decided', () => {
    expect(readConsentRecord()).toBeNull();
  });

  it('forgets a decision on clear', () => {
    writeConsentRecord(record);
    clearConsentRecord();

    expect(readConsentRecord()).toBeNull();
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('re-asks rather than crashing on a corrupted value', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, '{{{');

    expect(readConsentRecord()).toBeNull();
  });

  describe('when the browser refuses storage entirely', () => {
    // Safari's private mode throws on BOTH getItem and setItem rather than returning null, and
    // an unhandled throw here would take down the page before anything renders.
    it('reads null instead of throwing', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(() => readConsentRecord()).not.toThrow();
      expect(readConsentRecord()).toBeNull();
    });

    it('reports a failed write instead of throwing OR pretending', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(writeConsentRecord(record)).toBe(false);
    });

    it('reports a failed clear instead of throwing', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(clearConsentRecord()).toBe(false);
    });
  });

  describe('on the server', () => {
    it('reads null and writes nothing, with no window to reach for', () => {
      vi.stubGlobal('window', undefined);

      expect(readConsentRecord()).toBeNull();
      expect(writeConsentRecord(record)).toBe(false);
      expect(clearConsentRecord()).toBe(false);
    });
  });
});
