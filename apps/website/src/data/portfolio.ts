import type {
  Paginated,
  PortfolioCategoryItem,
  PortfolioProjectItem,
} from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read the published case studies the WEB10 orbiting-works section AND the `/portfolio` index
 * render (WEB1). The public gateway read forces `status=published` server-side, so drafts never
 * leak. Cached + tagged. Default 6 — the landing orbit reads best with a handful; the portfolio
 * index passes a larger limit to show the full gallery. The caller slices.
 */
export async function getPortfolio(limit = 6): Promise<PortfolioProjectItem[]> {
  const page = await fetchEnvelope<Paginated<PortfolioProjectItem>>(
    `/content/portfolio?pageSize=${limit}`,
    { revalidate: 60, tags: ['content', 'portfolio'] },
  );
  return page.items;
}

/**
 * Read a single published case study by slug for the detail page (WEB1/WEB2), via the public
 * `GET /content/portfolio/:slug`. Cached + tagged so an admin edit revalidates it. The caller
 * `.catch`es a miss → `notFound()` (F3).
 */
export async function getPortfolioProject(
  slug: string,
): Promise<PortfolioProjectItem> {
  return fetchEnvelope<PortfolioProjectItem>(`/content/portfolio/${slug}`, {
    revalidate: 60,
    tags: ['content', 'portfolio', `portfolio:${slug}`],
  });
}

/**
 * Read the portfolio categories that back the index filter chips (WEB1), via the public
 * `GET /content/portfolio-categories`. Cached + tagged. Returns just the items — the index
 * derives the chip set (plus an "all" pseudo-filter) client-side. Degrades to `[]` at the call
 * site so the grid still renders unfiltered (F3).
 */
export async function getPortfolioCategories(): Promise<
  PortfolioCategoryItem[]
> {
  const page = await fetchEnvelope<Paginated<PortfolioCategoryItem>>(
    `/content/portfolio-categories?pageSize=50`,
    { revalidate: 60, tags: ['content', 'portfolio-categories'] },
  );
  return page.items;
}
