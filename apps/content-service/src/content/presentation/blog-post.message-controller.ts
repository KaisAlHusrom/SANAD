import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_BLOG_POST_CREATE,
  CONTENT_BLOG_POST_DELETE,
  CONTENT_BLOG_POST_GET,
  CONTENT_BLOG_POST_LIST,
  CONTENT_BLOG_POST_UPDATE,
  blogPostCreateSchema,
  blogPostListQuerySchema,
  blogPostUpdateSchema,
  contentIdSchema,
  contentSlugSchema,
  type BlogPostCreateRequest,
  type BlogPostItem,
  type BlogPostListQuery,
  type BlogPostUpdateRequest,
  type ContentId,
  type ContentSlug,
  type Paginated,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { BlogPostService } from '../application/services/blog-post.service.js';

/**
 * RMQ entrypoints for the blog posts collection (MS2). Thin — validate + delegate (U5). The
 * gateway makes list/get PUBLIC (forcing `status=published`) and guards create/update/delete
 * with `content.manage` (MS4).
 */
@Controller()
export class BlogPostMessageController {
  constructor(private readonly posts: BlogPostService) {}

  @MessagePattern(CONTENT_BLOG_POST_LIST)
  list(
    @Payload(new ZodValidationPipe(blogPostListQuerySchema))
    query: BlogPostListQuery,
  ): Promise<Paginated<BlogPostItem>> {
    return this.posts.list(query);
  }

  @MessagePattern(CONTENT_BLOG_POST_GET)
  get(
    @Payload(new ZodValidationPipe(contentSlugSchema)) payload: ContentSlug,
  ): Promise<BlogPostItem> {
    return this.posts.getBySlug(payload.slug);
  }

  @MessagePattern(CONTENT_BLOG_POST_CREATE)
  create(
    @Payload(new ZodValidationPipe(blogPostCreateSchema))
    body: BlogPostCreateRequest,
  ): Promise<BlogPostItem> {
    return this.posts.create(body);
  }

  @MessagePattern(CONTENT_BLOG_POST_UPDATE)
  update(
    @Payload(new ZodValidationPipe(blogPostUpdateSchema))
    body: BlogPostUpdateRequest,
  ): Promise<BlogPostItem> {
    return this.posts.update(body);
  }

  @MessagePattern(CONTENT_BLOG_POST_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.posts.delete(payload.id);
  }
}
