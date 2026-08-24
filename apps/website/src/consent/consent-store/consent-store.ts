import { CONSENT_STORAGE_KEY } from '../constants/consent.constants';
import {
  clearConsentRecord,
  readConsentRaw,
  writeConsentRecord,
} from '../consent-storage/consent-storage';
import { parseConsentRecord } from '../parse-consent-record/parse-consent-record';
import type { ConsentRecord } from '../types/consent-record.zod.types';

/**
 * The browser's stored decision as a `useSyncExternalStore` source. It holds the RECORD only,
 * never the verdict: the policy that turns a record into a verdict arrives per request through
 * React context, and a module singleton is shared across requests on the server (U30b's
 * discipline — a cache may never become a place state hides).
 *
 * Mirrors the cosmos scroll store's shape: a module-level singleton read through
 * `useSyncExternalStore`, not a Redux slice.
 */
class ConsentStore {
  private listeners = new Set<() => void>();
  private cached: ConsentRecord | null = null;
  /** `undefined` = never read. Distinct from `null`, which is a browser that stored nothing. */
  private cachedRaw: string | null | undefined = undefined;
  /**
   * A decision this browser refused to persist (private mode, quota). It is the most recent
   * answer by construction, so it wins — without it, accepting in such a browser is a click with
   * no outcome and the banner can never be dismissed (U23).
   */
  private unpersisted: ConsentRecord | null = null;
  private watching = false;

  /**
   * MUST return the same object until the stored text actually changes — React re-renders
   * forever otherwise, and the loop is silent until the tab locks up.
   *
   * Keyed on the raw string rather than on a "loaded" flag, so the answer can never drift from
   * what storage says (U30b). Re-parsing only when the text differs is what keeps the reference
   * stable; the `getItem` itself is far cheaper than the render it guards.
   */
  getSnapshot = (): ConsentRecord | null => {
    if (this.unpersisted) return this.unpersisted;

    const raw = readConsentRaw();
    if (raw !== this.cachedRaw) {
      this.cachedRaw = raw;
      this.cached = parseConsentRecord(raw);
    }
    return this.cached;
  };

  /** No browser storage exists during SSR or hydration, so nothing is decided yet. */
  getServerSnapshot = (): null => null;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    this.watch();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.unwatch();
    };
  };

  save = (record: ConsentRecord): void => {
    if (writeConsentRecord(record)) {
      this.unpersisted = null;
    } else {
      this.unpersisted = record;
      // A failed write can leave an OLDER record sitting in storage. Without this, the visitor's
      // change of mind holds for this page view and is then silently reverted by the superseded
      // decision on the next load — worse than being asked again.
      clearConsentRecord();
    }
    this.notify();
  };

  clear = (): void => {
    this.unpersisted = null;
    clearConsentRecord();
    this.notify();
  };

  /** Another tab decided; this one should agree without a reload. */
  private onStorage = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== CONSENT_STORAGE_KEY) return;
    // Another tab's write is newer information and storage is readable again, so the in-memory
    // fallback stops being the freshest answer.
    this.unpersisted = null;
    this.notify();
  };

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  private watch(): void {
    if (this.watching || typeof window === 'undefined') return;
    window.addEventListener('storage', this.onStorage);
    this.watching = true;
  }

  private unwatch(): void {
    if (!this.watching || typeof window === 'undefined') return;
    window.removeEventListener('storage', this.onStorage);
    this.watching = false;
  }
}

export const consentStore = new ConsentStore();
