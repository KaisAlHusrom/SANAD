import { useTranslation } from 'react-i18next';
import { toast } from '../../data/toast';

/**
 * Adapts a module's reorder mutation into the `DataTable` `reorder.onReorder` callback (U21):
 * fires the PATCH, toasts success, and on failure toasts + rethrows so the table reverts its
 * optimistic order. `mutate` is the RTK mutation thunk's `.unwrap()` call, e.g.
 * `(ids) => reorderTags({ ids }).unwrap()`.
 */
export function useReorder<TResult>(
  mutate: (ids: string[]) => Promise<TResult>,
): (orderedIds: string[]) => Promise<void> {
  const { t } = useTranslation('uiKit');
  return async (orderedIds: string[]): Promise<void> => {
    try {
      await mutate(orderedIds);
      toast.success(t('table.reorderSaved'));
    } catch (error) {
      toast.error(t('table.reorderFailed'));
      throw error;
    }
  };
}
