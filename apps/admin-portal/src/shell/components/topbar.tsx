import { Bell, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { useDirection } from '../../providers/direction';
import { useTheme } from '../../providers/theme';
import { ADMIN_NAV } from '../constants/nav';

/** Topbar: screen title (start) → locale switch, theme toggle, notifications bell. */
export function Topbar() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { locale, setLocale } = useDirection();

  const active = ADMIN_NAV.find((item) => item.to === location.pathname);
  const title = active ? t(active.labelKey) : t('app.adminPortal');

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-bg px-6">
      <h1 className="text-sm font-medium text-text">{title}</h1>
      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
        aria-label={t('locale.switch')}
      >
        <span className="font-mono text-xs">
          {locale === 'ar' ? 'EN' : 'ع'}
        </span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={t('theme.toggle')}
      >
        {theme === 'dark' ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={t('notifications.label')}
        disabled
      >
        <Bell className="size-4" />
      </Button>
    </header>
  );
}
