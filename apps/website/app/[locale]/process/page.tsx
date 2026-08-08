import type { Metadata } from 'next';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getPage } from '../../../src/data/content';
import {
  ProcessIndex,
  PROCESS_COPY,
  copy,
} from '../../../src/components/marketing';
import { FALLBACK_PROCESS_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';
import { SystemStage } from '../../../src/motion/universe';

/**
 * The Process page (`/process`) — a Phase-5 HYBRID CMS page: `getPage('process')` feeds the editable
 * hero + closing-CTA `richtext` bands (shared `@sanad/web-ui` `SectionRenderer`, `mode='live'`, so the
 * admin Content Studio edits the SAME components) rendered AROUND the coded `<ProcessIndex>` body
 * (the phased-delivery timeline — no CMS entity for it). Degrades to `FALLBACK_PROCESS_SECTIONS` (from
 * `PROCESS_COPY`) if the gateway is unreachable (F3/F7). Idles in the process "Waypoints" system (WEB12).
 */
type Params = Promise<{ locale: string }>;

async function loadProcess(params: Params) {
  const { locale } = await params;
  const page = await getPage('process').catch(() => null);
  const sections = page?.sections ?? FALLBACK_PROCESS_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadProcess(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(PROCESS_COPY.hero.eyebrow, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(PROCESS_COPY.hero.subtitle, locale),
  };
}

export default async function ProcessPage({ params }: { params: Params }) {
  const { locale, sections } = await loadProcess(params);

  return (
    <SystemStage system="process">
      <div className="site-content">
        <div className="mk-cms mk-cms--hero">
          <SectionRenderer
            sections={sections.slice(0, 1)}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
          />
        </div>
        <ProcessIndex locale={locale} />
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
