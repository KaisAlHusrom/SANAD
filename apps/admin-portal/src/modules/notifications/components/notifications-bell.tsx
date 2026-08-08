import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRequirePermission } from '../../../app/guards/use-require-permission';
import { Button } from '../../../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { useNotifications } from '../hooks/use-notifications';
import { UNREAD_BADGE_MAX } from '../notifications.constants';
import { NotificationItem } from './notification-item';

/**
 * The topbar notifications bell (W1 — chrome owned by the shell). Self-gates on
 * `notification.read` (renders nothing without it, like the media picker). Shows an unread
 * count overlay and a popover of recent notices; clicking a notice marks it read. Tokens-only
 * (U6), RTL-safe (U7 logical `-end`).
 */
export function NotificationsBell() {
  const { t } = useTranslation('notifications');
  const { t: tc } = useTranslation('common');
  const canRead = useRequirePermission('notification.read');
  const { items, unreadCount, isLoading, isError, markRead } =
    useNotifications();

  if (!canRead) {
    return null;
  }

  const badgeLabel =
    unreadCount > UNREAD_BADGE_MAX
      ? `${UNREAD_BADGE_MAX}+`
      : String(unreadCount);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('label')}
        >
          <Bell className="size-4" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span
              className="absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-pill bg-accent px-1 text-xs font-semibold leading-none text-accent-ink"
              aria-label={t('unreadCount', { count: unreadCount })}
            >
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-text">{t('title')}</span>
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          {isLoading ? (
            <p className="px-3 py-8 text-center text-sm text-dim">
              {tc('states.loading')}
            </p>
          ) : isError ? (
            <p className="px-3 py-8 text-center text-sm text-dim">
              {tc('states.error')}
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-dim">
              {t('empty')}
            </p>
          ) : (
            items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markRead}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
