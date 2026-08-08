import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import { useIntegrationsList } from '../hooks/use-integrations-list';
import { CapabilityCard } from './capability-card';

/**
 * The integrations admin page (presentational — data in `useIntegrationsList`, U5): one card per
 * CAPABILITY (storage, email…), each listing the providers that implement it with exactly one
 * active. Replaces the flat "one row per credential key" table.
 */
export function IntegrationsPage() {
  const { t } = useTranslation('integrations');
  const { cards, isLoading, isError, activate, isActivating } =
    useIntegrationsList();

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
          <div className="flex flex-col gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
        error={<ErrorState message={t('errors.loadFailed')} />}
      >
        <div className="flex flex-col gap-4">
          {cards.map((card) => (
            <CapabilityCard
              key={card.capability}
              card={card}
              isActivating={isActivating}
              onActivate={(provider) =>
                void activate(card.capability, provider.provider)
              }
            />
          ))}
        </div>
      </RenderGate>
    </section>
  );
}
