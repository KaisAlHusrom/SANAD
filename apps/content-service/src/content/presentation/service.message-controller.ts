import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_SERVICE_CREATE,
  CONTENT_SERVICE_DELETE,
  CONTENT_SERVICE_GET,
  CONTENT_SERVICE_LIST,
  CONTENT_SERVICE_UPDATE,
  contentIdSchema,
  contentSlugSchema,
  serviceCreateSchema,
  serviceListQuerySchema,
  serviceUpdateSchema,
  type ContentId,
  type ContentSlug,
  type Paginated,
  type ServiceCreateRequest,
  type ServiceItem,
  type ServiceListQuery,
  type ServiceUpdateRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { ServiceService } from '../application/services/service.service.js';

/**
 * RMQ entrypoints for the services collection (MS2). Thin — validate + delegate (U5). The
 * gateway makes list/get PUBLIC and guards create/update/delete with `content.manage` (MS4).
 */
@Controller()
export class ServiceMessageController {
  constructor(private readonly services: ServiceService) {}

  @MessagePattern(CONTENT_SERVICE_LIST)
  list(
    @Payload(new ZodValidationPipe(serviceListQuerySchema))
    query: ServiceListQuery,
  ): Promise<Paginated<ServiceItem>> {
    return this.services.list(query);
  }

  @MessagePattern(CONTENT_SERVICE_GET)
  get(
    @Payload(new ZodValidationPipe(contentSlugSchema)) payload: ContentSlug,
  ): Promise<ServiceItem> {
    return this.services.getBySlug(payload.slug);
  }

  @MessagePattern(CONTENT_SERVICE_CREATE)
  create(
    @Payload(new ZodValidationPipe(serviceCreateSchema))
    body: ServiceCreateRequest,
  ): Promise<ServiceItem> {
    return this.services.create(body);
  }

  @MessagePattern(CONTENT_SERVICE_UPDATE)
  update(
    @Payload(new ZodValidationPipe(serviceUpdateSchema))
    body: ServiceUpdateRequest,
  ): Promise<ServiceItem> {
    return this.services.update(body);
  }

  @MessagePattern(CONTENT_SERVICE_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.services.delete(payload.id);
  }
}
