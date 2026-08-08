import type { Metadata } from 'next';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getPage } from '../../../src/data/content';
import {
  getPortfolio,
  getPortfolioCategories,
} from '../../../src/data/portfolio';
import {
  PortfolioIndex,
  PORTFOLIO_COPY,
  copy,
} from '../../../src/components/marketing';
import { FALLBACK_PORTFOLIO_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';
import { SystemStage } from '../../../src/motion/universe';

/**
 * The Portfolio index (`/portfolio`) — a Phase-5 HYBRID CMS page: `getPage('portfolio')` feeds the
 * editable hero + closing-CTA `richtext` bands (shared `@sanad/web-ui` `SectionRenderer`, `mode='live'`
 * — preview===live in the studio) rendered AROUND the DB-driven `<PortfolioIndex>` gallery (the full
 * filtered case-study grid, 100% from the `portfolio_project` collection). Degrades to
 * `FALLBACK_PORTFOLIO_SECTIONS` (from `PORTFOLIO_COPY`) if the gateway is unreachable (F3/F7). Idles in
 * the works "Galaxy" star system (WEB12).
 */
type Params = Promise<{ locale: string }>;

async function loadPortfolio(params: Params) {
  const { locale } = await params;
  const page = await getPage('portfolio').catch(() => null);
  const sections = page?.sections ?? FALLBACK_PORTFOLIO_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadPortfolio(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(PORTFOLIO_COPY.hero.eyebrow, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(PORTFOLIO_COPY.hero.subtitle, locale),
  };
}

export default async function PortfolioPage({ params }: { params: Params }) {
  const { locale, sections } = await loadPortfolio(params);
  // the index shows the full gallery — read more than the landing orbit's handful
  const [projects, categories] = await Promise.all([
    getPortfolio(24).catch(() => []),
    getPortfolioCategories().catch(() => []),
  ]);

  return (
    <SystemStage system="works">
      <div className="site-content">
        <div className="mk-cms mk-cms--hero">
          <SectionRenderer
            sections={sections.slice(0, 1)}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
          />
        </div>
        <PortfolioIndex
          projects={projects}
          categories={categories}
          locale={locale}
        />
        <div className="mk-cms mk-cms--tail">
          <SectionRenderer
            sections={sections.slice(1)}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
          />
        </div>
      </div>
    </SystemStage>
  );
}
