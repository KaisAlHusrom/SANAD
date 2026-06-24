import type { ModelConfig } from '@sanad/database';
import { menuTable } from '../../../../db/schema/index.js';

/** Menu model config (N1). Not translatable — the menu is a keyed container; its items carry the labels. */
export const menuModelConfig: ModelConfig<typeof menuTable> = {
  table: menuTable,
  fillable: ['key', 'sortOrder'],
  softDeletes: true,
};
