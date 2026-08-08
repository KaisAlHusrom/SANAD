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
  CONTENT_MENU_CREATE,
  CONTENT_MENU_DELETE,
  CONTENT_MENU_GET,
  CONTENT_MENU_ITEM_CREATE,
  CONTENT_MENU_ITEM_DELETE,
  CONTENT_MENU_ITEM_REORDER,
  CONTENT_MENU_ITEM_UPDATE,
  CONTENT_MENU_LIST,
  CONTENT_PERMISSIONS,
  menuCreateSchema,
  menuItemCreateSchema,
  menuItemUpdateSchema,
  reorderRequestSchema,
  type ContentId,
  type MenuCreateRequest,
  type MenuItemCreateRequest,
  type MenuItemNode,
  type MenuItemUpdateRequest,
  type MenuSummary,
  type MenuTree,
  type ReorderRequest,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import { CONTENT_CLIENT } from '../core/injection-tokens.js';
import { toHttpException } from '../core/rpc-error.js';

/**
 * The navigation menus surface (MS4). The keyed tree read is **public** (the website header/
 * footer); the admin list is guarded `content.read`; every write (menu + items) is guarded
 * `content.manage`. Thin (U5).
 */
@Controller('content')
export class MenuController {
  constructor(@Inject(CONTENT_CLIENT) private readonly client: ClientProxy) {}

  @Get('menus')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.read)
  async list(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
  ): Promise<MenuSummary[]> {
    return this.forward(CONTENT_MENU_LIST, {}, identity, locale);
  }

  @Get('menus/:key')
  async get(
    @RequestLocale() locale: Locale,
    @Param('key') key: string,
  ): Promise<MenuTree> {
    return this.forwardPublic(CONTENT_MENU_GET, { key }, locale);
  }

  @Post('menus')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async create(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(menuCreateSchema)) body: MenuCreateRequest,
  ): Promise<MenuSummary> {
    return this.forward(CONTENT_MENU_CREATE, body, identity, locale);
  }

  @Delete('menus/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async delete(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_MENU_DELETE, { id }, identity, locale);
  }

  @Post('menu-items')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async createItem(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(menuItemCreateSchema))
    body: MenuItemCreateRequest,
  ): Promise<MenuItemNode> {
    return this.forward(CONTENT_MENU_ITEM_CREATE, body, identity, locale);
  }

  @Patch('menu-items/reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async reorderItems(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Body(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    return this.forward(CONTENT_MENU_ITEM_REORDER, body, identity, locale);
  }

  @Patch('menu-items/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async updateItem(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(menuItemUpdateSchema.omit({ id: true })))
    body: Omit<MenuItemUpdateRequest, 'id'>,
  ): Promise<MenuItemNode> {
    return this.forward(
      CONTENT_MENU_ITEM_UPDATE,
      { id, ...body },
      identity,
      locale,
    );
  }

  @Delete('menu-items/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.manage)
  async deleteItem(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContentId> {
    return this.forward(CONTENT_MENU_ITEM_DELETE, { id }, identity, locale);
  }

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
