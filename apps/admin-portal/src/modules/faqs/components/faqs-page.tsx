import { pickLocalized, type FaqItem } from '@sanad/contracts';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
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
import { useModalActions } from '../../../data/modal/use-modal';
import { useFormatDateTime } from '../../../lib/format';
import { useDirection } from '../../../providers/direction/use-direction';
import { useReorderFaqsMutation } from '../api/faqs.api';
import { useDeleteFaqs } from '../hooks/use-delete-faqs';
import { useFaqsList } from '../hooks/use-faqs-list';
import { FAQ_FORM_MODAL } from './faq-form-modal';

/** The FAQs CMS page: a kit DataTable + create/edit modal + delete confirmation (W1). */
export function FaqsPage() {
  const { t } = useTranslation('faqs');
  const canManage = useRequirePermission('content.manage');
  const { open } = useModalActions();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = useFaqsList();
  const selection = useBulkSelection(rows, (row: FaqItem) => row.id);
  const { requestDelete, requestDeleteMany } = useDeleteFaqs();
  const [reorderFaqs] = useReorderFaqsMutation();
  const onReorder = useReorder((ids) => reorderFaqs({ ids }).unwrap());

  const columns: DataTableColumn<FaqItem>[] = [
    {
      id: 'question',
      header: t('columns.question'),
      cell: (row) => (
        <span className="font-medium text-text">
          {pickLocalized(row.question, locale)}
        </span>
      ),
    },
    {
      id: 'category',
      header: t('columns.category'),
      cell: (row) => (row.category ? t(`categories.${row.category}`) : '—'),
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
        { value: 'general', label: t('categories.general') },
        { value: 'pricing', label: t('categories.pricing') },
        { value: 'process', label: t('categories.process') },
        { value: 'support', label: t('categories.support') },
      ],
    },
  ];

  const rowActions: RowAction<FaqItem>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => open(FAQ_FORM_MODAL, { item: row }),
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
          <Button onClick={() => open(FAQ_FORM_MODAL)}>
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
