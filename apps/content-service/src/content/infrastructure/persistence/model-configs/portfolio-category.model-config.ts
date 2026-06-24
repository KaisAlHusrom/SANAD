import type { ModelConfig } from '@sanad/database';
import {
  portfolioCategoryTable,
  portfolioCategoryTranslationTable,
} from '../../../../db/schema/index.js';

/** Portfolio-category model config (N1). name is translatable (N5). */
export const portfolioCategoryModelConfig: ModelConfig<
  typeof portfolioCategoryTable
> = {
  table: portfolioCategoryTable,
  fillable: ['slug', 'sortOrder'],
  softDeletes: true,
  translatable: {
    table: portfolioCategoryTranslationTable,
    foreignKey: 'portfolioCategoryId',
    fields: ['name'],
  },
};
