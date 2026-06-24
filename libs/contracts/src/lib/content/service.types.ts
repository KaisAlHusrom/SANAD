import type { LocalizedText } from '../common/localized-text.js';
import type { ServiceCategory } from './service-category.zod.types.js';

/**
 * A service/capability as the gateway returns it (WEB1). Translatable `title`/`summary`/
 * `detailBody` are carried in BOTH locales (`LocalizedText`, null-safe — F7). `coverMediaId`
 * is a soft reference to a media asset (NOT a cross-service FK, MS5). Pure shape (U16).
 */
export interface ServiceItem {
  id: string;
  slug: string;
  iconKey: string | null;
  category: ServiceCategory;
  coverMediaId: string | null;
  sortOrder: number;
  title: LocalizedText;
  summary: LocalizedText;
  detailBody: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
