import type { Locale } from '@sanad/contracts';
import type { ComponentType, ReactNode } from 'react';
import type { WorkCardData } from './derive-work-cards.js';

/** The static-copy labels a card needs (the "CHALLENGE" lead-in). */
export interface WorkCardLabels {
  challenge: string;
}

/**
 * The card's case-study link. The website injects its comet-flight `TravelLink` (locale-prefixed to
 * `/portfolio/<slug>`); the lib default is a plain `<a>` so the admin static figure still links.
 * A component prop (not a raw href) keeps the lib free of the website's `localizeHref`/router.
 */
export type WorkCardLink = ComponentType<{
  slug: string;
  className?: string;
  children: ReactNode;
}>;

/**
 * The website's animated orbit ring, injected for `mode='live'` (like trust's `Constellation` /
 * process's `System`). It renders the SAME shared `WorkCard`s (driven by `[data-orbit-card]`
 * selector) inside its pinned/scrubbed stage, with the section head placed in the stage so it
 * reveals with the docked planet. The admin preview / any live render without it draws the static
 * `WorksFigure`. A works-specific prop so the generic `SectionSlots` union stays clean. Receives
 * only PLAIN data (RSC-safe: a server component can't pass a function into this client component) —
 * covers are pre-resolved onto `cards[].coverUrl`, and the orbit owns its own case-study `CardLink`.
 */
export type WorksOrbitComponent = ComponentType<{
  head: ReactNode;
  cards: WorkCardData[];
  labels: WorkCardLabels;
  /** Ring rotation sign — `+1` LTR, `-1` RTL (WEB6). Derived from the locale by `WorksSection`. */
  dir: 1 | -1;
  /** The active locale — the orbit localizes each card's `/portfolio/<slug>` comet-flight link. */
  locale: Locale;
}>;
