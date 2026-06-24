import { Inject, Injectable } from '@nestjs/common';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import {
  menuItemTable,
  menuItemTranslationTable,
  type ContentDb,
  type MenuItemRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { menuItemModelConfig } from '../model-configs/menu-item.model-config.js';

/**
 * Menu-item persistence (N1) on the translatable base. Owns base-row CRUD + the per-menu
 * lookup; `label` is translatable (N5), `url`/`icon`/`parentId` are base columns.
 */
@Injectable()
export class MenuItemRepository extends LocalizedRepository<
  typeof menuItemTable,
  typeof menuItemTranslationTable,
  MenuItemRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, menuItemModelConfig, menuItemTranslationTable);
  }

  /** All live items for a menu (caller groups by `parentId` + sorts by `sortOrder`). */
  listForMenu(menuId: string): Promise<MenuItemRow[]> {
    return this.where('menuId', 'eq', menuId).all();
  }

  /** Live direct children of an item (one nesting level; caller sorts by `sortOrder`). */
  listChildren(parentId: string): Promise<MenuItemRow[]> {
    return this.where('parentId', 'eq', parentId).all();
  }
}
