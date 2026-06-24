import { Injectable } from '@nestjs/common';
import type {
  ContentId,
  MenuCreateRequest,
  MenuItemCreateRequest,
  MenuItemNode,
  MenuItemUpdateRequest,
  MenuKey,
  MenuSummary,
  MenuTree,
} from '@sanad/contracts';
import { menuItemTable, type MenuItemRow } from '../../../db/schema/index.js';
import { MenuItemRepository } from '../../infrastructure/persistence/repositories/menu-item.repository.js';
import { MenuRepository } from '../../infrastructure/persistence/repositories/menu.repository.js';
import {
  assembleMenuItemNode,
  assembleMenuSummary,
  assembleMenuTree,
} from '../assemblers/menu.assembler.js';
import { contentNotFound, slugConflict } from '../errors/content-errors.js';

type MenuItemInsert = typeof menuItemTable.$inferInsert;

/** Order by `sortOrder` ascending. */
function bySortOrder<T extends { sortOrder: number }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder;
}

/**
 * Navigation menus (WEB1) — a keyed container of translatable items. The public read assembles
 * the menu by key into a one-level item tree (parentId nesting), copy in BOTH locales (F7). The
 * menu itself is non-translatable; its items carry the labels (W6). Admin manages the menu
 * (create/list/delete) and its items (create/update/delete) individually.
 */
@Injectable()
export class MenuService {
  constructor(
    private readonly menus: MenuRepository,
    private readonly items: MenuItemRepository,
  ) {}

  /** The assembled menu the website renders by key. 404 when the keyed menu is absent. */
  async getByKey(key: MenuKey): Promise<MenuTree> {
    const menu = await this.menus.findByKey(key);
    if (!menu) {
      throw contentNotFound('Menu', key);
    }
    const rows = (await this.items.listForMenu(menu.id)).sort(bySortOrder);
    const fields = await this.items.localizedFieldsForMany(
      rows.map((row) => row.id),
    );

    const childrenByParent = new Map<string, MenuItemRow[]>();
    for (const row of rows) {
      if (row.parentId !== null) {
        const list = childrenByParent.get(row.parentId) ?? [];
        list.push(row);
        childrenByParent.set(row.parentId, list);
      }
    }

    const items: MenuItemNode[] = rows
      .filter((row) => row.parentId === null)
      .map((row) =>
        assembleMenuItemNode(
          row,
          fields.get(row.id),
          (childrenByParent.get(row.id) ?? []).map((child) =>
            assembleMenuItemNode(child, fields.get(child.id), []),
          ),
        ),
      );

    return assembleMenuTree(menu, items);
  }

  /** All menus (admin list — a small fixed set), sorted by `sortOrder`. */
  async list(): Promise<MenuSummary[]> {
    const rows = (await this.menus.listAll()).sort(bySortOrder);
    return rows.map((row) => assembleMenuSummary(row));
  }

  /** Create a keyed menu (admin). 409 if the key is already in use. */
  async create(req: MenuCreateRequest): Promise<MenuSummary> {
    const existing = await this.menus.findByKey(req.key);
    if (existing) {
      throw slugConflict(req.key);
    }
    const created = await this.menus.create({
      key: req.key,
      sortOrder: req.sortOrder,
    });
    return assembleMenuSummary(created);
  }

  /** Soft-delete a menu (admin) — its items cascade. */
  async delete(id: string): Promise<ContentId> {
    const existing = await this.menus.find(id);
    if (!existing) {
      throw contentNotFound('Menu', id);
    }
    await this.menus.delete(id);
    return { id };
  }

  /** Create a menu item + both-locale label (admin). */
  async createItem(req: MenuItemCreateRequest): Promise<MenuItemNode> {
    const created = await this.items.create({
      menuId: req.menuId,
      parentId: req.parentId ?? null,
      url: req.url,
      icon: req.icon ?? null,
      sortOrder: req.sortOrder,
    });
    await this.items.upsertTranslations(created.id, { label: req.label });
    return this.itemNode(created.id);
  }

  /** Update a menu item by id (admin). Only provided fields change. */
  async updateItem(req: MenuItemUpdateRequest): Promise<MenuItemNode> {
    const existing = await this.items.find(req.id);
    if (!existing) {
      throw contentNotFound('MenuItem', req.id);
    }

    const base: Partial<MenuItemInsert> = {};
    if (req.parentId !== undefined) base.parentId = req.parentId;
    if (req.url !== undefined) base.url = req.url;
    if (req.icon !== undefined) base.icon = req.icon;
    if (req.sortOrder !== undefined) base.sortOrder = req.sortOrder;
    if (Object.keys(base).length > 0) {
      await this.items.update(req.id, base);
    }
    if (req.label) {
      await this.items.upsertTranslations(req.id, { label: req.label });
    }

    return this.itemNode(req.id);
  }

  /** Soft-delete a menu item (admin) — its children cascade. */
  async deleteItem(id: string): Promise<ContentId> {
    const existing = await this.items.find(id);
    if (!existing) {
      throw contentNotFound('MenuItem', id);
    }
    await this.items.delete(id);
    return { id };
  }

  // ===== helpers =====
  private async itemNode(id: string): Promise<MenuItemNode> {
    const row = await this.items.findOrFail(id);
    const children = (await this.items.listChildren(id)).sort(bySortOrder);
    const ids = [id, ...children.map((child) => child.id)];
    const fields = await this.items.localizedFieldsForMany(ids);
    return assembleMenuItemNode(
      row,
      fields.get(id),
      children.map((child) =>
        assembleMenuItemNode(child, fields.get(child.id), []),
      ),
    );
  }
}
