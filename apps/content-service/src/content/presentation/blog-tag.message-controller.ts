import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_BLOG_TAG_CREATE,
  CONTENT_BLOG_TAG_DELETE,
  CONTENT_BLOG_TAG_LIST,
  CONTENT_BLOG_TAG_UPDATE,
  blogTagCreateSchema,
  blogTagListQuerySchema,
  blogTagUpdateSchema,
  contentIdSchema,
  type BlogTagCreateRequest,
  type BlogTagItem,
  type BlogTagListQuery,
  type BlogTagUpdateRequest,
  type ContentId,
  type Paginated,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { BlogTagService } from '../application/services/blog-tag.service.js';

/**
 * RMQ entrypoints for the blog-tags lookup (MS2). Thin — validate + delegate (U5). The gateway
 * makes list PUBLIC and guards writes with `content.manage` (MS4).
 */
@Controller()
export class BlogTagMessageController {
  constructor(private readonly tags: BlogTagService) {}

  @MessagePattern(CONTENT_BLOG_TAG_LIST)
  list(
    @Payload(new ZodValidationPipe(blogTagListQuerySchema))
    query: BlogTagListQuery,
  ): Promise<Paginated<BlogTagItem>> {
    return this.tags.list(query);
  }

  @MessagePattern(CONTENT_BLOG_TAG_CREATE)
  create(
    @Payload(new ZodValidationPipe(blogTagCreateSchema))
    body: BlogTagCreateRequest,
  ): Promise<BlogTagItem> {
    return this.tags.create(body);
  }

  @MessagePattern(CONTENT_BLOG_TAG_UPDATE)
  update(
    @Payload(new ZodValidationPipe(blogTagUpdateSchema))
    body: BlogTagUpdateRequest,
  ): Promise<BlogTagItem> {
    return this.tags.update(body);
  }

  @MessagePattern(CONTENT_BLOG_TAG_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.tags.delete(payload.id);
  }
}
