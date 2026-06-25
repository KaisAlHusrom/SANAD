import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../components/feedback/error-state';
import { useRequirePermission } from './use-require-permission';

interface RequirePermissionProps {
  permission: string;
  children: ReactNode;
}

/** Render children only if the caller holds the permission; else a forbidden notice. */
export function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const { t } = useTranslation('common');
  const allowed = useRequirePermission(permission);

  if (!allowed) {
    return <ErrorState message={t('errors.forbidden')} />;
  }

  return <>{children}</>;
}
