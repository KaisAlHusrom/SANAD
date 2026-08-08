import type { MetadataRoute } from 'next';
import { getBranding } from '../src/data/branding';
import { siteUrl } from '../src/branding/company-info';

/**
 * `robots.txt`, driven by the admin SEO settings. The sitemap line is only emitted once a site
 * url is configured — advertising a sitemap on an unknown origin would point crawlers at a
 * broken URL (F7).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const branding = await getBranding().catch(() => null);
  const origin = siteUrl(branding);
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(origin ? { sitemap: `${origin}/sitemap.xml`, host: origin } : {}),
  };
}
