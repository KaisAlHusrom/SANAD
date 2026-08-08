import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_TESTIMONIAL_CREATE,
  CONTENT_TESTIMONIAL_DELETE,
  CONTENT_TESTIMONIAL_LIST,
  CONTENT_TESTIMONIAL_REORDER,
  CONTENT_TESTIMONIAL_UPDATE,
  contentIdSchema,
  reorderRequestSchema,
  testimonialCreateSchema,
  testimonialListQuerySchema,
  testimonialUpdateSchema,
  type ContentId,
  type Paginated,
  type ReorderRequest,
  type TestimonialCreateRequest,
  type TestimonialItem,
  type TestimonialListQuery,
  type TestimonialUpdateRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { TestimonialService } from '../application/services/testimonial.service.js';

/**
 * RMQ entrypoints for the testimonials collection (MS2). Thin — validate + delegate (U5). The
 * gateway makes list PUBLIC and guards create/update/delete with `content.manage` (MS4).
 */
@Controller()
export class TestimonialMessageController {
  constructor(private readonly testimonials: TestimonialService) {}

  @MessagePattern(CONTENT_TESTIMONIAL_LIST)
  list(
    @Payload(new ZodValidationPipe(testimonialListQuerySchema))
    query: TestimonialListQuery,
  ): Promise<Paginated<TestimonialItem>> {
    return this.testimonials.list(query);
  }

  @MessagePattern(CONTENT_TESTIMONIAL_CREATE)
  create(
    @Payload(new ZodValidationPipe(testimonialCreateSchema))
    body: TestimonialCreateRequest,
  ): Promise<TestimonialItem> {
    return this.testimonials.create(body);
  }

  @MessagePattern(CONTENT_TESTIMONIAL_UPDATE)
  update(
    @Payload(new ZodValidationPipe(testimonialUpdateSchema))
    body: TestimonialUpdateRequest,
  ): Promise<TestimonialItem> {
    return this.testimonials.update(body);
  }

  @MessagePattern(CONTENT_TESTIMONIAL_REORDER)
  async reorder(
    @Payload(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    await this.testimonials.reorder(body.ids);
    return body;
  }

  @MessagePattern(CONTENT_TESTIMONIAL_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.testimonials.delete(payload.id);
  }
}
