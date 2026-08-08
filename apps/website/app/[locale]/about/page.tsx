import type { Metadata } from 'next';
import { pickLocalized, type Locale, type SectionNode } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getPage } from '../../../src/data/content';
import { resolveMediaUrls } from '../../../src/data/media';
import { collectImageIds, makeImageResolver } from '../../../src/media';
import { SystemStage } from '../../../src/motion/universe';
import { ABOUT_COPY, copy } from '../../../src/components/marketing';
import { FALLBACK_ABOUT_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';

/**
 * The About page (`/about`) — an editable CMS page tree (Phase 5): `getPage('about')` feeds the shared
 * `@sanad/web-ui` sections (`richtext` prose + a hydrated `team` roster) via `SectionRenderer` in
 * `mode='live'`, so the admin Content Studio edits the SAME components (preview===live). Degrades to
 * the coded `FALLBACK_ABOUT_SECTIONS` (from `ABOUT_COPY`) if the gateway is unreachable (F3/F7). Team
 * avatars resolve via the public media batch; motion is injected (WEB3/WEB4). Idles in the about
 * "Hearth" star system (WEB12).
 */
type Params = Promise<{ locale: string }>;

async function loadAbout(params: Params) {
  const { locale } = await params;
  const page = await getPage('about').catch(() => null);
  const sections = page?.sections ?? FALLBACK_ABOUT_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

/** Media ids a marketing tree renders — image blocks + hydrated team-member avatars. */
function collectMarketingMediaIds(sections: readonly SectionNode[]): string[] {
  const ids = new Set<string>(collectImageIds(sections));
  for (const section of sections) {
    if (section.collection?.collection === 'team') {
      for (const member of section.collection.items) {
        if (member.avatarMediaId) ids.add(member.avatarMediaId);
      }
    }
  }
  return [...ids];
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadAbout(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(ABOUT_COPY.hero.eyebrow, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(ABOUT_COPY.hero.subtitle, locale),
  };
}

export default async function AboutPage({ params }: { params: Params }) {
  const { locale, sections } = await loadAbout(params);
  const media = await resolveMediaUrls(collectMarketingMediaIds(sections));

  return (
    <SystemStage system="about">
      <div className="site-content">
        <div className="mk-cms">
          <SectionRenderer
            sections={sections}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
            resolveImageUrl={makeImageResolver(media)}
          />
        </div>
      </div>
    </SystemStage>
  );
}
