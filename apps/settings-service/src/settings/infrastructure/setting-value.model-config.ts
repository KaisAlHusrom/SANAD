import type { ModelConfig } from '@sanad/database';
import { settingValueTable } from '../../db/schema/index.js';

/** The scope-keyed setting-value model config (N1). Soft-deletes on. */
export const settingValueModelConfig: ModelConfig<typeof settingValueTable> = {
  table: settingValueTable,
  softDeletes: true,
};
