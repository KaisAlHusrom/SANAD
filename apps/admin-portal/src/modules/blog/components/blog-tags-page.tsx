import { pickLocalized, type BlogTagItem } from '@sanad/contracts';
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
import { useReorderBlogTagsMutation } from '../api/blog-tags.api';
import { useBlogTagsList } from '../hooks/use-blog-tags-list';
import { useDeleteBlogTags } from '../hooks/use-delete-blog-tags';
import { BLOG_TAG_FORM_MODAL } from './blog-tag-form-modal';

/**
 * The blog tags sub-page (W1): the post tag set as a kit DataTable + create/edit modal + delete
 * confirmation. Reachable from the posts page; a "Back to posts" link returns. The icon flips
 * under RTL (logical direction).
 */
export function BlogTagsPage() {
  const { t } = useTranslation('blog');
  const canManage = useRequirePermission('content.manage');
  const { open } = useModalActions();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = useBlogTagsList();
  const selection = useBulkSelection(rows, (row: BlogTagItem) => row.id);
  const { requestDelete, requestDeleteMany } = useDeleteBlogTags();
  const [reorderTags] = useReorderBlogTagsMutation();
  const onReorder = useReorder((ids) => reorderTags({ ids }).unwrap());

  const columns: DataTableColumn<BlogTagItem>[] = [
    {
      id: 'name',
      header: t('tagColumns.name'),
      cell: (row) => (
        <span className="font-medium text-text">
          {pickLocalized(row.name, locale)}
        </span>
      ),
    },
    {
      id: 'slug',
      header: t('tagColumns.slug'),
      cell: (row) => <span className="text-dim">{row.slug}</span>,
    },
    {
      id: 'updatedAt',
      header: t('tagColumns.updatedAt'),
      align: 'end',
      cell: (row) => (
        <span className="text-dim">{formatDate(row.updatedAt)}</span>
      ),
    },
  ];

  const rowActions: RowAction<BlogTagItem>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => open(BLOG_TAG_FORM_MODAL, { item: row }),
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
            <h1 className="text-xl font-semibold text-text">{t('tagTitle')}</h1>
            <p className="text-sm text-dim">{t('tagSubtitle')}</p>
          </div>
        </div>
        {canManage ? (
          <Button onClick={() => open(BLOG_TAG_FORM_MODAL)}>
            {t('actions.createTag')}
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
