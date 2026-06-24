import type { LocalizedText } from '../common/localized-text.js';

/**
 * A blog tag as the gateway returns it (WEB1). A translatable lookup: `slug` (unique) + `name`
 * in BOTH locales (`LocalizedText`, null-safe — F7). Pure shape (U16).
 */
export interface BlogTagItem {
  id: string;
  slug: string;
  sortOrder: number;
  name: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
