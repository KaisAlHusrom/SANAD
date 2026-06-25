import { hasPermission } from '@sanad/contracts';
import { selectPermissions } from '../../data/auth/auth.slice';
import { useAppSelector } from '../../data/store/hooks';

/** True when the caller's resolved permissions satisfy the required key (RBAC). */
export function useRequirePermission(permission: string): boolean {
  const permissions = useAppSelector(selectPermissions);
  return hasPermission(permissions, permission);
}
