import type { MenuKey, MenuSummary } from '@sanad/contracts';
import { useListMenusQuery } from '../api/menus.api';

interface UseMenusListResult {
  menus: MenuSummary[];
  isLoading: boolean;
  isError: boolean;
  /** The summary for a keyed menu, or undefined when it hasn't been created yet. */
  byKey: (key: MenuKey) => MenuSummary | undefined;
}

/**
 * The menus list (U5): the small fixed set of keyed menus that exist. The page uses `byKey` to
 * decide whether to render a menu's editor or offer to create it (menus are created on demand).
 */
export function useMenusList(): UseMenusListResult {
  const { data, isLoading, isError } = useListMenusQuery();
  const menus = data ?? [];
  return {
    menus,
    isLoading,
    isError,
    byKey: (key) => menus.find((menu) => menu.key === key),
  };
}
