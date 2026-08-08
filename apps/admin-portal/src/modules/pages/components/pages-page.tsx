import { pickLocalized, type PageSummary } from '@sanad/contracts';
import { LayoutTemplate, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import {
  DataTable,
  useBulkSelection,
  useReorder,
  type BulkAction,
  type DataTableColumn,
  type RowAction,
} from '../../../components/data-table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useModalActions } from '../../../data/modal/use-modal';
import { useFormatDateTime } from '../../../lib/format';
import { useDirection } from '../../../providers/direction/use-direction';
import { useReorderPagesMutation } from '../api/pages.api';
import { useDeletePage } from '../hooks/use-delete-page';
import { usePagesList } from '../hooks/use-pages-list';
import { PAGE_FORM_MODAL } from './page-form-modal';

/**
 * The pages list (W1): a kit DataTable of the website's pages — title/slug/status + an "Open
 * builder" row action into the section→block builder, create/edit page meta via the modal, and
 * drag-reorder (U21). Reads the draft-visible admin list.
 */
export function PagesPage() {
  const { t } = useTranslation('pages');
  const canManage = useRequirePermission('content.manage');
  const navigate = useNavigate();
  const { open } = useModalActions();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = usePagesList();
  const selection = useBulkSelection(rows, (row: PageSummary) => row.id);
  const { requestDelete, requestDeleteMany } = useDeletePage();
  const [reorderPages] = useReorderPagesMutation();
  const onReorder = useReorder((ids) => reorderPages({ ids }).unwrap());

  const columns: DataTableColumn<PageSummary>[] = [
    {
      id: 'title',
      header: t('columns.title'),
      cell: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/content/pages/${row.id}`)}
          className="font-medium text-text hover:text-accent"
        >
          {pickLocalized(row.title, locale) || row.slug}
        </button>
      ),
    },
    {
      id: 'slug',
      header: t('columns.slug'),
      cell: (row) => (
        <span className="font-mono text-sm text-dim">/{row.slug}</span>
      ),
    },
    {
      id: 'status',
      header: t('columns.status'),
      align: 'center',
      cell: (row) => (
        <Badge tone={row.status === 'published' ? 'good' : 'warn'} dot>
          {t(`status.${row.status}`)}
        </Badge>
      ),
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

  const rowActions: RowAction<PageSummary>[] = [
    {
      key: 'build',
      label: t('actions.openBuilder'),
      icon: <LayoutTemplate className="size-4" aria-hidden="true" />,
      onSelect: (row) => navigate(`/content/pages/${row.id}`),
    },
    {
      key: 'edit',
      label: t('actions.editMeta'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => open(PAGE_FORM_MODAL, { item: row }),
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
          <Button onClick={() => open(PAGE_FORM_MODAL)}>
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
        rowActions={rowActions}
        bulkActions={canManage ? bulkActions : undefined}
        selection={canManage ? selection : undefined}
        reorder={canManage ? { onReorder } : undefined}
      />
    </section>
  );
}
