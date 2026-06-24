import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_BLOG_CATEGORY_CREATE,
  CONTENT_BLOG_CATEGORY_DELETE,
  CONTENT_BLOG_CATEGORY_LIST,
  CONTENT_BLOG_CATEGORY_UPDATE,
  blogCategoryCreateSchema,
  blogCategoryListQuerySchema,
  blogCategoryUpdateSchema,
  contentIdSchema,
  type BlogCategoryCreateRequest,
  type BlogCategoryItem,
  type BlogCategoryListQuery,
  type BlogCategoryUpdateRequest,
  type ContentId,
  type Paginated,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { BlogCategoryService } from '../application/services/blog-category.service.js';

/**
 * RMQ entrypoints for the blog-categories lookup (MS2). Thin — validate + delegate (U5). The
 * gateway makes list PUBLIC and guards writes with `content.manage` (MS4).
 */
@Controller()
export class BlogCategoryMessageController {
  constructor(private readonly categories: BlogCategoryService) {}

  @MessagePattern(CONTENT_BLOG_CATEGORY_LIST)
  list(
    @Payload(new ZodValidationPipe(blogCategoryListQuerySchema))
    query: BlogCategoryListQuery,
  ): Promise<Paginated<BlogCategoryItem>> {
    return this.categories.list(query);
  }

  @MessagePattern(CONTENT_BLOG_CATEGORY_CREATE)
  create(
    @Payload(new ZodValidationPipe(blogCategoryCreateSchema))
    body: BlogCategoryCreateRequest,
  ): Promise<BlogCategoryItem> {
    return this.categories.create(body);
  }

  @MessagePattern(CONTENT_BLOG_CATEGORY_UPDATE)
  update(
    @Payload(new ZodValidationPipe(blogCategoryUpdateSchema))
    body: BlogCategoryUpdateRequest,
  ): Promise<BlogCategoryItem> {
    return this.categories.update(body);
  }

  @MessagePattern(CONTENT_BLOG_CATEGORY_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.categories.delete(payload.id);
  }
}
