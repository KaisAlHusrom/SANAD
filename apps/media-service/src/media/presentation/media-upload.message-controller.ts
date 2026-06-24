import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MEDIA_UPLOAD_CONFIRM,
  MEDIA_UPLOAD_SIGN,
  uploadConfirmRequestSchema,
  uploadSignRequestSchema,
  type MediaAsset,
  type UploadConfirmRequest,
  type UploadSignResult,
  type UploadSignRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { MediaService } from '../application/media.service.js';

/**
 * RMQ entrypoints for the signed-upload lifecycle (MS2). Thin — validate the payload
 * and delegate (U5). The gateway guards both with `media.manage` at the edge (MS4).
 */
@Controller()
export class MediaUploadMessageController {
  constructor(private readonly media: MediaService) {}

  @MessagePattern(MEDIA_UPLOAD_SIGN)
  sign(
    @Payload(new ZodValidationPipe(uploadSignRequestSchema))
    body: UploadSignRequest,
  ): Promise<UploadSignResult> {
    return this.media.signUpload(body);
  }

  @MessagePattern(MEDIA_UPLOAD_CONFIRM)
  confirm(
    @Payload(new ZodValidationPipe(uploadConfirmRequestSchema))
    body: UploadConfirmRequest,
  ): Promise<MediaAsset> {
    return this.media.confirmUpload(body);
  }
}
