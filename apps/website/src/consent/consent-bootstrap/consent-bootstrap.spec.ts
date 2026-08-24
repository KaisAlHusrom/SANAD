import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_REMEMBER_DAYS_DEFAULT,
  DEFAULT_TRACKING_CONFIG,
  type PublicConsentPolicy,
} from '@sanad/contracts';
import {
  CONSENT_STATUS_ATTRIBUTE,
  CONSENT_STORAGE_KEY,
  MS_PER_DAY,
} from '../constants/consent.constants';
import type { ConsentRecord } from '../types/consent-record.zod.types';
import type { ConsentSignals } from '../types/consent-mode.types';
import { evaluateConsent } from '../evaluate-consent/evaluate-consent';
import { parseConsentRecord } from '../parse-consent-record/parse-consent-record';
import { consentBootstrapScript } from './consent-bootstrap';

const NOW = 1_700_000_000_000;

const policy = (
  over: Partial<PublicConsentPolicy> = {},
): PublicConsentPolicy => ({
  ...DEFAULT_TRACKING_CONFIG.consent,
  ...over,
});

const record = (over: Partial<ConsentRecord> = {}): ConsentRecord => ({
  v: 1,
  policyVersion: DEFAULT_TRACKING_CONFIG.consent.policyVersion,
  decidedAt: NOW,
  analytics: true,
  marketing: true,
  ...over,
});

type ConsentCall = ['consent', 'default' | 'update', ConsentSignals];

/** Run the generated source exactly as the browser would, then read what it did. */
function boot(over: Partial<PublicConsentPolicy> = {}): {
  status: string | null;
  calls: ConsentCall[];
} {
  // Execute the REAL generated source, exactly as the browser would.
  new Function(consentBootstrapScript(policy(over)))();

  return {
    status: document.documentElement.getAttribute(CONSENT_STATUS_ATTRIBUTE),
    calls: (window.dataLayer ?? []).map(
      (entry) => Array.from(entry) as ConsentCall,
    ),
  };
}

const store = (value: ConsentRecord | string) =>
  window.localStorage.setItem(
    CONSENT_STORAGE_KEY,
    typeof value === 'string' ? value : JSON.stringify(value),
  );

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  delete window.dataLayer;
  delete window.gtag;
  document.documentElement.removeAttribute(CONSENT_STATUS_ATTRIBUTE);
});

describe('the consent bootstrap script', () => {
  it('denies every gated signal before anything else can ask', () => {
    const { calls } = boot();
    const first = calls[0];

    expect(first?.[0]).toBe('consent');
    expect(first?.[1]).toBe('default');
    expect(first?.[2]).toMatchObject({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    });
  });

  it('holds a tag briefly so a restored decision can arrive first', () => {
    expect(boot().calls[0]?.[2]).toHaveProperty('wait_for_update');
  });

  it('leaves a working dataLayer and gtag for the tag layer to use', () => {
    boot();

    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(typeof window.gtag).toBe('function');
  });

  it('is emitted even with nothing configured — deny-first must not depend on a vendor', () => {
    expect(DEFAULT_TRACKING_CONFIG.destinations).toHaveLength(0);
    expect(boot().calls[0]?.[1]).toBe('default');
  });

  describe('a browser that has never decided', () => {
    it('is marked pending and granted nothing', () => {
      const { status, calls } = boot();

      expect(status).toBe('pending');
      expect(calls).toHaveLength(1);
    });
  });

  describe('a browser with a valid decision', () => {
    it('restores analytics alone without touching the ad signals', () => {
      store(record({ analytics: true, marketing: false }));
      const { status, calls } = boot();

      expect(status).toBe('decided');
      expect(calls[1]?.[1]).toBe('update');
      expect(calls[1]?.[2]).toEqual({ analytics_storage: 'granted' });
    });

    it('restores all three v2 ad signals for marketing', () => {
      store(record({ analytics: false, marketing: true }));

      expect(boot().calls[1]?.[2]).toEqual({
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    });

    it('says nothing extra when the visitor refused everything', () => {
      store(record({ analytics: false, marketing: false }));
      const { status, calls } = boot();

      expect(status).toBe('decided');
      expect(calls).toHaveLength(1);
    });
  });

  describe('agrees with evaluateConsent on every re-ask', () => {
    // The script re-implements `parseConsentRecord` + `evaluateConsent` inline, so this table
    // runs BOTH over the same stored text and asserts they land on the same verdict — never
    // against a hardcoded expectation, which is how the first two rows below slipped through an
    // earlier draft. Add a row here for every field the record ever gains.
    it.each<[string, string, Partial<PublicConsentPolicy>]>([
      ['a decision this browser just made', JSON.stringify(record()), {}],
      [
        'an unknown extra key — a shape from a build we do not understand',
        JSON.stringify({ ...record(), preferences: true }),
        {},
      ],
      [
        'a fractional timestamp',
        JSON.stringify(record({ decidedAt: NOW - 0.5 })),
        {},
      ],
      ['a zero timestamp', JSON.stringify({ ...record(), decidedAt: 0 }), {}],
      [
        'a missing category',
        JSON.stringify({ ...record(), marketing: undefined }),
        {},
      ],
      [
        'a bumped policy version',
        JSON.stringify(record({ policyVersion: 1 })),
        { policyVersion: 2 },
      ],
      [
        'a rolled-back policy version',
        JSON.stringify(record({ policyVersion: 9 })),
        { policyVersion: 2 },
      ],
      [
        'a decision past rememberDays',
        JSON.stringify(
          record({
            decidedAt: NOW - CONSENT_REMEMBER_DAYS_DEFAULT * MS_PER_DAY,
          }),
        ),
        {},
      ],
      [
        'a decision one millisecond before it expires',
        JSON.stringify(
          record({
            decidedAt: NOW - CONSENT_REMEMBER_DAYS_DEFAULT * MS_PER_DAY + 1,
          }),
        ),
        {},
      ],
      ['an unknown shape version', JSON.stringify({ ...record(), v: 2 }), {}],
      ['text that is not JSON', '{{{ nope', {}],
      ['a JSON array', JSON.stringify([record()]), {}],
    ])('agrees on %s', (_label, raw, over) => {
      store(raw);
      const expected = evaluateConsent(
        parseConsentRecord(raw),
        policy(over),
        NOW,
      );
      const { status, calls } = boot(over);

      expect(status).toBe(expected.status);
      // A grant may only be restored for a record the React path also honours.
      const restored = calls.length > 1 ? calls[1]?.[2] : {};
      expect(restored?.analytics_storage === 'granted').toBe(
        expected.granted.analytics,
      );
      expect(restored?.ad_storage === 'granted').toBe(
        expected.granted.marketing,
      );
    });
  });

  describe('when the banner is switched off', () => {
    it('marks the page not-required and grants nothing, over a stored grant', () => {
      store(record({ analytics: true, marketing: true }));
      const { status, calls } = boot({ bannerEnabled: false });

      expect(status).toBe('not-required');
      expect(calls).toHaveLength(1);
      expect(calls[0]?.[2]).toMatchObject({ analytics_storage: 'denied' });
    });
  });

  describe('degraded browsers', () => {
    it('still denies and still stamps when the stored value is corrupt', () => {
      store('{{{ not json');
      const { status, calls } = boot();

      expect(status).toBe('pending');
      expect(calls).toHaveLength(1);
    });

    it('still denies and still stamps when storage itself throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const { status, calls } = boot();

      expect(status).toBe('pending');
      expect(calls[0]?.[1]).toBe('default');
    });
  });

  it('cannot break out of the script element that carries it', () => {
    const source = consentBootstrapScript(
      policy({ policyVersion: 7, rememberDays: 30 }),
    );

    expect(source).not.toContain('</script');
    expect(source).not.toContain('<!--');
  });

  it('leaks no identifier beyond the two the tag layer needs', () => {
    const before = new Set(Object.keys(window));
    boot();
    const added = [...Object.keys(window)].filter((key) => !before.has(key));

    expect(added.sort()).toEqual(['dataLayer', 'gtag']);
  });
});
