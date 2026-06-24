import type { ModelConfig } from '@sanad/database';
import {
  blogTagTable,
  blogTagTranslationTable,
} from '../../../../db/schema/index.js';

/** Blog-tag model config (N1). name is translatable (N5). */
export const blogTagModelConfig: ModelConfig<typeof blogTagTable> = {
  table: blogTagTable,
  fillable: ['slug', 'sortOrder'],
  softDeletes: true,
  translatable: {
    table: blogTagTranslationTable,
    foreignKey: 'blogTagId',
    fields: ['name'],
  },
};
