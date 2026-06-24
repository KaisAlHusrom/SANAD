import type { ModelConfig } from '@sanad/database';
import { settingTable } from '../../db/schema/index.js';

/** The setting catalog/descriptor model config (N1). Soft-deletes on. */
export const settingModelConfig: ModelConfig<typeof settingTable> = {
  table: settingTable,
  fillable: [
    'key',
    'group',
    'type',
    'requirement',
    'scope',
    'options',
    'defaultValue',
  ],
  softDeletes: true,
};
