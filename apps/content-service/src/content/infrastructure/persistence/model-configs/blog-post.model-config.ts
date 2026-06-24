import type { ModelConfig } from '@sanad/database';
import {
  blogPostTable,
  blogPostTranslationTable,
} from '../../../../db/schema/index.js';

/** Blog-post model config (N1). title/excerpt/body are translatable (N5). */
export const blogPostModelConfig: ModelConfig<typeof blogPostTable> = {
  table: blogPostTable,
  fillable: [
    'slug',
    'categoryId',
    'authorTeamMemberId',
    'coverMediaId',
    'status',
    'publishedAt',
    'readMinutes',
    'sortOrder',
  ],
  softDeletes: true,
  translatable: {
    table: blogPostTranslationTable,
    foreignKey: 'blogPostId',
    fields: ['title', 'excerpt', 'body'],
  },
};
