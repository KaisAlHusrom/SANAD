import type { ModelConfig } from '@sanad/database';
import {
  sectionTable,
  sectionTranslationTable,
} from '../../../../db/schema/index.js';

/** Section model config (N1). eyebrow/title/subtitle are translatable (N5). */
export const sectionModelConfig: ModelConfig<typeof sectionTable> = {
  table: sectionTable,
  fillable: ['pageId', 'type', 'sortOrder', 'published', 'config'],
  softDeletes: true,
  translatable: {
    table: sectionTranslationTable,
    foreignKey: 'sectionId',
    fields: ['eyebrow', 'title', 'subtitle'],
  },
};
