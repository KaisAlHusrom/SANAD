import type { Metadata } from 'next';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getPage } from '../../../src/data/content';
import { getServices } from '../../../src/data/services';
import {
  ServicesIndex,
  SERVICES_COPY,
  copy,
} from '../../../src/components/marketing';
import { FALLBACK_SERVICES_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';
import { SystemStage } from '../../../src/motion/universe';

/**
 * The Services index (`/services`) — a Phase-5 HYBRID CMS page: `getPage('services')` feeds the editable
 * hero + closing-CTA `richtext` bands (shared `@sanad/web-ui` `SectionRenderer`, `mode='live'` —
 * preview===live in the studio) rendered AROUND the DB-driven `<ServicesIndex>` body (the CMS `service`
 * grid + supporting/method/tech bands). Degrades to `FALLBACK_SERVICES_SECTIONS` (from `SERVICES_COPY`)
 * if the gateway is unreachable (F3/F7).
 */
type Params = Promise<{ locale: string }>;

async function loadServices(params: Params) {
  const { locale } = await params;
  const page = await getPage('services').catch(() => null);
  const sections = page?.sections ?? FALLBACK_SERVICES_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadServices(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(SERVICES_COPY.hero.eyebrow, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(SERVICES_COPY.hero.subtitle, locale),
  };
}

export default async function ServicesPage({ params }: { params: Params }) {
  const { locale, sections } = await loadServices(params);
  const services = await getServices().catch(() => []);

  return (
    <SystemStage system="services">
      <div className="site-content">
        <div className="mk-cms mk-cms--hero">
          <SectionRenderer
            sections={sections.slice(0, 1)}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
          />
        </div>
        <ServicesIndex services={services} locale={locale} />
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
