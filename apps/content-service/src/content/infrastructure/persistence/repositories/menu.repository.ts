import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository, DateTimeService, DRIZZLE } from '@sanad/database';
import type { MenuKey } from '@sanad/contracts';
import {
  menuTable,
  type ContentDb,
  type MenuRow,
} from '../../../../db/schema/index.js';
import { menuModelConfig } from '../model-configs/menu.model-config.js';

/**
 * Menu persistence (N1) on the enhanced base. The menu is NOT translatable (no `*_translation`
 * table), so it extends `BaseRepository` directly. Owns the keyed lookup + the admin list.
 */
@Injectable()
export class MenuRepository extends BaseRepository<typeof menuTable, MenuRow> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, menuModelConfig);
  }

  /** A live menu by its unique key, or null. */
  findByKey(key: MenuKey): Promise<MenuRow | null> {
    return this.where('key', 'eq', key).first();
  }

  /** All live menus (admin list — a small fixed set; caller sorts by `sortOrder`). */
  listAll(): Promise<MenuRow[]> {
    return this.query().all();
  }
}
