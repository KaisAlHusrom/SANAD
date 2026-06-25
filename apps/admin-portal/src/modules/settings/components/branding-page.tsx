import { useTranslation } from 'react-i18next';
import { ErrorState } from '../../../components/feedback/error-state';
import { RenderGate } from '../../../components/feedback/render-gate';
import { Skeleton } from '../../../components/feedback/skeleton';
import { useGetBrandingQuery } from '../api/settings.api';
import { BrandingForm } from './branding-form';

/** The branding editor page (presentational — data via `useGetBrandingQuery`, U5). */
export function BrandingPage() {
  const { t } = useTranslation('settings');
  const { data, isLoading, isError } = useGetBrandingQuery();

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
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        }
        error={<ErrorState message={t('errors.loadFailed')} />}
      >
        {data ? <BrandingForm record={data} /> : null}
      </RenderGate>
    </section>
  );
}
