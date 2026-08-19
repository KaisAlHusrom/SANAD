import type { Lead } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import {
  DataTable,
  type DataTableColumn,
  type FilterDef,
} from '../../../components/data-table';
import { PhoneLink } from '../../../components/phone-link';
import { Badge } from '../../../components/ui/badge';
import { useFormatDateTime } from '../../../lib/format';
import { useLeadsList } from '../hooks/use-leads-list';
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
          <span className="font-medium text-text">{row.name}</span>
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
      id: 'createdAt',
      header: t('columns.createdAt'),
      align: 'end',
      sortable: true,
      sortKey: 'createdAt',
      cell: (row) => (
        <span className="text-dim">{formatDate(row.createdAt)}</span>
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
  ];

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
      />
    </section>
  );
}
