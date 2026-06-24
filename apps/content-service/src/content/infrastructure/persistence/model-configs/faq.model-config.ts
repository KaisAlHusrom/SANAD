import type { ModelConfig } from '@sanad/database';
import { faqTable, faqTranslationTable } from '../../../../db/schema/index.js';

/** FAQ model config (N1). question/answer are translatable (N5). */
export const faqModelConfig: ModelConfig<typeof faqTable> = {
  table: faqTable,
  fillable: ['category', 'sortOrder'],
  softDeletes: true,
  translatable: {
    table: faqTranslationTable,
    foreignKey: 'faqId',
    fields: ['question', 'answer'],
  },
};
