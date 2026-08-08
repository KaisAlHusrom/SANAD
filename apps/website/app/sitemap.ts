import type { MetadataRoute } from 'next';
import { LOCALES } from '@sanad/contracts';
import { getBranding } from '../src/data/branding';
import { siteUrl } from '../src/branding/company-info';

/**
 * The stable marketing routes, listed for every locale. Seeded CMS pages (privacy/terms) are
 * included because they are fixed slugs; admin-authored pages and blog posts are NOT enumerated
 * yet — the website data layer has no list read, so adding them would need a new gateway
 * endpoint (tracked as a follow-up rather than guessed at here).
 */
const ROUTES: readonly string[] = [
  '',
  '/about',
  '/services',
  '/portfolio',
  '/process',
  '/blog',
  '/faq',
  '/careers',
  '/contact',
  '/request-a-project',
  '/privacy',
  '/terms',
];

/**
 * `sitemap.xml`, driven by the admin SEO site url. Returns an empty sitemap until a site url is
 * configured — emitting relative or `localhost` URLs would publish a broken sitemap (F7). Each
 * route is listed per locale with `alternates.languages` so search engines pair the ar/en pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const branding = await getBranding().catch(() => null);
  const origin = siteUrl(branding);
  if (!origin) return [];

  return ROUTES.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: `${origin}/${locale}${route}`,
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((alt) => [alt, `${origin}/${alt}${route}`]),
        ),
      },
    })),
  );
}
