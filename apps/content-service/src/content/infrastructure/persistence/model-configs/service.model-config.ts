import type { ModelConfig } from '@sanad/database';
import {
  serviceTable,
  serviceTranslationTable,
} from '../../../../db/schema/index.js';

/** Service model config (N1). title/summary/detailBody are translatable (N5). */
export const serviceModelConfig: ModelConfig<typeof serviceTable> = {
  table: serviceTable,
  fillable: ['slug', 'iconKey', 'category', 'coverMediaId', 'sortOrder'],
  softDeletes: true,
  translatable: {
    table: serviceTranslationTable,
    foreignKey: 'serviceId',
    fields: ['title', 'summary', 'detailBody'],
  },
};
