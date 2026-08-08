import type { Metadata } from 'next';
import { pickLocalized, type Locale } from '@sanad/contracts';
import { SectionRenderer } from '@sanad/web-ui';
import { getPage } from '../../../src/data/content';
import { getBlogPosts, getBlogCategories } from '../../../src/data/blog';
import { BlogIndex, BLOG_COPY, copy } from '../../../src/components/marketing';
import { FALLBACK_BLOG_SECTIONS } from '../../../src/components/marketing/marketing-fallback-sections';
import { marketingLiveSlots } from '../../../src/components/marketing/marketing-live-slots';
import { SystemStage } from '../../../src/motion/universe';

/**
 * The Blog index (`/blog`) — a Phase-5 HYBRID CMS page: `getPage('blog')` feeds the editable hero +
 * closing-CTA `richtext` bands (shared `@sanad/web-ui` `SectionRenderer`, `mode='live'` — preview===live
 * in the studio) rendered AROUND the DB-driven `<BlogIndex>` body (the full filtered article list from
 * the `blog_post` collection). Degrades to `FALLBACK_BLOG_SECTIONS` (from `BLOG_COPY`) if the gateway is
 * unreachable (F3/F7). Idles in the blog "Logbook" star system (WEB12).
 */
type Params = Promise<{ locale: string }>;

async function loadBlog(params: Params) {
  const { locale } = await params;
  const page = await getPage('blog').catch(() => null);
  const sections = page?.sections ?? FALLBACK_BLOG_SECTIONS;
  return { locale: locale as Locale, page, sections };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, page } = await loadBlog(params);
  return {
    title:
      (page
        ? pickLocalized(page.metaTitle, locale) ||
          pickLocalized(page.title, locale)
        : '') || copy(BLOG_COPY.hero.eyebrow, locale),
    description:
      (page ? pickLocalized(page.metaDescription, locale) : '') ||
      copy(BLOG_COPY.hero.subtitle, locale),
  };
}

export default async function BlogPage({ params }: { params: Params }) {
  const { locale, sections } = await loadBlog(params);
  const [posts, categories] = await Promise.all([
    getBlogPosts(24).catch(() => []),
    getBlogCategories().catch(() => []),
  ]);

  return (
    <SystemStage system="blog">
      <div className="site-content">
        <div className="mk-cms mk-cms--hero">
          <SectionRenderer
            sections={sections.slice(0, 1)}
            locale={locale}
            mode="live"
            slots={marketingLiveSlots}
          />
        </div>
        <BlogIndex posts={posts} categories={categories} locale={locale} />
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
