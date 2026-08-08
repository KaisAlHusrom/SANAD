import type { MenuKey } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import { useCreateMenuMutation } from '../api/menus.api';

interface UseCreateMenuResult {
  create: (key: MenuKey) => Promise<void>;
  isLoading: boolean;
}

/** Create a keyed menu on demand (U5) — the empty-state action before items can be added. */
export function useCreateMenu(): UseCreateMenuResult {
  const { t } = useTranslation('menus');
  const [createMenu, { isLoading }] = useCreateMenuMutation();

  const create = async (key: MenuKey): Promise<void> => {
    try {
      await createMenu({ key, sortOrder: key === 'primary' ? 0 : 1 }).unwrap();
      toast.success(t('menu.created'));
    } catch {
      toast.error(t('errors.saveFailed'));
    }
  };

  return { create, isLoading };
}
