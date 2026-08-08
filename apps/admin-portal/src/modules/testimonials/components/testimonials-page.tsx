import { pickLocalized, type TestimonialItem } from '@sanad/contracts';
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
import { Switch } from '../../../components/ui/switch';
import { useModalActions } from '../../../data/modal/use-modal';
import { useEditQueryParam } from '../../../hooks/use-edit-query-param';
import { useReorderTestimonialsMutation } from '../api/testimonials.api';
import { useFormatDateTime } from '../../../lib/format';
import { useDirection } from '../../../providers/direction/use-direction';
import { useDeleteTestimonials } from '../hooks/use-delete-testimonials';
import { useTestimonialsList } from '../hooks/use-testimonials-list';
import { useToggleTestimonialFeatured } from '../hooks/use-toggle-testimonial-featured';
import { TESTIMONIAL_FORM_MODAL } from './testimonial-form-modal';

/** The testimonials CMS page: a kit DataTable + create/edit modal + inline featured Switch (W6). */
export function TestimonialsPage() {
  const { t } = useTranslation('testimonials');
  const canManage = useRequirePermission('content.manage');
  const { open } = useModalActions();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = useTestimonialsList();
  const selection = useBulkSelection(rows, (row: TestimonialItem) => row.id);
  const { requestDelete, requestDeleteMany } = useDeleteTestimonials();
  const toggleFeatured = useToggleTestimonialFeatured();
  const [reorderTestimonials] = useReorderTestimonialsMutation();
  const onReorder = useReorder((ids) => reorderTestimonials({ ids }).unwrap());
  // deep-link from the Content Studio: `?edit=<id>` opens that testimonial's editor (an avatar click)
  useEditQueryParam(
    rows,
    (row) => row.id,
    (row) => open(TESTIMONIAL_FORM_MODAL, { item: row }),
  );

  const columns: DataTableColumn<TestimonialItem>[] = [
    {
      id: 'authorName',
      header: t('columns.author'),
      cell: (row) => (
        <span className="font-medium text-text">{row.authorName}</span>
      ),
    },
    {
      id: 'companyName',
      header: t('columns.company'),
      cell: (row) => <span className="text-dim">{row.companyName ?? '—'}</span>,
    },
    {
      id: 'quote',
      header: t('columns.quote'),
      cell: (row) => (
        <span className="line-clamp-1 max-w-xs text-dim">
          {pickLocalized(row.quote, locale)}
        </span>
      ),
    },
    {
      id: 'rating',
      header: t('columns.rating'),
      align: 'center',
      cell: (row) => row.rating ?? '—',
    },
    {
      id: 'featured',
      header: t('columns.featured'),
      align: 'center',
      cell: (row) => (
        <Switch
          checked={row.featured}
          disabled={!canManage}
          onCheckedChange={(next) => void toggleFeatured(row.id, next)}
          aria-label={t('columns.featured')}
        />
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

  const filters: FilterDef[] = [
    { key: 'featured', kind: 'boolean', label: t('filters.featured') },
  ];

  const rowActions: RowAction<TestimonialItem>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => open(TESTIMONIAL_FORM_MODAL, { item: row }),
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
          <Button onClick={() => open(TESTIMONIAL_FORM_MODAL)}>
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
