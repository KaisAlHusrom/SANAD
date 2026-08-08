import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CONTENT_MENU_CREATE,
  CONTENT_MENU_DELETE,
  CONTENT_MENU_GET,
  CONTENT_MENU_ITEM_CREATE,
  CONTENT_MENU_ITEM_DELETE,
  CONTENT_MENU_ITEM_REORDER,
  CONTENT_MENU_ITEM_UPDATE,
  CONTENT_MENU_LIST,
  contentIdSchema,
  menuCreateSchema,
  menuItemCreateSchema,
  menuItemUpdateSchema,
  menuKeyParamSchema,
  reorderRequestSchema,
  type ContentId,
  type MenuCreateRequest,
  type MenuItemCreateRequest,
  type MenuItemNode,
  type MenuItemUpdateRequest,
  type MenuKeyParam,
  type MenuSummary,
  type MenuTree,
  type ReorderRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { MenuService } from '../application/services/menu.service.js';

/**
 * RMQ entrypoints for menus + their items (MS2). Thin — validate + delegate (U5). The gateway
 * makes the keyed tree read PUBLIC and guards every write with `content.manage` (MS4).
 */
@Controller()
export class MenuMessageController {
  constructor(private readonly menus: MenuService) {}

  @MessagePattern(CONTENT_MENU_GET)
  get(
    @Payload(new ZodValidationPipe(menuKeyParamSchema)) payload: MenuKeyParam,
  ): Promise<MenuTree> {
    return this.menus.getByKey(payload.key);
  }

  @MessagePattern(CONTENT_MENU_LIST)
  list(): Promise<MenuSummary[]> {
    return this.menus.list();
  }

  @MessagePattern(CONTENT_MENU_CREATE)
  create(
    @Payload(new ZodValidationPipe(menuCreateSchema)) body: MenuCreateRequest,
  ): Promise<MenuSummary> {
    return this.menus.create(body);
  }

  @MessagePattern(CONTENT_MENU_DELETE)
  delete(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.menus.delete(payload.id);
  }

  @MessagePattern(CONTENT_MENU_ITEM_CREATE)
  createItem(
    @Payload(new ZodValidationPipe(menuItemCreateSchema))
    body: MenuItemCreateRequest,
  ): Promise<MenuItemNode> {
    return this.menus.createItem(body);
  }

  @MessagePattern(CONTENT_MENU_ITEM_UPDATE)
  updateItem(
    @Payload(new ZodValidationPipe(menuItemUpdateSchema))
    body: MenuItemUpdateRequest,
  ): Promise<MenuItemNode> {
    return this.menus.updateItem(body);
  }

  @MessagePattern(CONTENT_MENU_ITEM_REORDER)
  async reorderItems(
    @Payload(new ZodValidationPipe(reorderRequestSchema)) body: ReorderRequest,
  ): Promise<ReorderRequest> {
    await this.menus.reorderItems(body.ids);
    return body;
  }

  @MessagePattern(CONTENT_MENU_ITEM_DELETE)
  deleteItem(
    @Payload(new ZodValidationPipe(contentIdSchema)) payload: ContentId,
  ): Promise<ContentId> {
    return this.menus.deleteItem(payload.id);
  }
}
