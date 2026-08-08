import type { Metadata } from 'next';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getDictionary } from '../../../src/i18n';
import { getPage } from '../../../src/data/content';
import { submitLeadAction } from '../../../src/data/lead-action';
import {
  RequestForm,
  REQUEST_COPY,
  copy,
} from '../../../src/components/marketing';
import { FALLBACK_REQUEST_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';
import { SystemStage } from '../../../src/motion/universe';

/**
 * The request-a-project page (`/request-a-project`, WEB1/WEB2) — the flagship conversion surface, now
 * a Phase-5 CMS-chrome page: `getPage('request-a-project')` feeds a single editable `richtext` hero
 * band (shared `@sanad/web-ui` `SectionRenderer`, `mode='live'`, edited in the admin Content Studio)
 * above the KEPT bespoke multi-step `RequestForm` — the form → `submitLeadAction` → `POST /leads`
 * (`source: 'request-project'`) → `lead.created` path (MS3) is untouched; the wizard is the CTA, so
 * the hero carries no CTA block. Degrades to `FALLBACK_REQUEST_SECTIONS` (from `REQUEST_COPY`) if the
 * gateway is unreachable (F3/F7). Idles in the request "Launchpad" star system (WEB12).
 */
type Params = Promise<{ locale: string }>;

async function loadRequest(params: Params) {
  const { locale } = await params;
  const page = await getPage('request-a-project').catch(() => null);
  const sections = page?.sections ?? FALLBACK_REQUEST_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadRequest(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(REQUEST_COPY.hero.title, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(REQUEST_COPY.hero.subtitle, locale),
  };
}

export default async function RequestProjectPage({
  params,
}: {
  params: Params;
}) {
  const { locale, sections } = await loadRequest(params);
  const dict = getDictionary(locale);

  return (
    <SystemStage system="request">
      <div className="site-content">
        <div className="mk-cms mk-cms--hero">
          <SectionRenderer
            sections={sections}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
          />
        </div>
        <div className="mk-page mk-request-page">
          <section className="lp-section mk-request-section">
            <div className="lp-shell">
              <RequestForm
                locale={locale}
                dict={dict}
                onSubmit={submitLeadAction}
              />
            </div>
          </section>
        </div>
      </div>
    </SystemStage>
  );
}
