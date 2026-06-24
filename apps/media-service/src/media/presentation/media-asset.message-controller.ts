import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MEDIA_ASSET_DELETE,
  MEDIA_ASSET_GET,
  MEDIA_ASSET_LIST,
  mediaIdSchema,
  mediaListQuerySchema,
  type MediaAsset,
  type MediaId,
  type MediaListQuery,
  type Paginated,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { MediaService } from '../application/media.service.js';

/**
 * RMQ entrypoints for the media library (MS2). Thin — validate + delegate (U5). The
 * gateway makes list/get `media.read` and delete `media.manage` at the edge (MS4).
 */
@Controller()
export class MediaAssetMessageController {
  constructor(private readonly media: MediaService) {}

  @MessagePattern(MEDIA_ASSET_LIST)
  list(
    @Payload(new ZodValidationPipe(mediaListQuerySchema)) query: MediaListQuery,
  ): Promise<Paginated<MediaAsset>> {
    return this.media.list(query);
  }

  @MessagePattern(MEDIA_ASSET_GET)
  get(
    @Payload(new ZodValidationPipe(mediaIdSchema)) payload: MediaId,
  ): Promise<MediaAsset> {
    return this.media.get(payload.id);
  }

  @MessagePattern(MEDIA_ASSET_DELETE)
  remove(
    @Payload(new ZodValidationPipe(mediaIdSchema)) payload: MediaId,
  ): Promise<MediaId> {
    return this.media.delete(payload.id);
  }
}
