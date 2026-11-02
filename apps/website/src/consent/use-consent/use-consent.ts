'use client';

import {
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import type {
  PublicConsentPolicy,
  PublicTrackingDestination,
} from '@sanad/contracts';
import { CONSENT_RECORD_VERSION } from '../constants/consent.constants';
import { ConsentConfigContext } from '../consent-provider/consent-provider';
import { consentStore } from '../consent-store/consent-store';
import { evaluateConsent } from '../evaluate-consent/evaluate-consent';
import type {
  ConsentDecision,
  ConsentGrants,
  ConsentStatus,
} from '../types/consent-state.types';

export interface ConsentApi {
  policy: PublicConsentPolicy;
  /** Only destinations that are both enabled and configured — what the dialog names to a visitor. */
  destinations: readonly PublicTrackingDestination[];
  status: ConsentStatus;
  granted: ConsentGrants;
  /**
   * Record the visitor's answer. `necessary` is not passed — it was never theirs to refuse.
   * Returns whether the answer was PERSISTED: it always applies to this page view, but a browser
   * with storage blocked will forget it, and a visitor is owed that fact rather than a silent
   * promise the next page break (U23).
   */
  decide: (decision: ConsentDecision) => boolean;
  /** Forget the answer entirely, so the visitor is asked again. */
  withdraw: () => void;
}

/**
 * The single read of consent for the whole site. `useSyncExternalStore` is what removes the
 * banner flash: `getServerSnapshot` returns `null` through SSR *and* hydration, then the client
 * reads storage synchronously — so a visitor who already decided never sees a banner appear and
 * vanish, and React never warns about a mismatch.
 */
export function useConsent(): ConsentApi {
  const config = useContext(ConsentConfigContext);
  const policy = config.consent;
  const record = useSyncExternalStore(
    consentStore.subscribe,
    consentStore.getSnapshot,
    consentStore.getServerSnapshot,
  );

  // Captured once per mount. Reading the clock during render would let two renders of the same
  // state disagree; a decision that expires mid-session is re-asked on the next page load, which
  // is what the bootstrap script is for.
  const mountedAt = useRef(Date.now());

  const state = useMemo(
    () => evaluateConsent(record, policy, mountedAt.current),
    [record, policy],
  );

  const decide = useCallback(
    (decision: ConsentDecision) =>
      consentStore.save({
        v: CONSENT_RECORD_VERSION,
        policyVersion: policy.policyVersion,
        decidedAt: Date.now(),
        analytics: decision.analytics,
        marketing: decision.marketing,
      }),
    [policy.policyVersion],
  );

  const withdraw = useCallback(() => consentStore.clear(), []);

  return {
    policy,
    destinations: config.destinations,
    status: state.status,
    granted: state.granted,
    decide,
    withdraw,
  };
}
