import { pickLocalized, type TeamMemberItem } from '@sanad/contracts';
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
import { useFormatDateTime } from '../../../lib/format';
import { useDirection } from '../../../providers/direction/use-direction';
import { useReorderTeamMutation } from '../api/team.api';
import { useDeleteTeam } from '../hooks/use-delete-team';
import { useTeamList } from '../hooks/use-team-list';
import { useToggleTeamFeatured } from '../hooks/use-toggle-team-featured';
import { TEAM_FORM_MODAL } from './team-form-modal';

/** The team CMS page: a kit DataTable + create/edit modal + inline featured Switch (W6). */
export function TeamPage() {
  const { t } = useTranslation('team');
  const canManage = useRequirePermission('content.manage');
  const { open } = useModalActions();
  const { locale } = useDirection();
  const formatDate = useFormatDateTime();
  const { list, rows, total, isLoading, isError } = useTeamList();
  const selection = useBulkSelection(rows, (row: TeamMemberItem) => row.id);
  const { requestDelete, requestDeleteMany } = useDeleteTeam();
  const toggleFeatured = useToggleTeamFeatured();
  const [reorderTeam] = useReorderTeamMutation();
  const onReorder = useReorder((ids) => reorderTeam({ ids }).unwrap());

  const columns: DataTableColumn<TeamMemberItem>[] = [
    {
      id: 'name',
      header: t('columns.name'),
      cell: (row) => (
        <span className="font-medium text-text">
          {pickLocalized(row.name, locale)}
        </span>
      ),
    },
    {
      id: 'role',
      header: t('columns.role'),
      cell: (row) => (
        <span className="text-dim">{pickLocalized(row.role, locale)}</span>
      ),
    },
    {
      id: 'slug',
      header: t('columns.slug'),
      cell: (row) => <span className="text-dim">{row.slug}</span>,
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

  const rowActions: RowAction<TeamMemberItem>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'content.manage',
      onSelect: (row) => open(TEAM_FORM_MODAL, { item: row }),
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
          <Button onClick={() => open(TEAM_FORM_MODAL)}>
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
