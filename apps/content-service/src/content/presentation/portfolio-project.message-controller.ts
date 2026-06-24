import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_PORTFOLIO_CREATE,
  CONTENT_PORTFOLIO_DELETE,
  CONTENT_PORTFOLIO_GET,
  CONTENT_PORTFOLIO_LIST,
  CONTENT_PORTFOLIO_UPDATE,
  contentIdSchema,
  contentSlugSchema,
  portfolioCreateSchema,
  portfolioListQuerySchema,
  portfolioUpdateSchema,
  type ContentId,
  type ContentSlug,
  type Paginated,
  type PortfolioCreateRequest,
  type PortfolioListQuery,
  type PortfolioProjectItem,
  type PortfolioUpdateRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { PortfolioProjectService } from '../application/services/portfolio-project.service.js';

/**
 * RMQ entrypoints for the portfolio projects collection (MS2). Thin — validate + delegate (U5).
 * The gateway makes list/get PUBLIC (forcing `status=published`) and guards create/update/delete
 * with `content.manage` (MS4).
 */
@Controller()
export class PortfolioProjectMessageController {
  constructor(private readonly projects: PortfolioProjectService) {}

  @MessagePattern(CONTENT_PORTFOLIO_LIST)
  list(
    @Payload(new ZodValidationPipe(portfolioListQuerySchema))
    query: PortfolioListQuery,
  ): Promise<Paginated<PortfolioProjectItem>> {
    return this.projects.list(query);
  }

  @MessagePattern(CONTENT_PORTFOLIO_GET)
  get(
    @Payload(new ZodValidationPipe(contentSlugSchema)) payload: ContentSlug,
  ): Promise<PortfolioProjectItem> {
    return this.projects.getBySlug(payload.slug);
  }

  @MessagePattern(CONTENT_PORTFOLIO_CREATE)
  create(
    @Payload(new ZodValidationPipe(portfolioCreateSchema))
    body: PortfolioCreateRequest,
  ): Promise<PortfolioProjectItem> {
    return this.projects.create(body);
  }

  @MessagePattern(CONTENT_PORTFOLIO_UPDATE)
  update(
    @Payload(new ZodValidationPipe(portfolioUpdateSchema))
    body: PortfolioUpdateRequest,
  ): Promise<PortfolioProjectItem> {
    return this.projects.update(body);
  }

  @MessagePattern(CONTENT_PORTFOLIO_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.projects.delete(payload.id);
  }
}
