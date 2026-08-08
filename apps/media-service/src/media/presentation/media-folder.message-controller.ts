import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  folderCreateRequestSchema,
  folderDeletePayloadSchema,
  folderListQuerySchema,
  folderUpdatePayloadSchema,
  MEDIA_ASSET_MOVE,
  MEDIA_FOLDER_CREATE,
  MEDIA_FOLDER_DELETE,
  MEDIA_FOLDER_LIST,
  MEDIA_FOLDER_TREE,
  MEDIA_FOLDER_UPDATE,
  mediaMoveRequestSchema,
  type FolderCreateRequest,
  type FolderDeletePayload,
  type FolderListQuery,
  type FolderUpdatePayload,
  type MediaFolder,
  type MediaFolderTree,
  type MediaMoveRequest,
  type MediaMoveResult,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { MediaFolderService } from '../application/media-folder.service.js';

/**
 * RMQ entrypoints for media folders (MS2). Thin — validate + delegate (U5). The gateway
 * makes create `media.manage` and list `media.read` at the edge (MS4).
 */
@Controller()
export class MediaFolderMessageController {
  constructor(private readonly folders: MediaFolderService) {}

  @MessagePattern(MEDIA_FOLDER_CREATE)
  create(
    @Payload(new ZodValidationPipe(folderCreateRequestSchema))
    body: FolderCreateRequest,
  ): Promise<MediaFolder> {
    return this.folders.create(body);
  }

  @MessagePattern(MEDIA_FOLDER_LIST)
  list(
    @Payload(new ZodValidationPipe(folderListQuerySchema))
    query: FolderListQuery,
  ): Promise<MediaFolder[]> {
    return this.folders.list(query);
  }

  /** The nested tree + per-folder counts — one request for the explorer's whole side pane. */
  @MessagePattern(MEDIA_FOLDER_TREE)
  tree(): Promise<MediaFolderTree> {
    return this.folders.tree();
  }

  @MessagePattern(MEDIA_FOLDER_UPDATE)
  update(
    @Payload(new ZodValidationPipe(folderUpdatePayloadSchema))
    payload: FolderUpdatePayload,
  ): Promise<MediaFolder> {
    return this.folders.update(payload);
  }

  @MessagePattern(MEDIA_FOLDER_DELETE)
  remove(
    @Payload(new ZodValidationPipe(folderDeletePayloadSchema))
    payload: FolderDeletePayload,
  ): Promise<{ id: string }> {
    return this.folders.remove(payload);
  }

  /** Bulk asset move — what dropping a (possibly multi-) selection onto a folder does. */
  @MessagePattern(MEDIA_ASSET_MOVE)
  move(
    @Payload(new ZodValidationPipe(mediaMoveRequestSchema))
    body: MediaMoveRequest,
  ): Promise<MediaMoveResult> {
    return this.folders.moveAssets(body);
  }
}
