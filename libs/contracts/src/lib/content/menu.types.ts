import type { LocalizedText } from '../common/localized-text.js';
import type { MenuKey } from './menu-key.zod.types.js';

/**
 * A navigation menu item as the gateway returns it (WEB1). `url`/`icon` are non-translatable;
 * the translatable `label` is carried in BOTH locales (`LocalizedText`, null-safe — F7).
 * `children` holds one level of nesting (footer columns / dropdowns). Pure shape (U16).
 */
export interface MenuItemNode {
  id: string;
  url: string;
  icon: string | null;
  sortOrder: number;
  label: LocalizedText;
  children: MenuItemNode[];
}

/**
 * The assembled menu the website renders by key (`primary`/`footer`) — top-level items
 * (parentId null), each carrying its `children`, ordered by `sortOrder`.
 */
export interface MenuTree {
  id: string;
  key: MenuKey;
  sortOrder: number;
  items: MenuItemNode[];
  createdAt: string;
  updatedAt: string;
}

/** A menu row WITHOUT its items — the admin menu list (P7). */
export interface MenuSummary {
  id: string;
  key: MenuKey;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
