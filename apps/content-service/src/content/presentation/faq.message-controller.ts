import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_FAQ_CREATE,
  CONTENT_FAQ_DELETE,
  CONTENT_FAQ_LIST,
  CONTENT_FAQ_UPDATE,
  contentIdSchema,
  faqCreateSchema,
  faqListQuerySchema,
  faqUpdateSchema,
  type ContentId,
  type FaqCreateRequest,
  type FaqItem,
  type FaqListQuery,
  type FaqUpdateRequest,
  type Paginated,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { FaqService } from '../application/services/faq.service.js';

/**
 * RMQ entrypoints for the FAQ collection (MS2). Thin — validate + delegate (U5). The gateway
 * makes list PUBLIC and guards create/update/delete with `content.manage` (MS4).
 */
@Controller()
export class FaqMessageController {
  constructor(private readonly faqs: FaqService) {}

  @MessagePattern(CONTENT_FAQ_LIST)
  list(
    @Payload(new ZodValidationPipe(faqListQuerySchema)) query: FaqListQuery,
  ): Promise<Paginated<FaqItem>> {
    return this.faqs.list(query);
  }

  @MessagePattern(CONTENT_FAQ_CREATE)
  create(
    @Payload(new ZodValidationPipe(faqCreateSchema)) body: FaqCreateRequest,
  ): Promise<FaqItem> {
    return this.faqs.create(body);
  }

  @MessagePattern(CONTENT_FAQ_UPDATE)
  update(
    @Payload(new ZodValidationPipe(faqUpdateSchema)) body: FaqUpdateRequest,
  ): Promise<FaqItem> {
    return this.faqs.update(body);
  }

  @MessagePattern(CONTENT_FAQ_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.faqs.delete(payload.id);
  }
}
