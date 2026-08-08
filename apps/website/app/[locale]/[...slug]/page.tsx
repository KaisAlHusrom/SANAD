import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getPage } from '../../../src/data/content';
import { resolveMediaUrls } from '../../../src/data/media';
import { collectImageIds, makeImageResolver } from '../../../src/media';
import { SystemStage } from '../../../src/motion/universe';

/**
 * A generic CMS page (legal / custom pages) rendered from the DB via the shared
 * `SectionRenderer` in `mode='live'` (WEB1/WEB2). The bespoke marketing pages (landing/
 * about/services) are coded sections fed by typed endpoints in later stages — this catch-all
 * is the admin-built arbitrary-page surface. Image blocks fall back to the renderer's
 * placeholder until the public media resolver lands (8.B).
 */
type Params = Promise<{ locale: string; slug: string[] }>;

async function loadPage(params: Params) {
  const { locale, slug } = await params;
  const path = (slug ?? []).join('/');
  const page = await getPage(path).catch(() => null);
  return { locale: locale as Locale, page };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadPage(params);
  if (!page) return {};
  return {
    title:
      pickLocalized(page.metaTitle, locale) ||
      pickLocalized(page.title, locale),
    description: pickLocalized(page.metaDescription, locale),
  };
}

export default async function CmsPage({ params }: { params: Params }) {
  const { locale, page } = await loadPage(params);
  if (!page) notFound();

  // Resolve every image block's media id → CDN url in one batch (WEB1); unresolved ids fall
  // back to the renderer's placeholder (F3).
  const media = await resolveMediaUrls(collectImageIds(page.sections));

  return (
    <SystemStage system="ambient">
      <div className="site-content site-page">
        <SectionRenderer
          sections={page.sections}
          locale={locale}
          mode="live"
          resolveImageUrl={makeImageResolver(media)}
        />
      </div>
    </SystemStage>
  );
}
