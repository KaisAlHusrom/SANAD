import type { ModelConfig } from '@sanad/database';
import {
  pageTable,
  pageTranslationTable,
} from '../../../../db/schema/index.js';

/** Page model config (N1). Soft-deletes on; title + SEO meta are translatable (N5). */
export const pageModelConfig: ModelConfig<typeof pageTable> = {
  table: pageTable,
  fillable: ['slug', 'status', 'sortOrder'],
  softDeletes: true,
  translatable: {
    table: pageTranslationTable,
    foreignKey: 'pageId',
    fields: ['title', 'metaTitle', 'metaDescription'],
  },
};
