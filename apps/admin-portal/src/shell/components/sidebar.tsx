import { hasPermission, pickLocalized } from '@sanad/contracts';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { SidebarNavButton } from '../../components/nav/sidebar-nav-button';
import { useGetBrandingQuery } from '../../data/branding/branding.api';
import { selectIdentity, selectPermissions } from '../../data/auth/auth.slice';
import { useAppSelector } from '../../data/store/hooks';
import { useDirection } from '../../providers/direction';
import { useTheme } from '../../providers/theme';
import { useLogout } from '../../modules/auth/hooks/use-logout';
import { ADMIN_NAV, bundledLogoSrc } from '../constants';

/** Sidebar: brand → permission-gated nav → user card + logout (design-spec §4). */
export function Sidebar() {
  const { t } = useTranslation('common');
  const permissions = useAppSelector(selectPermissions);
  const identity = useAppSelector(selectIdentity);
  const { theme } = useTheme();
  const { locale } = useDirection();
  const { data: branding } = useGetBrandingQuery();
  const { onLogout } = useLogout();

  // The brand logo + name come from the owner's visual-identity settings; fall back to the
  // bundled asset + i18n name when unset (F7).
  const brandName = branding?.brand?.name
    ? pickLocalized(branding.brand.name, locale)
    : t('app.name');
  const logoSrc = branding?.logoUrl ?? bundledLogoSrc(theme);

  const items = ADMIN_NAV.filter(
    (item) => !item.permission || hasPermission(permissions, item.permission),
  );

  return (
    <aside className="sticky top-0 flex h-dvh flex-col gap-6 border-e border-border bg-sidebar p-4">
      <div className="flex items-center px-2">
        <img src={logoSrc} alt={brandName} className="h-8 w-auto" />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <SidebarNavButton
            key={item.to}
            to={item.to}
            label={t(item.labelKey)}
            icon={<item.icon className="size-4" />}
          />
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Avatar name={identity?.email ?? '?'} />
        <span className="min-w-0 flex-1 truncate text-sm text-dim">
          {identity?.email ?? ''}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          aria-label={t('actions.logout')}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
