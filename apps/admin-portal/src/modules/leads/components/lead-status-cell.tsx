import { leadStatusSchema, type Lead, type LeadStatus } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { SelectField } from '../../../components/ui/select';
import { useUpdateLeadStatus } from '../hooks/use-update-lead-status';

/** Status → badge tone (design canon): new = accent, contacted = good, archived = neutral. */
const STATUS_TONE: Record<LeadStatus, BadgeProps['tone']> = {
  new: 'accent',
  contacted: 'good',
  archived: 'neutral',
};

interface LeadStatusCellProps {
  lead: Lead;
  canManage: boolean;
}

/**
 * The inline status control (W6): managers get a styled Select wired to the update mutation;
 * read-only users see a tinted Badge. Changing the value PATCHes the lead's status.
 */
export function LeadStatusCell({ lead, canManage }: LeadStatusCellProps) {
  const { t } = useTranslation('leads');
  const updateStatus = useUpdateLeadStatus();

  if (!canManage) {
    return (
      <Badge tone={STATUS_TONE[lead.status]} dot>
        {t(`statuses.${lead.status}`)}
      </Badge>
    );
  }

  const options = leadStatusSchema.options.map((status) => ({
    value: status,
    label: t(`statuses.${status}`),
  }));

  return (
    <SelectField
      size="xs"
      className="w-36"
      options={options}
      value={lead.status}
      aria-label={t('changeStatus')}
      onValueChange={(value) => {
        const parsed = leadStatusSchema.safeParse(value);
        if (parsed.success && parsed.data !== lead.status) {
          void updateStatus(lead.id, parsed.data);
        }
      }}
    />
  );
}
