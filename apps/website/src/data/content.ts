import type { PageTree } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read a CMS page tree by slug (WEB1/WEB2) — the public, unauthenticated gateway read the
 * website renders via the shared `SectionRenderer`. Cached + tagged per slug so an admin
 * publish can revalidate just that page.
 */
export function getPage(slug: string): Promise<PageTree> {
  return fetchEnvelope<PageTree>(`/content/pages/${encodeURIComponent(slug)}`, {
    revalidate: 60,
    tags: ['content', `page:${slug}`],
  });
}
