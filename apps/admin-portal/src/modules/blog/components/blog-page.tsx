import { pickLocalized, type BlogPostItem } from '@sanad/contracts';
import { FolderTree, Pencil, Tags, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import {
  DataTable,
  useBulkSelection,
  type BulkAction,
  type DataTableColumn,
  type FilterDef,
  type RowAction,
} from '../../../components/data-table';
import { Badge } from '../../../components/ui/badge';
import { Button, buttonVariants } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { useFormatDateTime } from '../../../lib/format';
import { useDirection } from '../../../providers/direction/use-direction';
import { useBlogList } from '../hooks/use-blog-list';
import { useDeleteBlog } from '../hooks/use-delete-blog';
import { useToggleBlogStatus } from '../hooks/use-toggle-blog-status';

/**
 * The blog posts CMS page (W1): a kit DataTable + create/edit modal + an inline draft↔published
 * Switch (W6). "Manage categories" / "Manage tags" links open the taxonomy sub-pages. Reads the
 * draft-visible admin list.
 */
export function BlogPage() {
  const { t } = useTranslation('blog');
  const canManage = useRequirePermission('content.manage');
  const navigate = useNavigate();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = useBlogList();
  const selection = useBulkSelection(rows, (row: BlogPostItem) => row.id);
  const { requestDelete, requestDeleteMany } = useDeleteBlog();
  const toggleStatus = useToggleBlogStatus();

  const columns: DataTableColumn<BlogPostItem>[] = [
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
      id: 'author',
      header: t('columns.author'),
      cell: (row) =>
        row.author ? (
          <span className="text-dim">
            {pickLocalized(row.author.name, locale)}
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
  ];

  const rowActions: RowAction<BlogPostItem>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => navigate(`/content/blog/${row.id}/edit`),
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
            to="/content/blog/categories"
            className={buttonVariants({ variant: 'secondary' })}
          >
            <FolderTree className="size-4" aria-hidden="true" />
            {t('actions.manageCategories')}
          </Link>
          <Link
            to="/content/blog/tags"
            className={buttonVariants({ variant: 'secondary' })}
          >
            <Tags className="size-4" aria-hidden="true" />
            {t('actions.manageTags')}
          </Link>
          {canManage ? (
            <Button onClick={() => navigate('/content/blog/new')}>
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
      />
    </section>
  );
}
