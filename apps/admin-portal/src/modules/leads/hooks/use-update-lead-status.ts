import type { LeadStatus } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import { useUpdateLeadStatusMutation } from '../api/leads.api';

/**
 * Status-transition logic (U5): patches the lead's inbox status and toasts the outcome. Used
 * by the inline status cell; perm-gating happens at the call site (`content.manage`).
 */
export function useUpdateLeadStatus(): (
  id: string,
  status: LeadStatus,
) => Promise<void> {
  const { t } = useTranslation('leads');
  const [updateLeadStatus] = useUpdateLeadStatusMutation();

  return async (id: string, status: LeadStatus): Promise<void> => {
    try {
      await updateLeadStatus({ id, status }).unwrap();
      toast.success(t('statusUpdate.toastSuccess'));
    } catch {
      toast.error(t('statusUpdate.toastError'));
    }
  };
}
