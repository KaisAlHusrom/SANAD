import type { Lead, LeadStatus } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { Badge, type BadgeProps } from '../../../components/ui/badge';
import { useFormatDateTime } from '../../../lib/format';

/** Status → badge tone, mirroring the leads inbox canon (new = accent, contacted = good). */
const STATUS_TONE: Record<LeadStatus, BadgeProps['tone']> = {
  new: 'accent',
  contacted: 'good',
  archived: 'neutral',
};

interface RecentLeadRowProps {
  lead: Lead;
}

/** One row in the dashboard "recent leads" panel — display-only (name, status, date). */
export function RecentLeadRow({ lead }: RecentLeadRowProps) {
  const { t } = useTranslation('leads');
  const formatDate = useFormatDateTime();

  return (
    <div className="flex items-center justify-between gap-3 rounded-nav px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-text">
          {lead.name}
        </span>
        <span className="truncate text-xs text-faint" dir="ltr">
          {lead.email}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Badge tone={STATUS_TONE[lead.status]} dot>
          {t(`statuses.${lead.status}`)}
        </Badge>
        <span className="font-mono text-xs text-faint">
          {formatDate(lead.createdAt)}
        </span>
      </div>
    </div>
  );
}
