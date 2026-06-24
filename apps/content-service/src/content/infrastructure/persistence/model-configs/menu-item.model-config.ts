import type { ModelConfig } from '@sanad/database';
import {
  menuItemTable,
  menuItemTranslationTable,
} from '../../../../db/schema/index.js';

/** Menu-item model config (N1). label is translatable (N5). */
export const menuItemModelConfig: ModelConfig<typeof menuItemTable> = {
  table: menuItemTable,
  fillable: ['menuId', 'parentId', 'url', 'icon', 'sortOrder'],
  softDeletes: true,
  translatable: {
    table: menuItemTranslationTable,
    foreignKey: 'menuItemId',
    fields: ['label'],
  },
};
