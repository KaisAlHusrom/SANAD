import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  blockUpsertSchema,
  CONTENT_BLOCK_DELETE,
  CONTENT_BLOCK_REORDER,
  CONTENT_BLOCK_UPSERT,
  CONTENT_PAGE_DELETE,
  CONTENT_PAGE_LIST,
  CONTENT_PAGE_REORDER,
  CONTENT_PAGE_TREE_ADMIN_GET,
  CONTENT_PAGE_TREE_GET,
  CONTENT_PAGE_UPSERT,
  CONTENT_SECTION_DELETE,
  CONTENT_SECTION_REORDER,
  CONTENT_SECTION_UPSERT,
  contentIdSchema,
  contentSlugSchema,
  listQuerySchema,
  pageUpsertSchema,
  reorderRequestSchema,
  sectionUpsertSchema,
  type BlockNode,
  type BlockUpsertRequest,
  type ContentId,
  type ContentSlug,
  type ListQuery,
  type PageSummary,
  type PageTree,
  type PageUpsertRequest,
  type Paginated,
  type ReorderRequest,
  type SectionNode,
  type SectionUpsertRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { contentNotFound } from '../application/errors/content-errors.js';
import { PageService } from '../application/services/page.service.js';

/**
 * RMQ entrypoints for the Page → Section → Block tree (MS2). Thin — validate + delegate
 * (U5). The gateway makes the tree read PUBLIC and guards every write with `content.manage`
 * at the edge (MS4).
 */
@Controller()
export class PageMessageController {
  constructor(private readonly pages: PageService) {}

  @MessagePattern(CONTENT_PAGE_TREE_GET)
  async tree(
    @Payload(new ZodValidationPipe(contentSlugSchema)) payload: ContentSlug,
  ): Promise<PageTree> {
    const tree = await this.pages.getTree(payload.slug);
    if (!tree) {
      throw contentNotFound('Page', payload.slug);
    }
    return tree;
  }

  @MessagePattern(CONTENT_PAGE_TREE_ADMIN_GET)
  async adminTree(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<PageTree> {
    const tree = await this.pages.getAdminTree(payload.id);
    if (!tree) {
      throw contentNotFound('Page', payload.id);
    }
    return tree;
  }

  @MessagePattern(CONTENT_PAGE_LIST)
  list(
    @Payload(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<Paginated<PageSummary>> {
    return this.pages.list(query);
  }

  @MessagePattern(CONTENT_PAGE_REORDER)
  async reorderPages(
    @Payload(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    await this.pages.reorderPages(body.ids);
    return body;
  }

  @MessagePattern(CONTENT_SECTION_REORDER)
  async reorderSections(
    @Payload(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    await this.pages.reorderSections(body.ids);
    return body;
  }

  @MessagePattern(CONTENT_BLOCK_REORDER)
  async reorderBlocks(
    @Payload(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    await this.pages.reorderBlocks(body.ids);
    return body;
  }

  @MessagePattern(CONTENT_PAGE_UPSERT)
  upsertPage(
    @Payload(new ZodValidationPipe(pageUpsertSchema)) body: PageUpsertRequest,
  ): Promise<PageSummary> {
    return this.pages.upsertPage(body);
  }

  @MessagePattern(CONTENT_PAGE_DELETE)
  deletePage(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.pages.deletePage(payload.id);
  }

  @MessagePattern(CONTENT_SECTION_UPSERT)
  upsertSection(
    @Payload(new ZodValidationPipe(sectionUpsertSchema))
    body: SectionUpsertRequest,
  ): Promise<SectionNode> {
    return this.pages.upsertSection(body);
  }

  @MessagePattern(CONTENT_SECTION_DELETE)
  deleteSection(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.pages.deleteSection(payload.id);
  }

  @MessagePattern(CONTENT_BLOCK_UPSERT)
  upsertBlock(
    @Payload(new ZodValidationPipe(blockUpsertSchema)) body: BlockUpsertRequest,
  ): Promise<BlockNode> {
    return this.pages.upsertBlock(body);
  }

  @MessagePattern(CONTENT_BLOCK_DELETE)
  deleteBlock(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.pages.deleteBlock(payload.id);
  }
}
