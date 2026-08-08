import type { MenuKey, MenuTree } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Read a keyed navigation menu tree (`primary` header / `footer`) — public (WEB1). The
 * shell renders the header + footer from these. Tagged so an admin menu edit revalidates.
 */
export function getMenu(key: MenuKey): Promise<MenuTree> {
  return fetchEnvelope<MenuTree>(`/content/menus/${key}`, {
    revalidate: 60,
    tags: ['menus', `menu:${key}`],
  });
}
