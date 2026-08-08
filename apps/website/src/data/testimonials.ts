import type { Paginated, TestimonialItem } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read the client testimonials the landing's testimonials section renders (WEB1). Public
 * gateway read; cached + tagged. Default 4 covers the 2-up layout with headroom.
 */
export async function getTestimonials(limit = 4): Promise<TestimonialItem[]> {
  const page = await fetchEnvelope<Paginated<TestimonialItem>>(
    `/content/testimonials?pageSize=${limit}`,
    { revalidate: 60, tags: ['content', 'testimonials'] },
  );
  return page.items;
}
