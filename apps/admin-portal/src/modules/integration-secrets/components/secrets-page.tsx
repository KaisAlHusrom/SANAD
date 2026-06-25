import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import { useSecretsList } from '../hooks/use-secrets-list';
import { SecretsTable } from './secrets-table';

/** The integration-secrets admin page (presentational — data in `useSecretsList`, U5). */
export function SecretsPage() {
  const { t } = useTranslation('integrationSecrets');
  const { rows, isLoading, isError } = useSecretsList();

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
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        }
        error={<ErrorState message={t('errors.loadFailed')} />}
      >
        <SecretsTable rows={rows} />
      </RenderGate>
    </section>
  );
}
