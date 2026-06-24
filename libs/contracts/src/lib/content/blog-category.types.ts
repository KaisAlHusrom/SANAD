import type { LocalizedText } from '../common/localized-text.js';

/**
 * A blog category as the gateway returns it (the blog index filter, WEB1). A translatable
 * lookup: `slug` (unique) + `name` (+ optional `description`) in BOTH locales (`LocalizedText`,
 * null-safe — F7). Pure shape (U16).
 */
export interface BlogCategoryItem {
  id: string;
  slug: string;
  sortOrder: number;
  name: LocalizedText;
  description: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
