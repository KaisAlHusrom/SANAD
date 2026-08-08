import type { Metadata } from 'next';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getDictionary } from '../../../src/i18n';
import { getPage } from '../../../src/data/content';
import { LeadForm } from '../../../src/components/lead-form';
import { CONTACT_COPY, copy } from '../../../src/components/marketing';
import { FALLBACK_CONTACT_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';
import { submitLeadAction } from '../../../src/data/lead-action';
import { SystemStage } from '../../../src/motion/universe';

/**
 * The contact page (`/contact`, WEB1/WEB2) — a Phase-5 CMS-chrome page: `getPage('contact')` feeds a
 * single editable `richtext` hero band (shared `@sanad/web-ui` `SectionRenderer`, `mode='live'`, so
 * the admin Content Studio edits it) above the KEPT bespoke schema-validated `LeadForm` — the form →
 * `submitLeadAction` → `POST /leads` → `lead.created` path (MS3) is untouched. Degrades to
 * `FALLBACK_CONTACT_SECTIONS` (from `CONTACT_COPY`) if the gateway is unreachable (F3/F7). Idles in
 * the `contact` "Beacon" star system (WEB12).
 */
type Params = Promise<{ locale: string }>;

async function loadContact(params: Params) {
  const { locale } = await params;
  const page = await getPage('contact').catch(() => null);
  const sections = page?.sections ?? FALLBACK_CONTACT_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadContact(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(CONTACT_COPY.hero.title, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(CONTACT_COPY.hero.subtitle, locale),
  };
}

export default async function ContactPage({ params }: { params: Params }) {
  const { locale, sections } = await loadContact(params);
  const dict = getDictionary(locale);

  return (
    <SystemStage system="contact">
      <div className="site-content">
        <div className="mk-cms mk-cms--hero">
          <SectionRenderer
            sections={sections}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
          />
        </div>
        <LeadForm locale={locale} dict={dict} onSubmit={submitLeadAction} />
      </div>
    </SystemStage>
  );
}
