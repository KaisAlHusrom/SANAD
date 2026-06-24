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
  folderCreateRequestSchema,
  folderListQuerySchema,
  MEDIA_ASSET_DELETE,
  MEDIA_ASSET_GET,
  MEDIA_ASSET_LIST,
  MEDIA_FOLDER_CREATE,
  MEDIA_FOLDER_LIST,
  MEDIA_PERMISSIONS,
  MEDIA_UPLOAD_CONFIRM,
  MEDIA_UPLOAD_SIGN,
  mediaListQuerySchema,
  uploadConfirmBodySchema,
  uploadSignRequestSchema,
  type FolderCreateRequest,
  type FolderListQuery,
  type MediaAsset,
  type MediaFolder,
  type MediaId,
  type MediaListQuery,
  type Paginated,
  type UploadConfirmBody,
  type UploadSignRequest,
  type UploadSignResult,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
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
    @Body(new ZodValidationPipe(uploadSignRequestSchema))
    body: UploadSignRequest,
  ): Promise<UploadSignResult> {
    return this.forward(MEDIA_UPLOAD_SIGN, body, identity);
  }

  @Post('uploads/:id/confirm')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async confirmUpload(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(uploadConfirmBodySchema))
    body: UploadConfirmBody,
  ): Promise<MediaAsset> {
    return this.forward(
      MEDIA_UPLOAD_CONFIRM,
      { assetId: id, ...body },
      identity,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.read)
  async list(
    @CurrentUser() identity: IdentityContext,
    @Query(new ZodValidationPipe(mediaListQuerySchema)) query: MediaListQuery,
  ): Promise<Paginated<MediaAsset>> {
    return this.forward(MEDIA_ASSET_LIST, query, identity);
  }

  @Post('folders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async createFolder(
    @CurrentUser() identity: IdentityContext,
    @Body(new ZodValidationPipe(folderCreateRequestSchema))
    body: FolderCreateRequest,
  ): Promise<MediaFolder> {
    return this.forward(MEDIA_FOLDER_CREATE, body, identity);
  }

  @Get('folders')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.read)
  async listFolders(
    @CurrentUser() identity: IdentityContext,
    @Query(new ZodValidationPipe(folderListQuerySchema)) query: FolderListQuery,
  ): Promise<MediaFolder[]> {
    return this.forward(MEDIA_FOLDER_LIST, query, identity);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.read)
  async get(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MediaAsset> {
    return this.forward(MEDIA_ASSET_GET, { id }, identity);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(MEDIA_PERMISSIONS.manage)
  async remove(
    @CurrentUser() identity: IdentityContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MediaId> {
    return this.forward(MEDIA_ASSET_DELETE, { id }, identity);
  }

  /** Forward to the media service over RMQ, mapping upstream errors to HTTP (MS2). */
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
}
