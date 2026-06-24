import type { MediaAsset } from './media-asset.types.js';

/** The presigned PUT instruction the client follows to upload bytes straight to R2. */
export interface UploadInstruction {
  url: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

/**
 * The reply to a sign request: the freshly-created `pending` asset plus the presigned
 * PUT instruction. The client PUTs to `upload.url`, then calls confirm. Pure response
 * shape → `.types` file (U16).
 */
export interface UploadSignResult {
  asset: MediaAsset;
  upload: UploadInstruction;
}
