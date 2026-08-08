import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import { useUpdateTeamMemberMutation } from '../api/team.api';

/**
 * The inline `featured` toggle handler (W6, U5): PATCHes a partial `{ featured }` body and
 * toasts on failure. RTK tag invalidation reconciles the row; permission gating is on the
 * Switch (disabled without `content.manage`).
 */
export function useToggleTeamFeatured(): (
  id: string,
  featured: boolean,
) => Promise<void> {
  const { t } = useTranslation('team');
  const [updateTeamMember] = useUpdateTeamMemberMutation();

  return async (id: string, featured: boolean): Promise<void> => {
    try {
      await updateTeamMember({ id, body: { featured } }).unwrap();
    } catch {
      toast.error(t('errors.updateFailed'));
    }
  };
}
