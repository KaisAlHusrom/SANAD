import type { Notification } from '@sanad/contracts';
import { MailCheck, UserPlus, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/cn';
import { useFormatDateTime } from '../../../lib/format';

/** Icon per notification type — keeps the leaf presentational (no `unknown` into JSX, U4). */
const ICON_BY_TYPE: Record<Notification['type'], LucideIcon> = {
  'lead.created': UserPlus,
  'lead.received.ack': MailCheck,
};

/**
 * i18n key per type. The dotted `NotificationType` literals can't be used as keys directly
 * (i18next would treat the dots as nesting), so they map to flat catalog keys.
 */
const LABEL_KEY_BY_TYPE: Record<Notification['type'], string> = {
  'lead.created': 'item.leadCreated',
  'lead.received.ack': 'item.leadAck',
};

interface NotificationItemProps {
  notification: Notification;
  /** When provided, the row is a button that marks the notice read on click (the bell).
   * When omitted, it renders display-only (the dashboard recent-activity list). */
  onMarkRead?: (id: string) => void;
}

/**
 * One notification row: a tinted type icon, the localized summary (lead name interpolated),
 * the formatted time (F8), and an unread dot. Interactive in the bell (marks read on click),
 * display-only on the dashboard. Tokens-only (U6), logical properties (U7).
 */
export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const { t } = useTranslation('notifications');
  const formatDate = useFormatDateTime();
  const Icon = ICON_BY_TYPE[notification.type];
  const isUnread = notification.readAt === null;

  const body = (
    <>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-card bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-accent">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm text-text">
          {t(LABEL_KEY_BY_TYPE[notification.type], {
            name: notification.payload.name,
          })}
        </span>
        <span className="font-mono text-xs text-faint">
          {formatDate(notification.createdAt)}
        </span>
      </span>
      {isUnread ? (
        <span
          className="mt-1 size-2 shrink-0 rounded-pill bg-accent"
          aria-label={t('unread')}
        />
      ) : null}
    </>
  );

  const className = cn(
    'flex w-full items-start gap-3 rounded-nav px-3 py-2.5 text-start',
    onMarkRead ? 'transition-colors hover:bg-surface-2' : '',
  );

  if (!onMarkRead) {
    return <div className={className}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onMarkRead(notification.id)}
      className={className}
    >
      {body}
    </button>
  );
}
