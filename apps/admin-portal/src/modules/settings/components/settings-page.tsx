import { TRACKING_GROUP } from '@sanad/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/feedback/empty-state';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs';
import { cn } from '../../../lib/cn';
import { useGetSettingsQuery } from '../api/settings.api';
import { SettingSectionForm } from './setting-section-form';

/**
 * The descriptor-driven settings page (W1): a **group rail** (sidebar tabs) + the active
 * group's **section sub-tabs**, each rendering its typed fields from the catalog. Fully
 * generic — groups/sections/fields come from `GET /api/settings`, so new groups appear with
 * no UI change. Tokens-only, RTL, F2 gates.
 */
export function SettingsPage() {
  const { t } = useTranslation('settings');
  const { data, isLoading, isError } = useGetSettingsQuery();
  // `tracking` is deliberately NOT a tab here: it has its own purpose-built page at
  // /settings/tracking (U0), and rendering it generically too would put two differently-shaped
  // editors on the same keys — the operator would have no way to know which one is the real one.
  const groups = (data?.groups ?? []).filter(
    (group) => group.group !== TRACKING_GROUP,
  );
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const current =
    groups.find((group) => group.group === activeGroup) ?? groups[0];

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-dim">{t('subtitle')}</p>
      </header>

      <RenderGate
        isLoading={isLoading}
        isError={isError}
        isEmpty={groups.length === 0}
        skeleton={<Skeleton className="h-96 w-full" />}
        error={<ErrorState message={t('errors.loadFailed')} />}
        empty={<EmptyState title={t('errors.loadFailed')} />}
      >
        {current ? (
          <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
            <nav className="flex flex-col gap-1" aria-label={t('title')}>
              {groups.map((group) => {
                const active = group.group === current.group;
                return (
                  <button
                    key={group.group}
                    type="button"
                    onClick={() => setActiveGroup(group.group)}
                    className={cn(
                      'rounded-nav px-3 py-2 text-start text-sm transition-colors',
                      active
                        ? 'border-e-2 border-accent bg-accent-soft text-accent'
                        : 'text-dim hover:bg-surface-2 hover:text-text',
                    )}
                  >
                    {t(`group.${group.group}`)}
                  </button>
                );
              })}
            </nav>

            <Tabs
              key={current.group}
              defaultValue={current.sections[0]?.section}
            >
              <TabsList className="flex-wrap">
                {current.sections.map((section) => (
                  <TabsTrigger key={section.section} value={section.section}>
                    {t(`section.${current.group}.${section.section}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {current.sections.map((section) => (
                <TabsContent key={section.section} value={section.section}>
                  <SettingSectionForm section={section} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : null}
      </RenderGate>
    </section>
  );
}
