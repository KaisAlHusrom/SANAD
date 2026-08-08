import type { ComponentType, ReactNode } from 'react';

/**
 * A single log-row link. The website injects its comet-flight `TravelLink` (locale-prefixed to
 * `/blog/<slug>`); the lib default is a plain `<a>` so the admin preview still links. A component
 * prop (not a raw href) keeps the lib free of the website's `localizeHref`/router. Passed from the
 * SERVER page into the SERVER `BlogSection` (server→server — a client-component ref is RSC-safe).
 */
export type BlogRowLink = ComponentType<{
  slug: string;
  className?: string;
  children: ReactNode;
}>;

/**
 * The "all articles →" header link. The website injects its `TravelLink` to the `/blog` index; the
 * lib default is a plain `<a href="/blog">`. Only rendered when the teaser has rows (WEB — link out
 * only once there is somewhere to go).
 */
export type BlogAllLink = ComponentType<{
  className?: string;
  children: ReactNode;
}>;
