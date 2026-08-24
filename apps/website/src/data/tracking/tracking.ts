import {
  DEFAULT_TRACKING_CONFIG,
  type PublicTrackingConfig,
} from '@sanad/contracts';
import { fetchEnvelope } from '../http/fetch-envelope';

/**
 * Cached for five minutes, not sixty seconds like branding: a pixel id and a consent policy
 * change on the order of once a campaign, and this read sits on every public page render.
 * Tagged so a `tracking` settings save can revalidate it on demand.
 */
const TRACKING_REVALIDATE_SECONDS = 300;

/**
 * Read the resolved public tracking config (WEB1/U9) — the consent policy the banner obeys
 * and the destinations the tag layer may load. **Never throws**: a gateway that cannot answer
 * degrades to the coded defaults, which ask for consent and load nothing (F7/U23) rather than
 * taking down a page for the sake of a pixel.
 */
export async function getTrackingConfig(): Promise<PublicTrackingConfig> {
  try {
    return await fetchEnvelope<PublicTrackingConfig>('/tracking-config', {
      revalidate: TRACKING_REVALIDATE_SECONDS,
      tags: ['tracking'],
    });
  } catch {
    return DEFAULT_TRACKING_CONFIG;
  }
}
