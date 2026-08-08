import type { AuthUser } from '@sanad/contracts';
import { Pencil, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import {
  DataTable,
  type DataTableColumn,
  type RowAction,
} from '../../../components/data-table';
import { Avatar } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useModalActions } from '../../../data/modal/use-modal';
import { useUsersList } from '../hooks/use-users-list';
import { USER_FORM_MODAL } from './user-form-modal';
import { USER_ROLES_MODAL } from './user-roles-modal';
import { UserStatusCell } from './user-status-cell';

/** The users & roles page: a kit DataTable + create/edit modal + role-assignment modal (W1). */
export function UsersPage() {
  const { t } = useTranslation('users');
  const canManage = useRequirePermission('identity.users.manage');
  const { open } = useModalActions();
  const { list, rows, total, isLoading, isError } = useUsersList();

  const columns: DataTableColumn<AuthUser>[] = [
    {
      id: 'member',
      header: t('columns.member'),
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-text">{row.name}</span>
            <span className="truncate text-xs text-faint" dir="ltr">
              {row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'roles',
      header: t('columns.roles'),
      cell: (row) =>
        row.roles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {row.roles.map((role) => (
              <Badge key={role} tone="accent">
                {t(`roles.${role}`)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-dim">{t('noRoles')}</span>
        ),
    },
    {
      id: 'status',
      header: t('columns.status'),
      cell: (row) => <UserStatusCell user={row} canManage={canManage} />,
    },
  ];

  const rowActions: RowAction<AuthUser>[] = [
    {
      key: 'edit',
      label: t('actions.edit'),
      icon: <Pencil className="size-4" aria-hidden="true" />,
      permission: 'identity.users.manage',
      onSelect: (row) => open(USER_FORM_MODAL, { user: row }),
    },
    {
      key: 'roles',
      label: t('actions.manageRoles'),
      icon: <ShieldCheck className="size-4" aria-hidden="true" />,
      permission: 'identity.users.manage',
      onSelect: (row) => open(USER_ROLES_MODAL, { user: row }),
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
          <Button onClick={() => open(USER_FORM_MODAL)}>
            {t('actions.invite')}
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
      />
    </section>
  );
}
