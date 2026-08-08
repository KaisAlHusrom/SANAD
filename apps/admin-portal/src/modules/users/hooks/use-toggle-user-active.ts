import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import { useUpdateUserMutation } from '../api/users.api';

/**
 * Activate/deactivate logic (U5) for the inline status switch (W6). PATCHes `isActive` and
 * toasts the outcome; perm-gating happens at the call site (`identity.users.manage`).
 */
export function useToggleUserActive(): (
  id: string,
  isActive: boolean,
) => Promise<void> {
  const { t } = useTranslation('users');
  const [updateUser] = useUpdateUserMutation();

  return async (id: string, isActive: boolean): Promise<void> => {
    try {
      await updateUser({ id, body: { isActive } }).unwrap();
      toast.success(isActive ? t('toast.activated') : t('toast.deactivated'));
    } catch {
      toast.error(t('toast.updateError'));
    }
  };
}
