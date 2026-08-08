import { pickLocalized, type ServiceItem } from '@sanad/contracts';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DataTable,
  useBulkSelection,
  useReorder,
  type BulkAction,
  type DataTableColumn,
  type FilterDef,
  type RowAction,
} from '../../../components/data-table';
import { Button } from '../../../components/ui/button';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import { useModalActions } from '../../../data/modal/use-modal';
import { useFormatDateTime } from '../../../lib/format';
import { useDirection } from '../../../providers/direction/use-direction';
import { useReorderServicesMutation } from '../api/services.api';
import { useDeleteServices } from '../hooks/use-delete-services';
import { useServicesList } from '../hooks/use-services-list';
import { SERVICE_FORM_MODAL } from './service-form-modal';

/** The services CMS page: a kit DataTable + create/edit modal + delete confirmation (W1). */
export function ServicesPage() {
  const { t } = useTranslation('services');
  const canManage = useRequirePermission('content.manage');
  const { open } = useModalActions();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = useServicesList();
  const selection = useBulkSelection(rows, (row: ServiceItem) => row.id);
  const { requestDelete, requestDeleteMany } = useDeleteServices();
  const [reorderServices] = useReorderServicesMutation();
  const onReorder = useReorder((ids) => reorderServices({ ids }).unwrap());

  const columns: DataTableColumn<ServiceItem>[] = [
    {
      id: 'title',
      header: t('columns.title'),
      cell: (row) => (
        <span className="font-medium text-text">
          {pickLocalized(row.title, locale)}
        </span>
      ),
    },
    {
      id: 'slug',
      header: t('columns.slug'),
      cell: (row) => <span className="text-dim">{row.slug}</span>,
    },
    {
      id: 'category',
      header: t('columns.category'),
      cell: (row) => t(`categories.${row.category}`),
    },
    {
      id: 'updatedAt',
      header: t('columns.updatedAt'),
      align: 'end',
      cell: (row) => (
        <span className="text-dim">{formatDate(row.updatedAt)}</span>
      ),
    },
  ];

  const filters: FilterDef[] = [
    {
      key: 'category',
      kind: 'select',
      label: t('filters.category'),
      options: [
        { value: 'core', label: t('categories.core') },
        { value: 'support', label: t('categories.support') },
      ],
    },
  ];

  const rowActions: RowAction<ServiceItem>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => open(SERVICE_FORM_MODAL, { item: row }),
    },
    {
      key: 'delete',
      label: t('actions.delete'),
      icon: <Trash2 className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      tone: 'danger',
      onSelect: (row) => {
        void requestDelete(row.id);
      },
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'delete',
      label: t('actions.delete'),
      permission: 'content.manage',
      tone: 'danger',
      onRun: (ids) => requestDeleteMany(ids),
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
          <p className="text-sm text-dim">{t('subtitle')}</p>
        </div>
        {canManage ? (
          <Button onClick={() => open(SERVICE_FORM_MODAL)}>
            {t('actions.create')}
          </Button>
        ) : null}
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
        rowActions={canManage ? rowActions : undefined}
        bulkActions={canManage ? bulkActions : undefined}
        selection={canManage ? selection : undefined}
        reorder={canManage ? { onReorder } : undefined}
      />
    </section>
  );
}
