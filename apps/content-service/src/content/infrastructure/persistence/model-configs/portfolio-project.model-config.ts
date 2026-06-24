import type { ModelConfig } from '@sanad/database';
import {
  portfolioProjectTable,
  portfolioProjectTranslationTable,
} from '../../../../db/schema/index.js';

/** Portfolio-project model config (N1). title/summary/challenge/solution/result are translatable (N5). */
export const portfolioProjectModelConfig: ModelConfig<
  typeof portfolioProjectTable
> = {
  table: portfolioProjectTable,
  fillable: [
    'slug',
    'categoryId',
    'coverMediaId',
    'clientName',
    'projectUrl',
    'status',
    'publishedAt',
    'featured',
    'sortOrder',
  ],
  softDeletes: true,
  translatable: {
    table: portfolioProjectTranslationTable,
    foreignKey: 'portfolioProjectId',
    fields: ['title', 'summary', 'challenge', 'solution', 'result'],
  },
};
