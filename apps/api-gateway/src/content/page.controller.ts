import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type IdentityContext,
} from '@sanad/auth';
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
  CONTENT_PERMISSIONS,
  CONTENT_SECTION_DELETE,
  CONTENT_SECTION_REORDER,
  CONTENT_SECTION_UPSERT,
  listQuerySchema,
  pageUpsertSchema,
  reorderRequestSchema,
  sectionUpsertSchema,
  type BlockNode,
  type BlockUpsertRequest,
  type ContentId,
  type ListQuery,
  type PageSummary,
  type PageTree,
  type PageUpsertRequest,
  type Paginated,
  type ReorderRequest,
  type SectionNode,
  type SectionUpsertRequest,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { CONTENT_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The CMS page-tree surface (MS4). The tree read is **public** (the website renders it
 * unauthenticated, with coded defaults seeded so it's never blank); every write is guarded
 * by `content.manage` and forwards the validated identity in RMQ headers. Thin (U5).
 */
@Controller('content')
export class PageController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get('pages/:id/tree')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.read)
  async adminTree(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PageTree> {
    return this.forward(CONTENT_PAGE_TREE_ADMIN_GET, { id }, identity, locale);
  }

  @Get('pages/:slug')
  async tree(
    @RequestLocale() locale: Locale,
    @Param('slug') slug: string,
  ): Promise<PageTree> {
    return this.forwardPublic(CONTENT_PAGE_TREE_GET, { slug }, locale);
  }

  @Patch('pages/reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async reorderPages(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    return this.forward(CONTENT_PAGE_REORDER, body, identity, locale);
  }

  @Patch('sections/reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async reorderSections(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    return this.forward(CONTENT_SECTION_REORDER, body, identity, locale);
  }

  @Patch('blocks/reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async reorderBlocks(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    return this.forward(CONTENT_BLOCK_REORDER, body, identity, locale);
  }

  @Get('pages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.read)
  async listPages(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<Paginated<PageSummary>> {
    return this.forward(CONTENT_PAGE_LIST, query, identity, locale);
  }

  @Post('pages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async upsertPage(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(pageUpsertSchema)) body: PageUpsertRequest,
  ): Promise<PageSummary> {
    return this.forward(CONTENT_PAGE_UPSERT, body, identity, locale);
  }

  @Delete('pages/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async deletePage(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_PAGE_DELETE, { id }, identity, locale);
  }

  @Post('sections')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async upsertSection(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(sectionUpsertSchema))
    body: SectionUpsertRequest,
  ): Promise<SectionNode> {
    return this.forward(CONTENT_SECTION_UPSERT, body, identity, locale);
  }

  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async deleteSection(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_SECTION_DELETE, { id }, identity, locale);
  }

  @Post('blocks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async upsertBlock(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(blockUpsertSchema)) body: BlockUpsertRequest,
  ): Promise<BlockNode> {
    return this.forward(CONTENT_BLOCK_UPSERT, body, identity, locale);
  }

  @Delete('blocks/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async deleteBlock(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_BLOCK_DELETE, { id }, identity, locale);
  }

  /**
   * Forward a guarded request, attaching the validated identity (MS4) and the caller's
   * locale (U24) so the service localizes any text it puts in its payload.
   */
  private async forward<TResult>(
    pattern: string,
    payload: object,
    identity: IdentityContext,
    locale: Locale,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload, {
        headers: forwardHeaders(identity, locale),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  /** Forward a public request (no identity, locale only — U24) — the website reads. */
  private async forwardPublic<TResult>(
    pattern: string,
    payload: object,
    locale: Locale,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload, {
        headers: forwardHeaders(null, locale),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
