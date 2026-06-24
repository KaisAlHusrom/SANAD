import type { ModelConfig } from '@sanad/database';
import { mediaFolderTable } from '../../../db/schema/index.js';

/** The media-folder model config (N1). Soft-deletes on. */
export const mediaFolderModelConfig: ModelConfig<typeof mediaFolderTable> = {
  table: mediaFolderTable,
  fillable: ['parentId', 'name'],
  softDeletes: true,
};
