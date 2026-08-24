import { z } from 'zod';
import type { TogglableConsentCategory } from './consent-category.js';
import {
  TRACKING_GROUP,
  TRACKING_SECTION_DESTINATIONS,
} from './tracking-settings.js';

/** Every ad/analytics destination the launch pack can drive, in admin display order. */
export const trackingDestinationIdSchema = z.enum([
  'ga4',
  'gtm',
  'metaPixel',
  'snapPixel',
  'tiktokPixel',
]);

export type TrackingDestinationId = z.infer<typeof trackingDestinationIdSchema>;

export interface TrackingDestination {
  id: TrackingDestinationId;
  /** The consent category that gates it — never `necessary`, or it would load unasked. */
  category: TogglableConsentCategory;
  /**
   * A **shape hint**, not a vendor specification. It exists to catch the paste that would
   * otherwise fail silently for months — a GTM container dropped into the GA4 field. It is
   * deliberately loose on length because these formats belong to third parties and cannot be
   * verified from this repo (U15); the rejection names the expected shape so an operator can
   * see exactly what was wrong.
   */
  idPattern: string;
  /** An obviously-fake id of the right shape — the field's placeholder AND the rejection's example. */
  idExample: string;
}

export const TRACKING_DESTINATIONS: readonly TrackingDestination[] = [
  {
    id: 'ga4',
    category: 'analytics',
    idPattern: '^G-[A-Z0-9]{4,20}$',
    idExample: 'G-ABCDE12345',
  },
  {
    id: 'gtm',
    category: 'analytics',
    idPattern: '^GTM-[A-Z0-9]{4,20}$',
    idExample: 'GTM-ABCDE12',
  },
  {
    id: 'metaPixel',
    category: 'marketing',
    idPattern: '^[0-9]{13,20}$',
    idExample: '123456789012345',
  },
  {
    id: 'snapPixel',
    category: 'marketing',
    idPattern:
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    idExample: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
  },
  {
    id: 'tiktokPixel',
    category: 'marketing',
    idPattern: '^[A-Z0-9]{15,30}$',
    idExample: 'C4A1B2C3D4E5F6G7H8I9',
  },
];

/** The destination's declaration. Total by construction — the id type is closed. */
export function trackingDestination(
  id: TrackingDestinationId,
): TrackingDestination {
  const found = TRACKING_DESTINATIONS.find(
    (destination) => destination.id === id,
  );
  if (!found) {
    throw new Error(`Unknown tracking destination: ${id}`);
  }
  return found;
}

/** The key pair configuring one destination. */
export function trackingDestinationSettingKeys(id: TrackingDestinationId): {
  enabled: string;
  id: string;
} {
  const prefix = `${TRACKING_GROUP}.${TRACKING_SECTION_DESTINATIONS}.${id}`;
  return { enabled: `${prefix}.enabled`, id: `${prefix}.id` };
}

/**
 * Every destination whose shape hint matches `value`. Meta and TikTok ids overlap (an all-digit
 * TikTok id is indistinguishable from a Meta pixel), so a pattern alone cannot catch that
 * particular paste — the admin card uses this to warn when a value ALSO looks like another
 * destination's, which is the honest way to surface an ambiguity instead of hiding it.
 */
export function matchingDestinationIds(
  value: string,
): readonly TrackingDestinationId[] {
  return TRACKING_DESTINATIONS.filter((destination) =>
    new RegExp(destination.idPattern).test(value),
  ).map((destination) => destination.id);
}
