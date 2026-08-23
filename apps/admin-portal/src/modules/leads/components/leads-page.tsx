import type { Lead } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import {
  DataTable,
  type DataTableColumn,
  type FilterDef,
} from '../../../components/data-table';
import { EmptyState } from '../../../components/feedback/empty-state';
import { PhoneLink } from '../../../components/phone-link';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useFormatDateTime } from '../../../lib/format';
import { useLeadsList } from '../hooks/use-leads-list';
import { LeadSpamBadge } from './lead-spam-badge';
import { LeadStatusCell } from './lead-status-cell';

/** The leads inbox: a kit DataTable with status/source filters + inline status change (W1). */
export function LeadsPage() {
  const { t } = useTranslation('leads');
  const canManage = useRequirePermission('content.manage');
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = useLeadsList();

  const columns: DataTableColumn<Lead>[] = [
    {
      id: 'name',
      header: t('columns.client'),
      cell: (row) => (
        <div className="flex flex-col">
          <span className="flex items-center gap-2 font-medium text-text">
            {row.name}
            {/* Only when it means something — a badge on every row is noise, not a signal. */}
            {row.submissionCount > 1 ? (
              <Badge tone="warn" title={t('repeat.title')}>
                {t('repeat.badge', { count: row.submissionCount })}
              </Badge>
            ) : null}
          </span>
          <span className="text-xs text-faint" dir="ltr">
            {row.email}
          </span>
        </div>
      ),
    },
    {
      id: 'phone',
      header: t('columns.phone'),
      cell: (row) => (
        <PhoneLink
          value={row.phone}
          fallback={t('noPhone')}
          className="text-dim"
        />
      ),
    },
    {
      id: 'company',
      header: t('columns.company'),
      cell: (row) => (
        <span className="text-dim">{row.company ?? t('noCompany')}</span>
      ),
    },
    {
      id: 'source',
      header: t('columns.source'),
      cell: (row) => <Badge>{t(`sources.${row.source}`)}</Badge>,
    },
    {
      id: 'status',
      header: t('columns.status'),
      cell: (row) => <LeadStatusCell lead={row} canManage={canManage} />,
    },
    {
      id: 'spam',
      header: t('columns.spam'),
      sortable: true,
      sortKey: 'spamScore',
      // Sortable so a flood can be worked from the top; quiet on a clean lead, which is most
      // of them — the badge itself decides whether to render anything (P8.10.B3).
      cell: (row) => (
        <LeadSpamBadge score={row.spamScore} signals={row.spamSignals} />
      ),
    },
    {
      id: 'createdAt',
      header: t('columns.createdAt'),
      align: 'end',
      sortable: true,
      sortKey: 'createdAt',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-dim">{formatDate(row.createdAt)}</span>
          {/* The first contact is what the column sorts by; the latest is what to act on. */}
          {row.submissionCount > 1 ? (
            <span className="text-xs text-faint">
              {t('repeat.lastAt', { at: formatDate(row.lastSubmittedAt) })}
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  const filters: FilterDef[] = [
    {
      key: 'status',
      kind: 'select',
      label: t('filters.status'),
      options: [
        { value: 'new', label: t('statuses.new') },
        { value: 'contacted', label: t('statuses.contacted') },
        { value: 'archived', label: t('statuses.archived') },
      ],
    },
    {
      key: 'source',
      kind: 'select',
      label: t('filters.source'),
      options: [
        { value: 'contact', label: t('sources.contact') },
        { value: 'request-project', label: t('sources.request-project') },
      ],
    },
    {
      key: 'spam',
      kind: 'select',
      label: t('filters.spam'),
      options: [
        { value: 'clean', label: t('spam.verdicts.clean') },
        { value: 'suspicious', label: t('spam.verdicts.suspicious') },
        { value: 'likelySpam', label: t('spam.verdicts.likelySpam') },
      ],
    },
  ];

  // Two genuinely different empties (U23): an inbox nobody has written to yet needs reassurance,
  // a filtered-to-nothing one needs a way back — and filtering to "likely spam" and finding none
  // is the most likely empty this feature produces.
  const empty =
    list.activeFilterCount > 0 || list.state.search ? (
      <EmptyState
        title={t('emptyFiltered.title')}
        description={t('emptyFiltered.body')}
        action={
          <Button type="button" variant="secondary" onClick={list.clearFilters}>
            {t('emptyFiltered.action')}
          </Button>
        }
      />
    ) : (
      <EmptyState
        title={t('emptyFirst.title')}
        description={t('emptyFirst.body')}
      />
    );

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-dim">{t('subtitle')}</p>
      </header>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        total={total}
        isLoading={isLoading}
        isError={isError}
        list={list}
        filters={filters}
        empty={empty}
      />
    </section>
  );
}
