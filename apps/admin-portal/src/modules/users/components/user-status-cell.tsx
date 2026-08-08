import type { AuthUser } from '@sanad/contracts';
import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { useToggleUserActive } from '../hooks/use-toggle-user-active';

interface UserStatusCellProps {
  user: AuthUser;
  canManage: boolean;
}

/**
 * The inline active-state control (W6): managers get a Switch wired to the update mutation;
 * read-only users see a tinted Badge.
 */
export function UserStatusCell({ user, canManage }: UserStatusCellProps) {
  const { t } = useTranslation('users');
  const toggleActive = useToggleUserActive();
  const label = t(user.isActive ? 'status.active' : 'status.inactive');

  if (!canManage) {
    return (
      <Badge tone={user.isActive ? 'good' : 'neutral'} dot>
        {label}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={user.isActive}
        onCheckedChange={(next) => void toggleActive(user.id, next)}
        aria-label={t('toggleActive')}
      />
      <span className="text-sm text-dim">{label}</span>
    </div>
  );
}
