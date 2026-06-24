import type { ModelConfig } from '@sanad/database';
import { mediaAssetTable } from '../../../db/schema/index.js';

/** The media-asset model config (N1). Soft-deletes on; alt lives in its own table (N5). */
export const mediaAssetModelConfig: ModelConfig<typeof mediaAssetTable> = {
  table: mediaAssetTable,
  fillable: [
    'folderId',
    'key',
    'filename',
    'mimeType',
    'size',
    'width',
    'height',
    'status',
  ],
  softDeletes: true,
};
