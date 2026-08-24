import type { TogglableConsentCategory } from './consent-category.js';
import type { TrackingDestinationId } from './tracking-destination.js';

/**
 * The **public** tracking configuration the website reads from `GET /api/tracking-config`.
 * A pure response shape (U16 → `.types.ts`). Nothing here is a secret — a pixel id ships in
 * the page by definition — but a destination the operator has not finished setting up is
 * omitted entirely rather than published as an empty string.
 */
export interface PublicConsentPolicy {
  bannerEnabled: boolean;
  /** Bumping this re-asks every visitor whose stored decision predates it. */
  policyVersion: number;
  rememberDays: number;
  /** Site-relative path or absolute https url; `null` until an operator sets one (F7). */
  privacyPolicyPath: string | null;
  cookiePolicyPath: string | null;
}

export interface PublicTrackingDestination {
  id: TrackingDestinationId;
  /** The category that must be granted before this destination may load. */
  category: TogglableConsentCategory;
  measurementId: string;
}

export interface PublicTrackingConfig {
  consent: PublicConsentPolicy;
  /** Only destinations that are BOTH enabled and configured. Never a blank id. */
  destinations: readonly PublicTrackingDestination[];
}
