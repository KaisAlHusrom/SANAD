import type { LocalizedText } from '../common/localized-text.js';
import type { TrackingDestinationId } from './tracking-destination.js';

/**
 * What each destination is CALLED, in the reader's locale.
 *
 * It lives in contracts rather than in an app catalog because two surfaces name the same five
 * vendors: the admin's Tracking & consent screen, and the website's consent dialog, which tells a
 * visitor exactly which third party a category would admit. Two catalogs would drift, and the one
 * that drifted would be the legal disclosure (U3).
 *
 * Brand names stay in Latin script where the vendor itself does not translate them — a visitor
 * looking for "Google Analytics" in their browser settings must find the same words here.
 */
export const TRACKING_DESTINATION_NAMES: Readonly<
  Record<TrackingDestinationId, LocalizedText>
> = {
  ga4: { ar: 'Google Analytics 4', en: 'Google Analytics 4' },
  gtm: { ar: 'Google Tag Manager', en: 'Google Tag Manager' },
  metaPixel: { ar: 'بكسل Meta', en: 'Meta pixel' },
  snapPixel: { ar: 'بكسل Snap', en: 'Snap pixel' },
  tiktokPixel: { ar: 'بكسل TikTok', en: 'TikTok pixel' },
};
