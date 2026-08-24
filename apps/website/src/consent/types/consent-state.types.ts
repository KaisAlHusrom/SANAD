import type {
  ConsentCategory,
  TogglableConsentCategory,
} from '@sanad/contracts';

/**
 * `not-required` is not "granted" — it is the operator having switched the banner off, which the
 * admin screen promises means nobody is asked and therefore nothing is granted.
 */
export type ConsentStatus = 'pending' | 'decided' | 'not-required';

export type ConsentGrants = Readonly<Record<ConsentCategory, boolean>>;

export interface ConsentState {
  status: ConsentStatus;
  granted: ConsentGrants;
}

/** What a visitor actually chooses — `necessary` is not theirs to refuse, so it is not here. */
export type ConsentDecision = Readonly<
  Record<TogglableConsentCategory, boolean>
>;
