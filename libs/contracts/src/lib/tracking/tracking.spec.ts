import { describe, expect, it } from 'vitest';
import {
  CONSENT_CATEGORIES,
  TOGGLABLE_CONSENT_CATEGORIES,
  consentCategorySchema,
} from './consent-category.js';
import {
  TRACKING_DESTINATIONS,
  matchingDestinationIds,
  trackingDestination,
  trackingDestinationIdSchema,
  trackingDestinationSettingKeys,
} from './tracking-destination.js';
import {
  CONSENT_POLICY_VERSION_BOUNDS,
  CONSENT_REMEMBER_DAYS_BOUNDS,
  CONSENT_REMEMBER_DAYS_DEFAULT,
  CONSENT_SETTING_KEYS,
  POLICY_PATH_PATTERN,
  TRACKING_GROUP,
  TRACKING_SECTION_CONSENT,
  TRACKING_SECTION_DESTINATIONS,
} from './tracking-settings.js';
import { DEFAULT_TRACKING_CONFIG } from './tracking-config.defaults.js';

describe('consent categories', () => {
  it('offers exactly necessary, analytics and marketing', () => {
    expect(CONSENT_CATEGORIES).toEqual(['necessary', 'analytics', 'marketing']);
  });

  // `necessary` is what the site cannot function without — showing it as a switch would
  // promise a choice the product cannot honour.
  it('never offers `necessary` as a toggle', () => {
    expect(TOGGLABLE_CONSENT_CATEGORIES).not.toContain('necessary');
    expect([...TOGGLABLE_CONSENT_CATEGORIES]).toEqual(
      CONSENT_CATEGORIES.filter((category) => category !== 'necessary'),
    );
  });

  it('rejects a category the banner cannot render', () => {
    expect(consentCategorySchema.safeParse('everything').success).toBe(false);
  });
});

describe('tracking destinations', () => {
  it('declares every destination the launch pack ships', () => {
    expect(TRACKING_DESTINATIONS.map((d) => d.id)).toEqual([
      'ga4',
      'gtm',
      'metaPixel',
      'snapPixel',
      'tiktokPixel',
    ]);
  });

  it('keys the enum off the same list, so neither can drift', () => {
    for (const destination of TRACKING_DESTINATIONS) {
      expect(
        trackingDestinationIdSchema.safeParse(destination.id).success,
      ).toBe(true);
    }
    expect(trackingDestinationIdSchema.options).toHaveLength(
      TRACKING_DESTINATIONS.length,
    );
  });

  // Every destination must be gated by a category the visitor is actually asked about —
  // one gated by `necessary` would load before anyone consented to anything.
  it('gates every destination on a togglable category', () => {
    for (const destination of TRACKING_DESTINATIONS) {
      expect(TOGGLABLE_CONSENT_CATEGORIES).toContain(destination.category);
    }
  });

  it('gives each destination its own unique key pair under the destinations section', () => {
    const keys = TRACKING_DESTINATIONS.flatMap((destination) => {
      const pair = trackingDestinationSettingKeys(destination.id);
      return [pair.enabled, pair.id];
    });
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(
        key.startsWith(`${TRACKING_GROUP}.${TRACKING_SECTION_DESTINATIONS}.`),
      ).toBe(true);
    }
  });

  it('resolves a destination by id', () => {
    expect(trackingDestination('ga4').category).toBe('analytics');
    expect(trackingDestination('metaPixel').category).toBe('marketing');
  });

  // The whole point of the pattern: a paste into the wrong field is caught at the moment it
  // happens, not months later when the campaign has no conversions.
  //
  // Exactly ONE overlap is tolerated and it is declared here rather than hidden: a TikTok
  // pixel id is a 15–30 char alphanumeric, so an all-digit one is indistinguishable from a
  // Meta pixel id. Tightening TikTok to "must contain a letter" would reject a legitimate
  // all-digit id outright, which is the worse failure — so the overlap is surfaced in the
  // admin instead, via `matchingDestinationIds`.
  const TOLERATED_OVERLAP = new Set(['tiktokPixel accepts metaPixel']);

  it('accepts each destination’s own example and rejects every other one', () => {
    for (const destination of TRACKING_DESTINATIONS) {
      const own = new RegExp(destination.idPattern);
      expect(own.test(destination.idExample)).toBe(true);
      for (const other of TRACKING_DESTINATIONS) {
        if (other.id === destination.id) continue;
        const tolerated = TOLERATED_OVERLAP.has(
          `${destination.id} accepts ${other.id}`,
        );
        expect(
          own.test(other.idExample),
          `${destination.id} vs ${other.idExample}`,
        ).toBe(tolerated);
      }
    }
  });

  it('reports every destination a value could belong to, so an ambiguity is surfaced', () => {
    expect(matchingDestinationIds('G-ABCDE12345')).toEqual(['ga4']);
    expect(matchingDestinationIds('not-an-id')).toEqual([]);
    // The declared overlap, made visible to the admin rather than silently accepted.
    expect(matchingDestinationIds('123456789012345')).toEqual([
      'metaPixel',
      'tiktokPixel',
    ]);
  });

  it('rejects an empty or whitespace id', () => {
    for (const destination of TRACKING_DESTINATIONS) {
      const pattern = new RegExp(destination.idPattern);
      expect(pattern.test('')).toBe(false);
      expect(pattern.test('   ')).toBe(false);
    }
  });
});

describe('consent settings keys', () => {
  it('namespaces every consent key under the group’s consent section', () => {
    for (const key of Object.values(CONSENT_SETTING_KEYS)) {
      expect(
        key.startsWith(`${TRACKING_GROUP}.${TRACKING_SECTION_CONSENT}.`),
      ).toBe(true);
    }
  });

  it('bounds remember-days to a window a browser will actually keep', () => {
    expect(CONSENT_REMEMBER_DAYS_DEFAULT).toBeGreaterThanOrEqual(
      CONSENT_REMEMBER_DAYS_BOUNDS.min,
    );
    expect(CONSENT_REMEMBER_DAYS_DEFAULT).toBeLessThanOrEqual(
      CONSENT_REMEMBER_DAYS_BOUNDS.max,
    );
    // A consent record older than two years is not a decision any more, it is an assumption.
    expect(CONSENT_REMEMBER_DAYS_BOUNDS.max).toBeLessThanOrEqual(730);
  });

  it('never lets the policy version reach zero — version 0 would mean "never asked"', () => {
    expect(CONSENT_POLICY_VERSION_BOUNDS.min).toBe(1);
  });
});

describe('policy path pattern', () => {
  const pattern = new RegExp(POLICY_PATH_PATTERN);

  it('accepts a site-relative path', () => {
    expect(pattern.test('/privacy')).toBe(true);
    expect(pattern.test('/legal/data-processing')).toBe(true);
  });

  // A policy may be hosted elsewhere (a group-level notice, a law firm's page) — forbidding
  // that would force a copy that then goes stale.
  it('accepts an https url', () => {
    expect(pattern.test('https://sanad.example/privacy')).toBe(true);
  });

  it('rejects a bare word, a plain-http url, and a javascript: payload', () => {
    expect(pattern.test('privacy')).toBe(false);
    expect(pattern.test('http://sanad.example/privacy')).toBe(false);
    expect(pattern.test('javascript:alert(1)')).toBe(false);
  });
});

describe('the coded default config (U9/F7)', () => {
  it('lists no destination at all — nothing loads until an admin configures it', () => {
    expect(DEFAULT_TRACKING_CONFIG.destinations).toEqual([]);
  });

  it('leaves both policy links unset rather than pointing at a page that does not exist', () => {
    expect(DEFAULT_TRACKING_CONFIG.consent.privacyPolicyPath).toBeNull();
    expect(DEFAULT_TRACKING_CONFIG.consent.cookiePolicyPath).toBeNull();
  });

  it('has the banner ON by default — a silent opt-out is the unlawful default', () => {
    expect(DEFAULT_TRACKING_CONFIG.consent.bannerEnabled).toBe(true);
  });
});
