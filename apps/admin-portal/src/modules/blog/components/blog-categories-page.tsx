import { pickLocalized, type BlogCategoryItem } from '@sanad/contracts';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import {
  DataTable,
  useBulkSelection,
  useReorder,
  type BulkAction,
  type DataTableColumn,
  type RowAction,
} from '../../../components/data-table';
import { Button } from '../../../components/ui/button';
import { useModalActions } from '../../../data/modal/use-modal';
import { useFormatDateTime } from '../../../lib/format';
import { useDirection } from '../../../providers/direction/use-direction';
import { useReorderBlogCategoriesMutation } from '../api/blog-categories.api';
import { useBlogCategoriesList } from '../hooks/use-blog-categories-list';
import { useDeleteBlogCategories } from '../hooks/use-delete-blog-categories';
import { BLOG_CATEGORY_FORM_MODAL } from './blog-category-form-modal';

/**
 * The blog categories sub-page (W1): the post taxonomy as a kit DataTable + create/edit modal +
 * delete confirmation. Reachable from the posts page; a "Back to posts" link returns. The icon
 * flips under RTL (logical direction).
 */
export function BlogCategoriesPage() {
  const { t } = useTranslation('blog');
  const canManage = useRequirePermission('content.manage');
  const { open } = useModalActions();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = useBlogCategoriesList();
  const selection = useBulkSelection(rows, (row: BlogCategoryItem) => row.id);
  const { requestDelete, requestDeleteMany } = useDeleteBlogCategories();
  const [reorderBlogCategories] = useReorderBlogCategoriesMutation();
  const onReorder = useReorder((ids) =>
    reorderBlogCategories({ ids }).unwrap(),
  );

  const columns: DataTableColumn<BlogCategoryItem>[] = [
    {
      id: 'name',
      header: t('categoryColumns.name'),
      cell: (row) => (
        <span className="font-medium text-text">
          {pickLocalized(row.name, locale)}
        </span>
      ),
    },
    {
      id: 'slug',
      header: t('categoryColumns.slug'),
      cell: (row) => <span className="text-dim">{row.slug}</span>,
    },
    {
      id: 'updatedAt',
      header: t('categoryColumns.updatedAt'),
      align: 'end',
      cell: (row) => (
        <span className="text-dim">{formatDate(row.updatedAt)}</span>
      ),
    },
  ];

  const rowActions: RowAction<BlogCategoryItem>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => open(BLOG_CATEGORY_FORM_MODAL, { item: row }),
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
        <div className="flex flex-col gap-2">
          <Link
            to="/content/blog"
            className="inline-flex w-fit items-center gap-1 text-sm text-dim hover:text-text"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            {t('actions.backToPosts')}
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-text">
              {t('categoryTitle')}
            </h1>
            <p className="text-sm text-dim">{t('categorySubtitle')}</p>
          </div>
        </div>
        {canManage ? (
          <Button onClick={() => open(BLOG_CATEGORY_FORM_MODAL)}>
            {t('actions.createCategory')}
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
        rowActions={canManage ? rowActions : undefined}
        bulkActions={canManage ? bulkActions : undefined}
        selection={canManage ? selection : undefined}
        reorder={canManage ? { onReorder } : undefined}
      />
    </section>
  );
}
