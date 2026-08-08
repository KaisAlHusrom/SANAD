import type { AuthUser, Role } from '@sanad/contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import {
  useAssignUserRoleMutation,
  useRevokeUserRoleMutation,
} from '../api/users.api';

interface UseUserRolesResult {
  roles: ReadonlySet<string>;
  isPending: boolean;
  toggle: (role: Role) => Promise<void>;
}

/**
 * Role-assignment logic for the roles modal (U5): tracks the user's roles locally (seeded
 * from the row, re-seeded when a different user opens) and assigns/revokes on toggle,
 * reconciling from the mutation's returned `AuthUser`. Toasts the outcome.
 */
export function useUserRoles(user: AuthUser): UseUserRolesResult {
  const { t } = useTranslation('users');
  const [roles, setRoles] = useState<Set<string>>(() => new Set(user.roles));
  const [assignRole, assignState] = useAssignUserRoleMutation();
  const [revokeRole, revokeState] = useRevokeUserRoleMutation();

  useEffect(() => {
    setRoles(new Set(user.roles));
  }, [user]);

  const toggle = async (role: Role): Promise<void> => {
    const has = roles.has(role);
    try {
      const updated = has
        ? await revokeRole({ id: user.id, role }).unwrap()
        : await assignRole({ id: user.id, role }).unwrap();
      setRoles(new Set(updated.roles));
      toast.success(has ? t('toast.roleRevoked') : t('toast.roleAssigned'));
    } catch {
      toast.error(t('toast.roleError'));
    }
  };

  return {
    roles,
    isPending: assignState.isLoading || revokeState.isLoading,
    toggle,
  };
}
