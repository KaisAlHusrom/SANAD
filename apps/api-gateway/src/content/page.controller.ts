import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CurrentUser,
  identityToHeaders,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type IdentityContext,
} from '@sanad/auth';
import {
  blockUpsertSchema,
  CONTENT_BLOCK_DELETE,
  CONTENT_BLOCK_UPSERT,
  CONTENT_PAGE_DELETE,
  CONTENT_PAGE_LIST,
  CONTENT_PAGE_TREE_GET,
  CONTENT_PAGE_UPSERT,
  CONTENT_PERMISSIONS,
  CONTENT_SECTION_DELETE,
  CONTENT_SECTION_UPSERT,
  listQuerySchema,
  pageUpsertSchema,
  sectionUpsertSchema,
  type BlockNode,
  type BlockUpsertRequest,
  type ContentId,
  type ListQuery,
  type PageSummary,
  type PageTree,
  type PageUpsertRequest,
  type Paginated,
  type SectionNode,
  type SectionUpsertRequest,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
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

  @Get('pages/:slug')
  async tree(@Param('slug') slug: string): Promise<PageTree> {
    return this.forwardPublic(CONTENT_PAGE_TREE_GET, { slug });
  }

  @Get('pages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.read)
  async listPages(
    @CurrentUser() identity: IdentityContext,
    @Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery,
  ): Promise<Paginated<PageSummary>> {
    return this.forward(CONTENT_PAGE_LIST, query, identity);
  }

  @Post('pages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async upsertPage(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(pageUpsertSchema)) body: PageUpsertRequest,
  ): Promise<PageSummary> {
    return this.forward(CONTENT_PAGE_UPSERT, body, identity);
  }

  @Delete('pages/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async deletePage(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_PAGE_DELETE, { id }, identity);
  }

  @Post('sections')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async upsertSection(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(sectionUpsertSchema))
    body: SectionUpsertRequest,
  ): Promise<SectionNode> {
    return this.forward(CONTENT_SECTION_UPSERT, body, identity);
  }

  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async deleteSection(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_SECTION_DELETE, { id }, identity);
  }

  @Post('blocks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async upsertBlock(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(blockUpsertSchema)) body: BlockUpsertRequest,
  ): Promise<BlockNode> {
    return this.forward(CONTENT_BLOCK_UPSERT, body, identity);
  }

  @Delete('blocks/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async deleteBlock(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_BLOCK_DELETE, { id }, identity);
  }

  /** Forward a guarded request, attaching the validated identity (MS4). */
  private async forward<TResult>(
    pattern: string,
    payload: object,
    identity: IdentityContext,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload, {
        headers: identityToHeaders(identity),
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  /** Forward a public request (no identity headers) — the website reads. */
  private async forwardPublic<TResult>(
    pattern: string,
    payload: object,
  ): Promise<TResult> {
    try {
      return await sendRequest<TResult>(this.client, pattern, payload);
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
