import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  folderCreateRequestSchema,
  folderListQuerySchema,
  MEDIA_FOLDER_CREATE,
  MEDIA_FOLDER_LIST,
  type FolderCreateRequest,
  type FolderListQuery,
  type MediaFolder,
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
}
