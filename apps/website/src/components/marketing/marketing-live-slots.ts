import type { SectionSlots } from '@sanad/web-ui';
import { Reveal } from '../../motion/reveal';

/**
 * The website's **live** motion slots for the shared `@sanad/web-ui` sections that compose a marketing
 * CMS page (About / FAQ — Phase 5). These pages are built from the generic `richtext`/`faq`/`team`
 * sections (no landing cosmos chrome), so a single injected scroll-`Reveal` covers every band's head +
 * body reveal (WEB3/WEB4). Motion is INJECTED, never imported by the lib (it stays `type:ui`); the
 * admin preview passes none → faithful-static. Applied uniformly via `SectionRenderer`'s `slots`.
 */
export const marketingLiveSlots: SectionSlots = {
  Reveal,
};
