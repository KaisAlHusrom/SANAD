import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_PORTFOLIO_CATEGORY_CREATE,
  CONTENT_PORTFOLIO_CATEGORY_DELETE,
  CONTENT_PORTFOLIO_CATEGORY_LIST,
  CONTENT_PORTFOLIO_CATEGORY_UPDATE,
  contentIdSchema,
  portfolioCategoryCreateSchema,
  portfolioCategoryListQuerySchema,
  portfolioCategoryUpdateSchema,
  type ContentId,
  type Paginated,
  type PortfolioCategoryCreateRequest,
  type PortfolioCategoryItem,
  type PortfolioCategoryListQuery,
  type PortfolioCategoryUpdateRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { PortfolioCategoryService } from '../application/services/portfolio-category.service.js';

/**
 * RMQ entrypoints for the portfolio-categories lookup (MS2). Thin — validate + delegate (U5).
 * The gateway makes list PUBLIC and guards writes with `content.manage` (MS4).
 */
@Controller()
export class PortfolioCategoryMessageController {
  constructor(private readonly categories: PortfolioCategoryService) {}

  @MessagePattern(CONTENT_PORTFOLIO_CATEGORY_LIST)
  list(
    @Payload(new ZodValidationPipe(portfolioCategoryListQuerySchema))
    query: PortfolioCategoryListQuery,
  ): Promise<Paginated<PortfolioCategoryItem>> {
    return this.categories.list(query);
  }

  @MessagePattern(CONTENT_PORTFOLIO_CATEGORY_CREATE)
  create(
    @Payload(new ZodValidationPipe(portfolioCategoryCreateSchema))
    body: PortfolioCategoryCreateRequest,
  ): Promise<PortfolioCategoryItem> {
    return this.categories.create(body);
  }

  @MessagePattern(CONTENT_PORTFOLIO_CATEGORY_UPDATE)
  update(
    @Payload(new ZodValidationPipe(portfolioCategoryUpdateSchema))
    body: PortfolioCategoryUpdateRequest,
  ): Promise<PortfolioCategoryItem> {
    return this.categories.update(body);
  }

  @MessagePattern(CONTENT_PORTFOLIO_CATEGORY_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.categories.delete(payload.id);
  }
}
