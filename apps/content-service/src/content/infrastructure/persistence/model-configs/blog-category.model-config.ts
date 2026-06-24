import type { ModelConfig } from '@sanad/database';
import {
  blogCategoryTable,
  blogCategoryTranslationTable,
} from '../../../../db/schema/index.js';

/** Blog-category model config (N1). name/description are translatable (N5). */
export const blogCategoryModelConfig: ModelConfig<typeof blogCategoryTable> = {
  table: blogCategoryTable,
  fillable: ['slug', 'sortOrder'],
  softDeletes: true,
  translatable: {
    table: blogCategoryTranslationTable,
    foreignKey: 'blogCategoryId',
    fields: ['name', 'description'],
  },
};
