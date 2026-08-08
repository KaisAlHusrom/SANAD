import type { Metadata } from 'next';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getPage } from '../../../src/data/content';
import { CAREERS_COPY, copy } from '../../../src/components/marketing';
import { FALLBACK_CAREERS_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';
import { SystemStage } from '../../../src/motion/universe';

/**
 * The Careers page (`/careers`) — a Phase-5 FULL CMS page (WEB1/WEB2): `getPage('careers')` feeds
 * four editable `richtext` bands (hero + culture + openings + closing CTA) rendered through the
 * shared `@sanad/web-ui` `SectionRenderer` (`mode='live'`, so the admin Content Studio edits the
 * SAME components). The coded `CareersIndex` card grid was retired for full editability (mirrors how
 * `/about` retired `AboutIndex`); culture/openings are now editable `richtext` prose. Degrades to
 * `FALLBACK_CAREERS_SECTIONS` (from `CAREERS_COPY`) if the gateway is unreachable (F3/F7). No jobs
 * entity exists yet (deferred to the HR service, P12). Idles in the `contact` "Beacon" system (WEB12).
 */
type Params = Promise<{ locale: string }>;

async function loadCareers(params: Params) {
  const { locale } = await params;
  const page = await getPage('careers').catch(() => null);
  const sections = page?.sections ?? FALLBACK_CAREERS_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadCareers(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(CAREERS_COPY.hero.eyebrow, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(CAREERS_COPY.hero.subtitle, locale),
  };
}

export default async function CareersPage({ params }: { params: Params }) {
  const { locale, sections } = await loadCareers(params);

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
