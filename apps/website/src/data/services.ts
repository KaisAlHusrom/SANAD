import type { Paginated, ServiceItem } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read the published services/capabilities the landing's services grid renders (WEB1). Public,
 * unauthenticated gateway read; returns just the items (the landing never paginates). Cached +
 * tagged so an admin publish can revalidate the collection. Default 8 covers the 4-up grid with
 * headroom; the caller slices to the layout it needs.
 */
export async function getServices(limit = 8): Promise<ServiceItem[]> {
  const page = await fetchEnvelope<Paginated<ServiceItem>>(
    `/content/services?pageSize=${limit}`,
    { revalidate: 60, tags: ['content', 'services'] },
  );
  return page.items;
}

/**
 * Read a single published service/capability by slug for the detail page (WEB1/WEB2), via the
 * public `GET /content/services/:slug`. Cached + tagged so an admin edit revalidates it. The
 * caller `.catch`es a miss → `notFound()` (F3).
 */
export async function getService(slug: string): Promise<ServiceItem> {
  return fetchEnvelope<ServiceItem>(`/content/services/${slug}`, {
    revalidate: 60,
    tags: ['content', 'services', `service:${slug}`],
  });
}
