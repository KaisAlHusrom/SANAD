import type {
  LocalizedText,
  MenuItemNode,
  MenuSummary,
  MenuTree,
} from '@sanad/contracts';
import type { MenuItemRow, MenuRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Assemble a menu item node with its label resolved to both locales (F7) + its children. */
export function assembleMenuItemNode(
  row: MenuItemRow,
  fields: Record<string, LocalizedText> | undefined,
  children: MenuItemNode[],
): MenuItemNode {
  return {
    id: row.id,
    url: row.url,
    icon: row.icon,
    sortOrder: row.sortOrder,
    label: fields?.['label'] ?? EMPTY,
    children,
  };
}

/** Assemble the menu tree the website renders by key. */
export function assembleMenuTree(
  row: MenuRow,
  items: MenuItemNode[],
): MenuTree {
  return {
    id: row.id,
    key: row.key,
    sortOrder: row.sortOrder,
    items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Assemble a menu row WITHOUT its items (the admin list). */
export function assembleMenuSummary(row: MenuRow): MenuSummary {
  return {
    id: row.id,
    key: row.key,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
