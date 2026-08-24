import {
  TRACKING_DESTINATIONS,
  matchingDestinationIds,
  trackingDestinationSettingKeys,
  type TogglableConsentCategory,
  type TrackingDestinationId,
} from '@sanad/contracts';
import { fieldId, type SectionFormValues } from '../setting-form';

/**
 * What the operator is actually told about a destination.
 *
 * `notConfigured` and `invalid` are the two states that matter and that a plain on/off switch
 * would hide: a destination switched on with no id, or with an id of the wrong shape, is a
 * campaign silently reporting nothing.
 */
export type DestinationStatus = 'off' | 'notConfigured' | 'invalid' | 'live';

export interface DestinationView {
  id: TrackingDestinationId;
  category: TogglableConsentCategory;
  /** RHF field names for the pair. */
  enabledField: string;
  idField: string;
  pattern: string;
  example: string;
  enabled: boolean;
  value: string;
  status: DestinationStatus;
  /**
   * Other destinations this value could equally belong to. Meta and TikTok ids overlap, so a
   * pattern alone cannot catch that paste — surfacing the ambiguity is the honest alternative
   * to either accepting it silently or rejecting a legitimate id.
   */
  alsoLooksLike: readonly TrackingDestinationId[];
}

export function destinationStatus(
  enabled: boolean,
  value: string,
  pattern: string,
): DestinationStatus {
  if (!enabled) return 'off';
  const trimmed = value.trim();
  if (trimmed === '') return 'notConfigured';
  return new RegExp(pattern).test(trimmed) ? 'live' : 'invalid';
}

/** Project the live form values onto one view per destination, in registry order. */
export function toDestinationViews(
  values: SectionFormValues,
): DestinationView[] {
  return TRACKING_DESTINATIONS.map((destination) => {
    const keys = trackingDestinationSettingKeys(destination.id);
    const enabledField = fieldId(keys.enabled);
    const idField = fieldId(keys.id);
    const enabled = values[enabledField] === true;
    const raw = values[idField];
    const value = typeof raw === 'string' ? raw : '';
    const trimmed = value.trim();
    return {
      id: destination.id,
      category: destination.category,
      enabledField,
      idField,
      pattern: destination.idPattern,
      example: destination.idExample,
      enabled,
      value,
      status: destinationStatus(enabled, value, destination.idPattern),
      alsoLooksLike:
        trimmed === ''
          ? []
          : matchingDestinationIds(trimmed).filter(
              (id) => id !== destination.id,
            ),
    };
  });
}

/**
 * GA4 loaded directly AND through a GTM container counts every session twice, which quietly
 * corrupts the only numbers an ad platform optimizes on. It is a legitimate setup in rare
 * cases, so this warns rather than forbids.
 */
export function isDoubleCounting(views: readonly DestinationView[]): boolean {
  const live = (id: TrackingDestinationId): boolean =>
    views.some((view) => view.id === id && view.status !== 'off');
  return live('ga4') && live('gtm');
}

/**
 * Where a policy link will actually take a visitor. An absolute url is used as-is; a site path
 * is shown under the site's own origin **with the locale segment**, because that is the route
 * the website serves — a preview that omitted it would look right and 404 in production.
 */
export function policyLinkPreview(
  siteUrl: string | null,
  path: string,
  locale: string,
): string | null {
  const trimmed = path.trim();
  if (trimmed === '') return null;
  if (trimmed.startsWith('https://')) return trimmed;
  if (!trimmed.startsWith('/')) return null;
  const origin = (siteUrl ?? '').trim().replace(/\/+$/, '');
  return `${origin}/${locale}${trimmed}`;
}
