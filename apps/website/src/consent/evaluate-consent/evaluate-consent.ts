import type { PublicConsentPolicy } from '@sanad/contracts';
import { MS_PER_DAY } from '../constants/consent.constants';
import type { ConsentRecord } from '../types/consent-record.zod.types';
import type { ConsentState } from '../types/consent-state.types';

const NOTHING_GRANTED = {
  necessary: true,
  analytics: false,
  marketing: false,
} as const;

/**
 * The one place a stored decision becomes a verdict (U3) — the bootstrap script re-implements
 * this in the few lines it can run before paint, and its spec is written against these rules.
 *
 * The clock is injected so expiry is a fact a test can state rather than one it has to fake.
 */
export function evaluateConsent(
  record: ConsentRecord | null,
  policy: PublicConsentPolicy,
  now: number,
): ConsentState {
  // Checked first, and it beats a stored grant: the admin screen promises that with the banner
  // off nobody is asked, so nothing is granted. An operator switching it off has withdrawn the
  // lawful basis, not preserved yesterday's answers.
  if (!policy.bannerEnabled) {
    return { status: 'not-required', granted: NOTHING_GRANTED };
  }

  if (!record) return { status: 'pending', granted: NOTHING_GRANTED };

  // Any drift re-asks, in both directions — a rolled-back version is as much a change of terms
  // as a bumped one.
  if (record.policyVersion !== policy.policyVersion) {
    return { status: 'pending', granted: NOTHING_GRANTED };
  }

  if (now - record.decidedAt >= policy.rememberDays * MS_PER_DAY) {
    return { status: 'pending', granted: NOTHING_GRANTED };
  }

  return {
    status: 'decided',
    granted: {
      necessary: true,
      analytics: record.analytics,
      marketing: record.marketing,
    },
  };
}
