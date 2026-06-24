import type {
  BlogEntityRef,
  BlogPostItem,
  LocalizedText,
} from '@sanad/contracts';
import type { BlogPostRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/**
 * Assemble a blog post with its translatable copy resolved to both locales (F7) and its
 * category, author, and tags embedded (embed-on-read) — null/[] when unset.
 */
export function assembleBlogPost(
  row: BlogPostRow,
  fields: Record<string, LocalizedText> | undefined,
  category: BlogEntityRef | null,
  author: BlogEntityRef | null,
  tags: BlogEntityRef[],
): BlogPostItem {
  return {
    id: row.id,
    slug: row.slug,
    category,
    author,
    tags,
    coverMediaId: row.coverMediaId,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    readMinutes: row.readMinutes,
    sortOrder: row.sortOrder,
    title: fields?.['title'] ?? EMPTY,
    excerpt: fields?.['excerpt'] ?? EMPTY,
    body: fields?.['body'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
