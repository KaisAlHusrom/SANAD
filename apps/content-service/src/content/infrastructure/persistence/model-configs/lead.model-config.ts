import type { ModelConfig } from '@sanad/database';
import { leadTable } from '../../../../db/schema/index.js';

/** Lead model config (N1). Not translatable; soft-deletes on (archive keeps history). */
export const leadModelConfig: ModelConfig<typeof leadTable> = {
  table: leadTable,
  fillable: [
    'name',
    'email',
    'company',
    'budget',
    'projectType',
    'message',
    'source',
    'locale',
    'status',
  ],
  softDeletes: true,
};
