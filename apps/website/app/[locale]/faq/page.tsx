import type { Metadata } from 'next';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getPage } from '../../../src/data/content';
import { FAQ_COPY, copy } from '../../../src/components/marketing';
import { FALLBACK_FAQ_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';
import { SystemStage } from '../../../src/motion/universe';

/**
 * The FAQ page (`/faq`) — an editable CMS page tree (Phase 5): `getPage('faq')` feeds the shared
 * `@sanad/web-ui` sections (`richtext` chrome + a hydrated `faq` accordion) via `SectionRenderer` in
 * `mode='live'`, so the admin Content Studio edits the SAME components (preview===live). Degrades to
 * the coded `FALLBACK_FAQ_SECTIONS` (from `FAQ_COPY`) if the gateway is unreachable (F3/F7). Idles in
 * the `contact` "Beacon" star system (WEB12) — FAQ is part of the "reach out / we answer" cluster.
 */
type Params = Promise<{ locale: string }>;

async function loadFaq(params: Params) {
  const { locale } = await params;
  const page = await getPage('faq').catch(() => null);
  const sections = page?.sections ?? FALLBACK_FAQ_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadFaq(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(FAQ_COPY.hero.eyebrow, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(FAQ_COPY.hero.subtitle, locale),
  };
}

export default async function FaqPage({ params }: { params: Params }) {
  const { locale, sections } = await loadFaq(params);

  return (
    <SystemStage system="contact">
      <div className="site-content">
        <div className="mk-cms">
          <SectionRenderer
            sections={sections}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
          />
        </div>
      </div>
    </SystemStage>
  );
}
