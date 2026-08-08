import {
  Bell,
  BookOpen,
  Inbox,
  Layers,
  Mail,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState, RenderGate, Skeleton } from '../../../components/feedback';
import { NotificationItem } from '../../notifications';
import { useDashboard } from '../hooks/use-dashboard';
import { RecentLeadRow } from './recent-lead-row';
import { StatCard } from './stat-card';

interface CardSpec {
  key: string;
  value: number;
  icon: LucideIcon;
}

/** A bordered surface panel grouping a titled list (recent leads / recent activity). */
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-surface shadow-portal">
      <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-text">
        {title}
      </h2>
      <div className="flex flex-col p-1">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="px-3 py-8 text-center text-sm text-dim">{text}</p>;
}

/** The admin dashboard home (`/`): headline counts + recent leads + recent activity (W1). */
export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { stats, isLoading, isError } = useDashboard();
  const counts = stats?.counts;

  const cards: CardSpec[] = [
    { key: 'newLeads', value: counts?.leadsNew ?? 0, icon: Inbox },
    { key: 'totalLeads', value: counts?.leadsTotal ?? 0, icon: Mail },
    { key: 'users', value: counts?.users ?? 0, icon: Users },
    { key: 'services', value: counts?.services ?? 0, icon: Layers },
    { key: 'blogPosts', value: counts?.blogPosts ?? 0, icon: BookOpen },
    { key: 'unread', value: counts?.unreadNotifications ?? 0, icon: Bell },
  ];

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-dim">{t('subtitle')}</p>
      </header>

      <RenderGate
        isLoading={isLoading}
        isError={isError}
        skeleton={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: cards.length }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-md" />
            ))}
          </div>
        }
        error={<ErrorState message={t('error')} />}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <StatCard
              key={card.key}
              label={t(`cards.${card.key}`)}
              value={card.value}
              icon={card.icon}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title={t('recentLeads')}>
            {stats && stats.recentLeads.length > 0 ? (
              stats.recentLeads.map((lead) => (
                <RecentLeadRow key={lead.id} lead={lead} />
              ))
            ) : (
              <EmptyHint text={t('noLeads')} />
            )}
          </Panel>

          <Panel title={t('recentActivity')}>
            {stats && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))
            ) : (
              <EmptyHint text={t('noActivity')} />
            )}
          </Panel>
        </div>
      </RenderGate>
    </section>
  );
}
