import type { Locale } from '@sanad/contracts';
import type { BlogAllLink, BlogRowLink, SectionSlots } from '@sanad/web-ui';
import { Reveal } from '../../motion/reveal';
import { WordReveal } from '../../motion/word-reveal';
import { CountUpNumber } from '../../motion/count-up-number';
import { TravelLink } from '../../motion/universe';
import { localizeHref } from '../../lib/localize-href';
import { LANDING_COPY, copy } from './landing-copy';

/**
 * The website's **live** slots for the shared `@sanad/web-ui` section components (the P8.5
 * live-swap). Motion is INJECTED, never imported by the lib (it stays `type:ui`): the site passes
 * its real client wrappers for `mode='live'`, the admin passes none (faithful-static preview). This
 * is what makes the live landing render the EXACT same component as the CMS preview (preview===live)
 * while keeping the cosmos motion, the warp CTAs and the hero legibility veil.
 */

/** The hero CTA row — a comet-flight primary (→ request-a-project) + the `#works` anchor glide. */
function HeroActions({
  primaryLabel,
  secondaryLabel,
  locale,
}: {
  primaryLabel: string;
  secondaryLabel: string;
  locale: Locale;
}) {
  return (
    <>
      <TravelLink
        href={localizeHref('/request-a-project', locale)}
        className="web-cta web-cta--primary"
      >
        {primaryLabel}
      </TravelLink>
      <a href="#works" className="web-cta web-cta--secondary">
        {secondaryLabel}
      </a>
    </>
  );
}

/** The legibility veil scrim so the hero text reads over the blazing WebGL star (cosmos-only). */
function HeroVeil() {
  return <div className="web-hero-veil" aria-hidden="true" />;
}

/** The "begin the journey" scroll cue under the hero. */
function HeroCue({ label }: { label: string }) {
  return (
    <div className="web-hero-cue">
      <span>{label}</span>
      <span className="web-hero-cue-line" aria-hidden="true" />
    </div>
  );
}

/** Live motion + cosmos-chrome slots for the shared `HeroSection` (`mode='live'`). */
export function heroLiveSlots(locale: Locale): SectionSlots {
  const cueLabel = copy(LANDING_COPY.hero.startJourney, locale);
  return {
    Reveal,
    Headline: WordReveal,
    Actions: (props) => <HeroActions {...props} locale={locale} />,
    Backdrop: HeroVeil,
    Cue: () => <HeroCue label={cueLabel} />,
  };
}

/** Live motion slots for the shared `StatsSection` (`mode='live'`): the `.lp-flow` reveal +
 *  count-up. Locale-free (its head/labels come from the section data via `SectionField`). */
export const statsLiveSlots: SectionSlots = {
  Reveal,
  Counter: CountUpNumber,
};

/** The CTA-band actions — the larger warp primary (→ request-a-project) + the `#works` ghost glide. */
function CtaActions({
  primaryLabel,
  secondaryLabel,
  locale,
}: {
  primaryLabel: string;
  secondaryLabel: string;
  locale: Locale;
}) {
  return (
    <>
      <TravelLink
        href={localizeHref('/request-a-project', locale)}
        className="web-cta web-cta--primary web-cta--lg"
      >
        {primaryLabel}
      </TravelLink>
      <a href="#works" className="web-cta web-cta--secondary">
        {secondaryLabel}
      </a>
    </>
  );
}

/** The CTA cosmos chrome (injected `Backdrop`): the dark legibility scrim + accent glow + concentric
 *  orbit rings over the blazing launch star. Each is `data-chapter-veil` so `ChapterStage` fades them
 *  in/out with the content window. Reuses the existing (owner-tuned) `.lp-cta-*` classes — live-only. */
function CtaChrome() {
  return (
    <>
      <div className="lp-cta-veil" data-chapter-veil aria-hidden="true" />
      <div className="lp-cta-glow" data-chapter-veil aria-hidden="true" />
      <div className="lp-cta-rings" data-chapter-veil aria-hidden="true">
        <span className="lp-cta-ring lp-cta-ring--0" />
        <span className="lp-cta-ring lp-cta-ring--1" />
        <span className="lp-cta-ring lp-cta-ring--2" />
      </div>
    </>
  );
}

/** Live motion + cosmos-chrome slots for the shared `CtaSection` (`mode='live'`). The primary/ghost
 *  labels come from the shared `CTA_COPY` (single-sourced); this injects only the navigation + veil. */
export function ctaLiveSlots(locale: Locale): SectionSlots {
  return {
    Reveal,
    Actions: (props) => <CtaActions {...props} locale={locale} />,
    Backdrop: CtaChrome,
  };
}

/** Live motion slots for the shared `ProcessSection` (`mode='live'`): only the `.lp-flow` head reveal.
 *  The "phases as moons" visualization is injected via ProcessSection's dedicated `System` prop
 *  (`ProcessMoons`) in `page.tsx` — not a generic slot — so the `SectionSlots` union stays clean. */
export const processLiveSlots: SectionSlots = {
  Reveal,
};

/** Live motion slots for the shared `ServicesSection` (`mode='live'`): the `.lp-flow` reveal wrapping
 *  the head + each system card. The cards themselves come from the section's hydrated `services`
 *  collection (Phase 3) — the site injects no data, only motion. */
export const servicesLiveSlots: SectionSlots = {
  Reveal,
};

/** Live motion slots for the shared `TrustSection` (`mode='live'`): only the `.lp-flow` head reveal.
 *  The animated domain constellation is injected via TrustSection's dedicated `Constellation` prop
 *  (`TrustConstellation`) in `page.tsx` — not a generic slot — so the `SectionSlots` union stays
 *  clean. The stars come from the section's hydrated `portfolio` collection (grouped by category). */
export const trustLiveSlots: SectionSlots = {
  Reveal,
};

/** Live motion slots for the shared `WorksSection` (`mode='live'`): only the `.lp-flow` head reveal.
 *  The animated orbit ring is injected via WorksSection's dedicated `Orbit` prop (`WorksOrbit`) in
 *  `page.tsx` — not a generic slot — so the `SectionSlots` union stays clean. The case-study cards
 *  come from the section's hydrated `portfolio` collection (covers pre-resolved onto `coverUrl`); the
 *  orbit owns its own comet-flight `TravelLink` (RSC-safe — no function crosses from the server). */
export const worksLiveSlots: SectionSlots = {
  Reveal,
};

/** Live motion slots for the shared `TestimonialsSection` (`mode='live'`): the `.lp-flow` reveal
 *  wrapping the head + each quote card. The cards come from the section's hydrated `testimonials`
 *  collection (avatars pre-resolved onto `avatarUrl`); the site injects no data, only motion. */
export const testimonialsLiveSlots: SectionSlots = {
  Reveal,
};

/** Live motion slots for the shared `BlogSection` (`mode='live'`): only the `.lp-flow` head/list
 *  reveal. The row + "all" comet-flight links are injected via BlogSection's dedicated
 *  `RowLink`/`AllLink` props (`blogRowLink`/`blogAllLink`) in `page.tsx` — the rows come from the
 *  section's hydrated `blog` collection (covers pre-resolved onto `coverUrl`). */
export const blogLiveSlots: SectionSlots = {
  Reveal,
};

/** The per-row article link — the website's comet-flight `TravelLink` to the locale-prefixed
 *  `/blog/<slug>`. A client-component ref injected into the server `BlogSection` (RSC-safe). */
export function blogRowLink(locale: Locale): BlogRowLink {
  return function BlogRowTravelLink({ slug, className, children }) {
    return (
      <TravelLink
        href={localizeHref(`/blog/${slug}`, locale)}
        className={className}
      >
        {children}
      </TravelLink>
    );
  };
}

/** The "all articles →" header link — the website's `TravelLink` to the locale-prefixed `/blog`. */
export function blogAllLink(locale: Locale): BlogAllLink {
  return function BlogAllTravelLink({ className, children }) {
    return (
      <TravelLink href={localizeHref('/blog', locale)} className={className}>
        {children}
      </TravelLink>
    );
  };
}
