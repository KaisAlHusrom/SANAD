import { isLocale } from '../../../i18n/locale-route';
import { SYSTEM_ROUTE_SEGMENTS } from '../constants';
import type { ResolvedSystem } from '../types';

/** Decode one path segment; a malformed escape keeps the raw segment (never throws). */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Resolve a pathname (as `usePathname()` / an internal `href` gives it — locale-prefixed,
 * no query) to the star system that route lives in (P8.D). Pure and total: unknown routes
 * fall to the `ambient` deep-space system, so a flight can always resolve somewhere. Slugs
 * are decoded so they match the route param the page itself receives.
 */
export function resolveSystem(pathname: string): ResolvedSystem {
  const segments = pathname.split('/').filter(Boolean).map(decodeSegment);
  const [maybeLocale] = segments;
  if (maybeLocale !== undefined && isLocale(maybeLocale)) segments.shift();

  const [head, second, ...rest] = segments;
  if (head === undefined) return { system: 'landing', slug: null };
  if (head === SYSTEM_ROUTE_SEGMENTS.services) {
    if (second === undefined) return { system: 'services', slug: null };
    // exactly one segment below /services is a detail orbit; deeper is the CMS catch-all
    if (rest.length === 0) return { system: 'serviceDetail', slug: second };
    return { system: 'ambient', slug: null };
  }
  if (head === SYSTEM_ROUTE_SEGMENTS.portfolio) {
    // the whole works "Galaxy" is one system: the index AND a case-study detail idle in it,
    // so index↔detail is an intra-system hop (no warp tunnel). The detail seeds off the slug.
    if (second === undefined) return { system: 'works', slug: null };
    if (rest.length === 0) return { system: 'works', slug: second };
    return { system: 'ambient', slug: null };
  }
  if (head === SYSTEM_ROUTE_SEGMENTS.contact && second === undefined) {
    return { system: 'contact', slug: null };
  }
  if (head === SYSTEM_ROUTE_SEGMENTS.about && second === undefined) {
    return { system: 'about', slug: null };
  }
  if (head === SYSTEM_ROUTE_SEGMENTS.process && second === undefined) {
    return { system: 'process', slug: null };
  }
  if (head === SYSTEM_ROUTE_SEGMENTS.blog) {
    // the whole blog "Logbook" is one system: the index AND a post detail idle in it, so
    // index↔post is an intra-system hop (no warp tunnel). The detail seeds off the slug.
    if (second === undefined) return { system: 'blog', slug: null };
    if (rest.length === 0) return { system: 'blog', slug: second };
    return { system: 'ambient', slug: null };
  }
  // Request-a-project is the flagship conversion surface — it gets its OWN "Launchpad" system
  // (a dedicated ignition accent + scene), so every "Start a project" click flies into it.
  if (head === SYSTEM_ROUTE_SEGMENTS.request && second === undefined) {
    return { system: 'request', slug: null };
  }
  // FAQ + Careers are part of the "reach out" cluster — they idle in the SAME contact "Beacon"
  // system as /contact (no dedicated accent needed; a hop to /contact is intra-system).
  if (head === SYSTEM_ROUTE_SEGMENTS.faq && second === undefined) {
    return { system: 'contact', slug: null };
  }
  if (head === SYSTEM_ROUTE_SEGMENTS.careers && second === undefined) {
    return { system: 'contact', slug: null };
  }
  return { system: 'ambient', slug: null };
}
