import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useRequireAuth } from './use-require-auth';

/** Gate protected routes — redirects to /login (remembering the target) when out. */
export function RequireAuth() {
  const { isAuthenticated } = useRequireAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname } }}
      />
    );
  }

  return <Outlet />;
}
