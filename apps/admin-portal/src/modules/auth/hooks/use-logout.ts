import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectRefreshToken } from '../../../data/auth/auth.slice';
import { useAppSelector } from '../../../data/store/hooks';
import { useLogoutMutation } from '../api/auth.api';

interface UseLogoutResult {
  onLogout: () => Promise<void>;
  isLoggingOut: boolean;
}

/** Revoke the refresh token server-side, clear the local session, return to login. */
export function useLogout(): UseLogoutResult {
  const navigate = useNavigate();
  const refresh = useAppSelector(selectRefreshToken);
  const [logout, { isLoading }] = useLogoutMutation();

  const onLogout = useCallback(async () => {
    if (refresh) {
      try {
        await logout({ refresh }).unwrap();
      } catch {
        // The mutation clears the local session in onQueryStarted regardless.
      }
    }
    navigate('/login', { replace: true });
  }, [logout, navigate, refresh]);

  return { onLogout, isLoggingOut: isLoading };
}
