import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../../components/feedback/empty-state';
import { ErrorState } from '../../../../components/feedback/error-state';
import { RenderGate } from '../../../../components/feedback/render-gate';
import { Skeleton } from '../../../../components/feedback/skeleton';
import { Button } from '../../../../components/ui/button';
import { Callout } from '../../../../components/ui/callout';
import { useTrackingSettings } from '../../hooks/use-tracking-settings';
import { ConsentPolicyCard } from '../consent-policy-card';
import { DestinationCard } from '../destination-card';

/**
 * Tracking & consent (P8.23.A1) — the one place the consent policy and every ad destination
 * are configured. Purpose-built rather than a row of key/value controls (U0): a destination's
 * real question is "is this actually working?", and only a status chip, a format hint and the
 * double-count/GTM caveats answer it.
 *
 * Presentation only (U5) — everything lives in `useTrackingSettings`.
 */
export function TrackingPage() {
  const { t } = useTranslation('settings');
  const tracking = useTrackingSettings();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">
          {t('tracking.title')}
        </h1>
        <p className="text-sm text-dim">{t('tracking.subtitle')}</p>
      </header>

      <RenderGate
        isLoading={tracking.isLoading}
        isError={tracking.isError}
        isEmpty={tracking.isUnavailable}
        skeleton={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
        error={
          <ErrorState
            message={t('errors.loadFailed')}
            onRetry={tracking.refetch}
            retryLabel={t('tracking.actions.retry')}
          />
        }
        empty={
          <EmptyState
            title={t('tracking.unavailable.title')}
            description={t('tracking.unavailable.description')}
          />
        }
      >
        <form
          onSubmit={tracking.onSubmit}
          noValidate
          className="flex flex-col gap-6"
        >
          <ConsentPolicyCard
            fields={tracking.consentFields}
            form={tracking.form}
            policyVersion={tracking.policyVersion}
            siteUrl={tracking.siteUrl}
            isDirty={tracking.isDirty}
            disabled={tracking.isSubmitting}
            onReask={() => void tracking.bumpPolicyVersion()}
          />

          <section className="flex flex-col gap-4 rounded-md border border-border bg-surface p-6 shadow-portal">
            <header className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-text">
                {t('tracking.destinations.title')}
              </h2>
              <p className="text-sm text-dim">
                {t('tracking.destinations.subtitle')}
              </p>
            </header>

            {tracking.doubleCounting ? (
              <Callout
                tone="warn"
                icon={<AlertTriangle className="size-4" aria-hidden="true" />}
              >
                {t('tracking.warnings.doubleCounting')}
              </Callout>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              {tracking.destinations.map((view) => (
                <DestinationCard
                  key={view.id}
                  view={view}
                  form={tracking.form}
                  disabled={tracking.isSubmitting}
                />
              ))}
            </div>
          </section>

          {tracking.form.formState.errors.root ? (
            <p role="alert" className="text-sm text-bad">
              {tracking.form.formState.errors.root.message}
            </p>
          ) : null}

          {/* One save for the whole page: an operator adding a destination usually touches the
              switch, the id and sometimes the policy in the same sitting. */}
          <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-veil-surface px-6 py-4 backdrop-blur">
            {tracking.isDirty ? (
              <span className="me-auto text-xs text-warn">
                {t('tracking.actions.unsaved')}
              </span>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={tracking.onReset}
              disabled={!tracking.isDirty || tracking.isSubmitting}
            >
              {t('actions.reset')}
            </Button>
            <Button
              type="submit"
              loading={tracking.isSubmitting}
              disabled={!tracking.isDirty}
            >
              {t('actions.save')}
            </Button>
          </div>
        </form>
      </RenderGate>
    </section>
  );
}
