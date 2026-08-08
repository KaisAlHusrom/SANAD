import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../data/confirm';
import { toast } from '../../../data/toast';
import { useDeleteTeamMemberMutation } from '../api/team.api';

interface UseDeleteTeamResult {
  requestDelete: (id: string) => Promise<void>;
  requestDeleteMany: (ids: string[]) => Promise<void>;
}

/** Delete-team-member logic (U5): shared mutation-aware confirmation + toast (single + bulk). */
export function useDeleteTeam(): UseDeleteTeamResult {
  const { t } = useTranslation('team');
  const { confirm } = useConfirm();
  const [deleteTeamMember] = useDeleteTeamMemberMutation();

  const requestDelete = async (id: string): Promise<void> => {
    await confirm({
      title: t('delete.title'),
      message: t('delete.message'),
      variant: 'danger',
      confirmLabel: t('delete.confirm'),
      onConfirm: async () => {
        try {
          await deleteTeamMember(id).unwrap();
          toast.success(t('delete.toastSuccess'));
        } catch {
          const message = t('errors.deleteFailed');
          toast.error(message);
          throw new Error(message);
        }
      },
    });
  };

  const requestDeleteMany = async (ids: string[]): Promise<void> => {
    const confirmed = await confirm({
      title: t('delete.bulkTitle'),
      message: t('delete.bulkMessage', { count: ids.length }),
      variant: 'danger',
      confirmLabel: t('delete.confirm'),
      onConfirm: async () => {
        try {
          await Promise.all(ids.map((id) => deleteTeamMember(id).unwrap()));
          toast.success(t('delete.bulkToastSuccess', { count: ids.length }));
        } catch {
          const message = t('errors.deleteFailed');
          toast.error(message);
          throw new Error(message);
        }
      },
    });
    if (!confirmed) {
      throw new Error('cancelled');
    }
  };

  return { requestDelete, requestDeleteMany };
}
