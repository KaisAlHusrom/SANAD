import type { LocalizedText } from '../common/localized-text.js';
import type { BlogPostStatus } from './blog-post-status.zod.types.js';

/**
 * A lightweight reference (id + slug + localized name) embedded in a blog-post read
 * (embed-on-read) — used for the post's category, author, and each tag, so the website/admin
 * render labels from one fetch without a second round trip.
 */
export interface BlogEntityRef {
  id: string;
  slug: string;
  name: LocalizedText;
}

/**
 * A blog post as the gateway returns it (WEB1). The translatable `title`/`excerpt`/`body` are
 * carried in BOTH locales (`LocalizedText`, null-safe — F7). `category`, `author`, and `tags`
 * are embedded (embed-on-read) — null/[] when unset. `coverMediaId` is a soft media reference
 * (MS5). `publishedAt` is set the first time the post is published; `readMinutes` is an optional
 * reading-time estimate. Pure shape (U16).
 */
export interface BlogPostItem {
  id: string;
  slug: string;
  category: BlogEntityRef | null;
  author: BlogEntityRef | null;
  tags: BlogEntityRef[];
  coverMediaId: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  readMinutes: number | null;
  sortOrder: number;
  title: LocalizedText;
  excerpt: LocalizedText;
  body: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
