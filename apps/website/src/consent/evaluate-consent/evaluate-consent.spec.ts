import { describe, expect, it } from 'vitest';
import {
  CONSENT_POLICY_VERSION_DEFAULT,
  CONSENT_REMEMBER_DAYS_DEFAULT,
  DEFAULT_TRACKING_CONFIG,
  type PublicConsentPolicy,
} from '@sanad/contracts';
import { MS_PER_DAY } from '../constants/consent.constants';
import type { ConsentRecord } from '../types/consent-record.zod.types';
import { evaluateConsent } from './evaluate-consent';

const NOW = 1_700_000_000_000;

const policy = (
  over: Partial<PublicConsentPolicy> = {},
): PublicConsentPolicy => ({
  ...DEFAULT_TRACKING_CONFIG.consent,
  ...over,
});

const record = (over: Partial<ConsentRecord> = {}): ConsentRecord => ({
  v: 1,
  policyVersion: CONSENT_POLICY_VERSION_DEFAULT,
  decidedAt: NOW,
  analytics: true,
  marketing: true,
  ...over,
});

describe('evaluateConsent', () => {
  it('asks a browser that has never decided', () => {
    const state = evaluateConsent(null, policy(), NOW);

    expect(state.status).toBe('pending');
    expect(state.granted.analytics).toBe(false);
    expect(state.granted.marketing).toBe(false);
  });

  it('honours a valid decision, category by category', () => {
    const state = evaluateConsent(
      record({ analytics: true, marketing: false }),
      policy(),
      NOW,
    );

    expect(state.status).toBe('decided');
    expect(state.granted.analytics).toBe(true);
    expect(state.granted.marketing).toBe(false);
  });

  it('grants `necessary` in every branch — it is shown, never decided', () => {
    for (const state of [
      evaluateConsent(null, policy(), NOW),
      evaluateConsent(
        record({ analytics: false, marketing: false }),
        policy(),
        NOW,
      ),
      evaluateConsent(record(), policy({ bannerEnabled: false }), NOW),
    ]) {
      expect(state.granted.necessary).toBe(true);
    }
  });

  describe('policyVersion', () => {
    it('re-asks when the operator has bumped the version', () => {
      const state = evaluateConsent(
        record({ policyVersion: 1 }),
        policy({ policyVersion: 2 }),
        NOW,
      );

      expect(state.status).toBe('pending');
      expect(state.granted.analytics).toBe(false);
    });

    it('re-asks when the stored version is NEWER than the policy — a rollback is still a change', () => {
      const state = evaluateConsent(
        record({ policyVersion: 5 }),
        policy({ policyVersion: 2 }),
        NOW,
      );

      expect(state.status).toBe('pending');
    });
  });

  describe('rememberDays', () => {
    const days = CONSENT_REMEMBER_DAYS_DEFAULT;

    it('still honours a decision one millisecond before it expires', () => {
      const decidedAt = NOW - days * MS_PER_DAY + 1;

      expect(evaluateConsent(record({ decidedAt }), policy(), NOW).status).toBe(
        'decided',
      );
    });

    it('re-asks exactly at the expiry boundary', () => {
      const decidedAt = NOW - days * MS_PER_DAY;

      expect(evaluateConsent(record({ decidedAt }), policy(), NOW).status).toBe(
        'pending',
      );
    });

    it('follows a shortened window — an operator cutting rememberDays expires old decisions', () => {
      const decidedAt = NOW - 30 * MS_PER_DAY;

      expect(
        evaluateConsent(
          record({ decidedAt }),
          policy({ rememberDays: 90 }),
          NOW,
        ).status,
      ).toBe('decided');
      expect(
        evaluateConsent(record({ decidedAt }), policy({ rememberDays: 7 }), NOW)
          .status,
      ).toBe('pending');
    });

    it('does not re-ask a browser whose clock runs ahead of ours', () => {
      const decidedAt = NOW + 5 * MS_PER_DAY;

      // A future timestamp is a wrong clock, not an attack — the visitor owns this storage and
      // could grant consent outright. Re-asking them on every page load would be the worse bug.
      expect(evaluateConsent(record({ decidedAt }), policy(), NOW).status).toBe(
        'decided',
      );
    });
  });

  describe('with the banner switched off', () => {
    it('grants nothing — nobody was asked, so nothing was granted', () => {
      const state = evaluateConsent(
        null,
        policy({ bannerEnabled: false }),
        NOW,
      );

      expect(state.status).toBe('not-required');
      expect(state.granted.analytics).toBe(false);
      expect(state.granted.marketing).toBe(false);
    });

    it('overrides a stored grant — turning the banner off withdraws the basis', () => {
      const state = evaluateConsent(
        record({ analytics: true, marketing: true }),
        policy({ bannerEnabled: false }),
        NOW,
      );

      expect(state.status).toBe('not-required');
      expect(state.granted.analytics).toBe(false);
      expect(state.granted.marketing).toBe(false);
    });
  });
});
