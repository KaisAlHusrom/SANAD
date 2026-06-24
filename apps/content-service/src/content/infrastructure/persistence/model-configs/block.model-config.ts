import type { ModelConfig } from '@sanad/database';
import {
  blockTable,
  blockTranslationTable,
} from '../../../../db/schema/index.js';

/** Block model config (N1). `data` (jsonb) + `imageMediaId` are base; title/body translatable (N5). */
export const blockModelConfig: ModelConfig<typeof blockTable> = {
  table: blockTable,
  fillable: ['sectionId', 'type', 'sortOrder', 'data', 'imageMediaId'],
  softDeletes: true,
  translatable: {
    table: blockTranslationTable,
    foreignKey: 'blockId',
    fields: ['title', 'body'],
  },
};
