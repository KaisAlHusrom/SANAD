import type { FaqItem, Paginated } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read the published FAQs the `/faq` page renders (WEB1/WEB2), via the public `GET /content/faqs`.
 * Cached + tagged. Default 50 — the page shows the full list (small); an admin adds more. Returns
 * just the items — the caller degrades to `[]` (F3). The page groups/labels by `category` (an
 * enum: general/pricing/process/support) client-side.
 */
export async function getFaqs(limit = 50): Promise<FaqItem[]> {
  const page = await fetchEnvelope<Paginated<FaqItem>>(
    `/content/faqs?pageSize=${limit}`,
    { revalidate: 60, tags: ['content', 'faqs'] },
  );
  return page.items;
}
