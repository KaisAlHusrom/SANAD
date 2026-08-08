import { pickLocalized, type PortfolioProjectItem } from '@sanad/contracts';
import { FolderTree, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
import { Badge } from '../../../components/ui/badge';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { useModalActions } from '../../../data/modal/use-modal';
import { useEditQueryParam } from '../../../hooks/use-edit-query-param';
import { useFormatDateTime } from '../../../lib/format';
import { useDirection } from '../../../providers/direction/use-direction';
import { useReorderPortfolioMutation } from '../api/portfolio.api';
import { useDeletePortfolio } from '../hooks/use-delete-portfolio';
import { usePortfolioList } from '../hooks/use-portfolio-list';
import { useTogglePortfolioFeatured } from '../hooks/use-toggle-portfolio-featured';
import { useTogglePortfolioStatus } from '../hooks/use-toggle-portfolio-status';
import { PORTFOLIO_FORM_MODAL } from './portfolio-form-modal';

/**
 * The portfolio projects CMS page (W1): a kit DataTable + create/edit modal + inline
 * draft↔published and featured Switches (W6). A "Manage categories" link opens the categories
 * sub-page. Reads the draft-visible admin list.
 */
export function PortfolioPage() {
  const { t } = useTranslation('portfolio');
  const canManage = useRequirePermission('content.manage');
  const { open } = useModalActions();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = usePortfolioList();
  const selection = useBulkSelection(
    rows,
    (row: PortfolioProjectItem) => row.id,
  );
  const { requestDelete, requestDeleteMany } = useDeletePortfolio();
  const toggleStatus = useTogglePortfolioStatus();
  const toggleFeatured = useTogglePortfolioFeatured();
  const [reorderPortfolio] = useReorderPortfolioMutation();
  const onReorder = useReorder((ids) => reorderPortfolio({ ids }).unwrap());
  // deep-link from the Content Studio: `?edit=<id>` opens that project's editor (a work-cover click)
  useEditQueryParam(
    rows,
    (row) => row.id,
    (row) => open(PORTFOLIO_FORM_MODAL, { item: row }),
  );

  const columns: DataTableColumn<PortfolioProjectItem>[] = [
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
      id: 'category',
      header: t('columns.category'),
      cell: (row) =>
        row.category ? (
          <span className="text-dim">
            {pickLocalized(row.category.name, locale)}
          </span>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
    {
      id: 'status',
      header: t('columns.status'),
      align: 'center',
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={row.status === 'published'}
            disabled={!canManage}
            onCheckedChange={(next) => void toggleStatus(row.id, next)}
            aria-label={t('columns.status')}
          />
          <Badge tone={row.status === 'published' ? 'good' : 'warn'} dot>
            {t(`status.${row.status}`)}
          </Badge>
        </div>
      ),
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
    {
      key: 'status',
      kind: 'select',
      label: t('filters.status'),
      options: [
        { value: 'draft', label: t('status.draft') },
        { value: 'published', label: t('status.published') },
      ],
    },
    { key: 'featured', kind: 'boolean', label: t('filters.featured') },
  ];

  const rowActions: RowAction<PortfolioProjectItem>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => open(PORTFOLIO_FORM_MODAL, { item: row }),
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
        <div className="flex items-center gap-2">
          <Link
            to="/content/portfolio/categories"
            className={buttonVariants({ variant: 'secondary' })}
          >
            <FolderTree className="size-4" aria-hidden="true" />
            {t('actions.manageCategories')}
          </Link>
          {canManage ? (
            <Button onClick={() => open(PORTFOLIO_FORM_MODAL)}>
              {t('actions.create')}
            </Button>
          ) : null}
        </div>
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
