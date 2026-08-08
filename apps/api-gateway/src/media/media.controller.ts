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
  HttpStatus,
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
  folderCreateRequestSchema,
  folderDeleteQuerySchema,
  folderListQuerySchema,
  folderUpdateRequestSchema,
  MEDIA_ASSET_DELETE,
  MEDIA_ASSET_MOVE,
  MEDIA_ASSET_GET,
  MEDIA_ASSET_LIST,
  MEDIA_FOLDER_CREATE,
  MEDIA_FOLDER_DELETE,
  MEDIA_FOLDER_LIST,
  MEDIA_FOLDER_TREE,
  MEDIA_FOLDER_UPDATE,
  MEDIA_PERMISSIONS,
  MEDIA_PUBLIC_RESOLVE,
  MEDIA_UPLOAD_CONFIRM,
  MEDIA_UPLOAD_SIGN,
  mediaListQuerySchema,
  mediaMoveRequestSchema,
  mediaPublicResolveRequestSchema,
  uploadConfirmBodySchema,
  uploadSignRequestSchema,
  type FolderCreateRequest,
  type FolderDeleteQuery,
  type FolderListQuery,
  type FolderUpdateRequest,
  type MediaAsset,
  type MediaFolder,
  type MediaFolderTree,
  type MediaMoveRequest,
  type MediaMoveResult,
  type MediaId,
  type MediaListQuery,
  type Paginated,
  type PublicMediaRef,
  type UploadConfirmBody,
  type UploadSignRequest,
  type UploadSignResult,
  type Locale,
} from '@sanad/contracts';
import { httpError } from '@sanad/i18n';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { MEDIA_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The media surface (MS4). All routes are guarded at the edge — reads need `media.read`,
 * mutations need `media.manage` — and forward the validated identity in RMQ headers. The
 * actual bytes never traverse the gateway: `POST /uploads` returns a presigned URL the
 * client PUTs directly to R2 (signed-upload flow). Thin controller (U5).
 */
@Controller('media')
export class MediaController {
  constructor(@Inject(MEDIA_CLIENT) private readonly client: ClientProxy) {}

  @Post('uploads')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async signUpload(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(uploadSignRequestSchema))
    body: UploadSignRequest,
  ): Promise<UploadSignResult> {
    return this.forward(MEDIA_UPLOAD_SIGN, body, identity, locale);
  }

  @Post('uploads/:id/confirm')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async confirmUpload(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(uploadConfirmBodySchema))
    body: UploadConfirmBody,
  ): Promise<MediaAsset> {
    return this.forward(
      MEDIA_UPLOAD_CONFIRM,
      { assetId: id, ...body },
      identity,
      locale,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.read)
  async list(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(mediaListQuerySchema)) query: MediaListQuery,
  ): Promise<Paginated<MediaAsset>> {
    return this.forward(MEDIA_ASSET_LIST, query, identity, locale);
  }

  @Post('folders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async createFolder(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(folderCreateRequestSchema))
    body: FolderCreateRequest,
  ): Promise<MediaFolder> {
    return this.forward(MEDIA_FOLDER_CREATE, body, identity, locale);
  }

  @Get('folders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.read)
  async listFolders(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Query(new ZodValidationPipe(folderListQuerySchema)) query: FolderListQuery,
  ): Promise<MediaFolder[]> {
    return this.forward(MEDIA_FOLDER_LIST, query, identity, locale);
  }

  /**
   * The nested folder tree + per-folder asset counts — the explorer's whole side pane in one
   * request. Declared BEFORE `folders/:id` so the literal segment wins the match.
   */
  @Get('folders/tree')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.read)
  async folderTree(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
  ): Promise<MediaFolderTree> {
    return this.forward(MEDIA_FOLDER_TREE, {}, identity, locale);
  }

  /** Rename and/or move a folder — the tree's inline rename and its drag-to-reparent. */
  @Patch('folders/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async updateFolder(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(folderUpdateRequestSchema))
    body: FolderUpdateRequest,
  ): Promise<MediaFolder> {
    return this.forward(MEDIA_FOLDER_UPDATE, { id, ...body }, identity, locale);
  }

  /**
   * Delete a folder. Defaults to refusing a non-empty one (`?strategy=block`) — the assets
   * inside are never destroyed as a side effect; `reparent` lifts them up one level first.
   */
  @Delete('folders/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async removeFolder(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(folderDeleteQuerySchema))
    query: FolderDeleteQuery,
  ): Promise<{ id: string }> {
    return this.forward(
      MEDIA_FOLDER_DELETE,
      { id, strategy: query.strategy },
      identity,
      locale,
    );
  }

  /**
   * Move assets between folders in bulk — one request per drag-and-drop, however many files
   * were selected. Declared before the `:id` routes so `move` is never parsed as an asset id.
   */
  @Patch('move')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async moveAssets(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(mediaMoveRequestSchema))
    body: MediaMoveRequest,
  ): Promise<MediaMoveResult> {
    return this.forward(MEDIA_ASSET_MOVE, body, identity, locale);
  }

  /**
   * The ONE public, UNGUARDED media read (WEB1): batch-resolve content media ids → public
   * CDN refs so the website (an anonymous visitor) can render images without a token. Only
   * `ready` assets resolve; it exposes just `{ id, url, alt, width, height }` — never the
   * key/status/folder. Declared BEFORE `:id` so the literal path wins the match. `?ids=`
   * is a comma-separated list; blanks/dupes are dropped, then validated + bounded (N7).
   */
  @Get('public')
  async resolvePublic(
    @RequestLocale() locale: Locale,
    @Query('ids') ids?: string,
  ): Promise<PublicMediaRef[]> {
    const parsed = [
      ...new Set(
        (ids ?? '')
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0),
      ),
    ];
    const result = mediaPublicResolveRequestSchema.safeParse({ ids: parsed });
    if (!result.success) {
      throw httpError(HttpStatus.BAD_REQUEST, 'media.invalidIds');
    }
    if (result.data.ids.length === 0) return [];
    return this.forwardPublic(MEDIA_PUBLIC_RESOLVE, result.data, locale);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.read)
  async get(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MediaAsset> {
    return this.forward(MEDIA_ASSET_GET, { id }, identity, locale);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async remove(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MediaId> {
    return this.forward(MEDIA_ASSET_DELETE, { id }, identity, locale);
  }

  /**
   * Forward to the media service over RMQ, mapping upstream errors to HTTP (MS2). Carries
   * the validated identity AND the caller's locale (MS4/U24) so the service localizes any
   * message it puts in its payload.
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

  /** Forward a PUBLIC read (no identity, locale only) — the unguarded resolve route (MS2). */
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
