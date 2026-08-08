import type { Locale } from '@sanad/contracts';
import { landingWorldOrder, landingWorlds } from '@sanad/config';
import { getPage } from '../../src/data/content';
import {
  BlogSection,
  CtaSection,
  HeroSection,
  ProcessSection,
  ServicesSection,
  StatsSection,
  TestimonialsSection,
  TrustSection,
  WorksSection,
} from '@sanad/web-ui';
import { resolveMediaUrls } from '../../src/data/media';
import { makeImageResolver } from '../../src/media/resolve-image-url';
import { WorldVeil } from '../../src/motion/cosmos';
import { SystemStage } from '../../src/motion/universe';
import {
  IgnitionGate,
  WayfinderRail,
  WorksOrbit,
} from '../../src/components/landing';
import { ProcessMoons } from '../../src/components/landing/process';
import { TrustConstellation } from '../../src/components/landing/trust';
import { LANDING_COPY, copy } from '../../src/components/landing/landing-copy';
import { findSection } from '../../src/components/landing/section-content';
import {
  FALLBACK_BLOG_SECTION,
  FALLBACK_CTA_SECTION,
  FALLBACK_HERO_SECTION,
  FALLBACK_PROCESS_SECTION,
  FALLBACK_SERVICES_SECTION,
  FALLBACK_STATS_SECTION,
  FALLBACK_TESTIMONIALS_SECTION,
  FALLBACK_TRUST_SECTION,
  FALLBACK_WORK_SECTION,
} from '../../src/components/landing/fallback-sections';
import {
  blogAllLink,
  blogLiveSlots,
  blogRowLink,
  ctaLiveSlots,
  heroLiveSlots,
  processLiveSlots,
  servicesLiveSlots,
  statsLiveSlots,
  testimonialsLiveSlots,
  trustLiveSlots,
  worksLiveSlots,
} from '../../src/components/landing/live-section-slots';
import {
  ChapterStage,
  CHAPTER_HEIGHTS,
} from '../../src/components/landing/chapter';
import {
  ImpactSection,
  FooterFinale,
  buildFinaleData,
} from '../../src/components/landing/finale';
import { getBranding } from '../../src/data/branding';
import { getMenu } from '../../src/data/menus';

/**
 * The bespoke animated landing (P8 Stage 8.B-1) — 100% DB-driven (WEB1). Editorial copy comes from
 * the seeded `landing` page-tree (`getPage`); the collection sections from their typed list reads.
 * Every leg degrades to a coded default / empty state on failure (F7/F3) so the page never blanks.
 * Sections are server-rendered for SEO (WEB2); their motion is layered by client primitives
 * (Reveal / WordReveal / CountUp / the WEB10 WorksOrbit) under the shell's MotionProvider. The
 * WEB10 R3F cosmos the whole journey travels through is the layout-level `UniverseMount`
 * (P8.D — the landing is the `landing` star system of the one universe); on mobile /
 * reduced-motion it settles to a static token-coloured glow.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;

  // The finale IS the landing footer (the chrome footer is suppressed here by `:has(.lp-finale)`),
  // so it reads the SAME branding + footer menu the chrome footer does — otherwise the two footers
  // drift (they used to hardcode different company names, emails and copyright). F7: both legs
  // degrade to coded defaults.
  const [page, branding, footerMenu] = await Promise.all([
    getPage('landing').catch(() => null),
    getBranding().catch(() => null),
    getMenu('footer').catch(() => null),
  ]);
  const finaleData = buildFinaleData(branding, footerMenu, locale);

  // The collection-backed sections (work/testimonials/blog) hydrate from the page tree
  // (preview===live). Resolve their soft media ids → CDN urls up front so the shared cards render
  // real covers/avatars (F3) — the resolved plain url is baked onto each card server-side (RSC-safe).
  const workSection = findSection(page, 'work') ?? FALLBACK_WORK_SECTION;
  const testimonialsSection =
    findSection(page, 'testimonials') ?? FALLBACK_TESTIMONIALS_SECTION;
  const blogSection = findSection(page, 'blog') ?? FALLBACK_BLOG_SECTION;

  const workCoverIds =
    workSection.collection?.collection === 'portfolio'
      ? workSection.collection.items
          .map((project) => project.coverMediaId)
          .filter((id): id is string => id !== null)
      : [];
  const testimonialAvatarIds =
    testimonialsSection.collection?.collection === 'testimonials'
      ? testimonialsSection.collection.items
          .map((item) => item.avatarMediaId)
          .filter((id): id is string => id !== null)
      : [];
  const blogCoverIds =
    blogSection.collection?.collection === 'blog'
      ? blogSection.collection.items
          .map((post) => post.coverMediaId)
          .filter((id): id is string => id !== null)
      : [];

  const mediaUrls = await resolveMediaUrls([
    ...workCoverIds,
    ...testimonialAvatarIds,
    ...blogCoverIds,
  ]).catch(() => new Map());
  const resolveMedia = makeImageResolver(mediaUrls);

  // the wayfinder's nine stations — anchor ids + business labels + each world's glow (8.B-4)
  const stations = landingWorldOrder.map((id) => ({
    id,
    label: copy(LANDING_COPY.wayfinder.stations[id], locale),
    glow: landingWorlds[id].glow,
  }));

  return (
    <SystemStage system="landing">
      <div className="lp-content">
        <IgnitionGate />
        {/* the WebGL cosmos itself is the layout-level UniverseMount (P8.D) */}
        <WorldVeil />
        <WayfinderRail
          stations={stations}
          ariaLabel={copy(LANDING_COPY.wayfinder.ariaLabel, locale)}
        />
        {/* P8.5 live-swap: the LIVE hero is the shared @sanad/web-ui component (preview===live) —
            `anchorId="hero"` keeps the cosmos planet-dock + wayfinder + `#works` anchor resolving,
            and the site injects its motion + warp CTAs + legibility veil via `heroLiveSlots`. */}
        <HeroSection
          section={findSection(page, 'hero') ?? FALLBACK_HERO_SECTION}
          locale={locale}
          mode="live"
          anchorId="hero"
          slots={heroLiveSlots(locale)}
        />
        {/* every chapter exits with its planet (ChapterStage exit defaults true — 2026-07-07 #5) */}
        {/* P8.5 live-swap: the shared TrustSection reads its constellation domains from the section's
            HYDRATED `portfolio` collection (attached in-service from `section.config`) — preview===live.
            The site injects only motion (`trustLiveSlots` + the animated `TrustConstellation`); the
            works section keeps its own `projects` fetch. */}
        <ChapterStage id="trust" minHeightVh={CHAPTER_HEIGHTS.trust}>
          <TrustSection
            section={findSection(page, 'trust') ?? FALLBACK_TRUST_SECTION}
            locale={locale}
            mode="live"
            slots={trustLiveSlots}
            Constellation={TrustConstellation}
          />
        </ChapterStage>
        {/* P8.5 live-swap (Phase 3): the shared ServicesSection reads its cards from the section's
            HYDRATED `services` collection (attached in-service from `section.config`) — preview===live.
            The site injects only motion (`servicesLiveSlots`); no `services` prop, no separate fetch. */}
        <ChapterStage id="services" minHeightVh={CHAPTER_HEIGHTS.services}>
          <ServicesSection
            section={findSection(page, 'services') ?? FALLBACK_SERVICES_SECTION}
            locale={locale}
            mode="live"
            slots={servicesLiveSlots}
          />
        </ChapterStage>
        {/* P8.5 live-swap #2: the shared ProcessSection; the "phases as moons" live visualization
            is injected via its `System` prop (ProcessMoons), the admin preview draws static cards. */}
        <ChapterStage id="process" minHeightVh={CHAPTER_HEIGHTS.process}>
          <ProcessSection
            section={findSection(page, 'process') ?? FALLBACK_PROCESS_SECTION}
            locale={locale}
            mode="live"
            slots={processLiveSlots}
            System={ProcessMoons}
          />
        </ChapterStage>
        {/* P8.5 live-swap: the shared WorksSection renders the WEB10 orbit — the SAME component the
            CMS preview shows (preview===live). It owns its own pin/orbit via the injected `Orbit`
            (`WorksOrbit`); `anchorId="works"` keeps the hero/CTA `#works` anchor resolving; the cards
            + covers come from the section's hydrated `portfolio` collection (`resolveWorkCover`). */}
        <WorksSection
          section={workSection}
          locale={locale}
          mode="live"
          anchorId="works"
          resolveImageUrl={resolveMedia}
          slots={worksLiveSlots}
          Orbit={WorksOrbit}
        />
        {/* P8.5 live-swap: the shared StatsSection inside the ChapterStage (which owns the
            `data-chapter="stats"` planet-dock + drives the injected `.lp-flow` reveal). */}
        <ChapterStage id="stats" minHeightVh={CHAPTER_HEIGHTS.stats}>
          <StatsSection
            section={findSection(page, 'stats') ?? FALLBACK_STATS_SECTION}
            locale={locale}
            mode="live"
            slots={statsLiveSlots}
          />
        </ChapterStage>
        {/* P8.5 live-swap: the shared TestimonialsSection reads its quote cards from the section's
            HYDRATED `testimonials` collection (attached in-service from `section.config`) —
            preview===live. Author avatars are pre-resolved onto `avatarUrl` (RSC-safe); the site
            injects only motion (`testimonialsLiveSlots`). */}
        <ChapterStage
          id="testimonials"
          minHeightVh={CHAPTER_HEIGHTS.testimonials}
        >
          <TestimonialsSection
            section={testimonialsSection}
            locale={locale}
            mode="live"
            slots={testimonialsLiveSlots}
            resolveImageUrl={resolveMedia}
          />
        </ChapterStage>
        {/* P8.5 live-swap: the shared BlogSection reads its log rows from the section's HYDRATED
            `blog` collection (published-only on the public path) — preview===live. Covers are
            pre-resolved onto `coverUrl`; the row + "all" comet-flight links are injected via the
            dedicated `RowLink`/`AllLink` props (client refs — RSC-safe, server→server). */}
        <ChapterStage id="blog" minHeightVh={CHAPTER_HEIGHTS.blog}>
          <BlogSection
            section={blogSection}
            locale={locale}
            mode="live"
            slots={blogLiveSlots}
            resolveImageUrl={resolveMedia}
            RowLink={blogRowLink(locale)}
            AllLink={blogAllLink(locale)}
          />
        </ChapterStage>
        {/* P8.5 live-swap #2: the shared CtaSection inside the ChapterStage (which owns the
            `data-chapter="cta"` planet-dock + fades the injected `data-chapter-veil` chrome). */}
        <ChapterStage id="cta" minHeightVh={CHAPTER_HEIGHTS.cta}>
          <CtaSection
            section={findSection(page, 'cta') ?? FALLBACK_CTA_SECTION}
            locale={locale}
            mode="live"
            slots={ctaLiveSlots(locale)}
          />
        </ChapterStage>
        <ImpactSection />
        <FooterFinale locale={locale} data={finaleData} />
      </div>
    </SystemStage>
  );
}
