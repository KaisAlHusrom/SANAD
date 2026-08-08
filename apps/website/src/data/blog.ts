import type {
  BlogCategoryItem,
  BlogPostItem,
  Paginated,
} from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read the latest published posts for the landing's blog teaser (WEB1). The public gateway read
 * forces `status=published`, so the seed's draft post is excluded and the teaser shows its empty
 * state (F3) until posts are published. Cached + tagged. Default 3 — the teaser shows three.
 */
export async function getBlogTeaser(limit = 3): Promise<BlogPostItem[]> {
  const page = await fetchEnvelope<Paginated<BlogPostItem>>(
    `/content/blog?pageSize=${limit}`,
    { revalidate: 60, tags: ['content', 'blog'] },
  );
  return page.items;
}

/**
 * Read the published posts the `/blog` index renders (WEB1). The public gateway read forces
 * `status=published` server-side, so drafts never leak. Cached + tagged. Default 24 — the index
 * shows the full list; the index filters by category client-side (the post list only supports
 * `categoryId`/`search` server-side). Returns just the items — the caller degrades to `[]` (F3).
 */
export async function getBlogPosts(limit = 24): Promise<BlogPostItem[]> {
  const page = await fetchEnvelope<Paginated<BlogPostItem>>(
    `/content/blog?pageSize=${limit}`,
    { revalidate: 60, tags: ['content', 'blog'] },
  );
  return page.items;
}

/**
 * Read a single published post by slug for the article page (WEB1/WEB2), via the public
 * `GET /content/blog/:slug`. Cached + tagged so an admin edit revalidates it. The caller
 * `.catch`es a miss → `notFound()` (F3).
 */
export async function getBlogPost(slug: string): Promise<BlogPostItem> {
  return fetchEnvelope<BlogPostItem>(`/content/blog/${slug}`, {
    revalidate: 60,
    tags: ['content', 'blog', `blog:${slug}`],
  });
}

/**
 * Read the blog categories that back the index filter chips (WEB1), via the public
 * `GET /content/blog-categories`. Cached + tagged. Returns just the items — the index derives the
 * chip set (plus an "all" pseudo-filter) client-side. Degrades to `[]` at the call site so the
 * grid still renders unfiltered (F3).
 */
export async function getBlogCategories(): Promise<BlogCategoryItem[]> {
  const page = await fetchEnvelope<Paginated<BlogCategoryItem>>(
    `/content/blog-categories?pageSize=50`,
    { revalidate: 60, tags: ['content', 'blog-categories'] },
  );
  return page.items;
}
