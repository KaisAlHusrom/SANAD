import {
  selectIdentity,
  selectIsAuthenticated,
} from '../../data/auth/auth.slice';
import { useAppSelector } from '../../data/store/hooks';
import { useMeQuery } from '../../modules/auth/api/auth.api';

interface UseRequireAuthResult {
  isAuthenticated: boolean;
}

/**
 * Auth-guard logic (U5): reports whether the caller is authenticated and lazily loads
 * the identity (roles + permissions) from `/auth/me` when authenticated but unloaded.
 */
export function useRequireAuth(): UseRequireAuthResult {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const identity = useAppSelector(selectIdentity);

  useMeQuery(undefined, { skip: !isAuthenticated || identity !== null });

  return { isAuthenticated };
}
