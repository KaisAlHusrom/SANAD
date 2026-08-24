import * as Label from '@radix-ui/react-label';
import { AlertTriangle } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { formatList } from '../../../../lib/format';
import { Badge, type BadgeProps } from '../../../../components/ui/badge';
import { Callout } from '../../../../components/ui/callout';
import { Input } from '../../../../components/ui/input';
import { Switch } from '../../../../components/ui/switch';
import type { SectionFormValues } from '../../lib/setting-form';
import type {
  DestinationStatus,
  DestinationView,
} from '../../lib/tracking-view';

const STATUS_TONE: Record<DestinationStatus, BadgeProps['tone']> = {
  off: 'neutral',
  notConfigured: 'warn',
  invalid: 'bad',
  live: 'good',
};

interface DestinationCardProps {
  view: DestinationView;
  form: UseFormReturn<SectionFormValues>;
  disabled: boolean;
}

/**
 * One ad/analytics destination: what it is, which consent category gates it, whether it is
 * actually working, and the id it sends to. The status chip is the point — "switched on with
 * nothing to send" and "switched on with the wrong id" both look exactly like "working" on a
 * plain toggle, and both cost real money for months before anyone notices (U0/U23).
 */
export function DestinationCard({
  view,
  form,
  disabled,
}: DestinationCardProps) {
  const { t, i18n } = useTranslation('settings');
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const name = t(`tracking.destination.${view.id}.name`);
  const inputId = `destination-${view.id}`;
  const hintId = `${inputId}-hint`;
  const error = form.formState.errors[view.idField];
  const errorMessage =
    typeof error?.message === 'string' ? error.message : null;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-text">{name}</h3>
            <Badge tone="accent">
              {t(`tracking.category.${view.category}`)}
            </Badge>
            <Badge tone={STATUS_TONE[view.status]} dot>
              {t(`tracking.status.${view.status}`)}
            </Badge>
          </div>
          <p className="text-xs text-dim">
            {t(`tracking.destination.${view.id}.help`)}
          </p>
        </div>
        <Controller
          control={form.control}
          name={view.enabledField}
          render={({ field }) => (
            <Switch
              checked={field.value === true}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-label={t('tracking.fields.enable', { name })}
            />
          )}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label.Root htmlFor={inputId} className="text-sm text-dim">
          {t('tracking.fields.measurementId')}
        </Label.Root>
        {/* A vendor id is LTR in both locales — without this the Arabic page reverses the
            visual order of an id the operator is trying to compare against their dashboard. */}
        <Input
          id={inputId}
          dir="ltr"
          spellCheck={false}
          autoComplete="off"
          disabled={disabled}
          // No placeholder: the hint below says the same thing and, unlike a placeholder,
          // survives typing — which is exactly when the shape is worth reading. Showing both
          // put the identical string on screen twice.
          aria-invalid={errorMessage !== null}
          aria-describedby={hintId}
          {...form.register(view.idField, {
            validate: (value) => {
              const text = typeof value === 'string' ? value.trim() : '';
              if (text === '') return true; // clearing is how a destination is removed (U9)
              return (
                new RegExp(view.pattern).test(text) ||
                t('tracking.errors.invalidId', { example: view.example })
              );
            },
          })}
        />
        <p id={hintId} className="text-xs text-faint">
          {t('tracking.fields.idHint')}{' '}
          <span dir="ltr" className="font-mono">
            {view.example}
          </span>
        </p>
        {errorMessage ? (
          <p role="alert" className="text-xs text-bad">
            {errorMessage}
          </p>
        ) : null}
        {view.alsoLooksLike.length > 0 ? (
          <p className="text-xs text-warn">
            {t('tracking.warnings.ambiguousId', {
              // A separator is a user-facing string: `join('، ')` put the Arabic comma into
              // the English page (F8).
              others: formatList(
                view.alsoLooksLike.map((id) =>
                  t(`tracking.destination.${id}.name`),
                ),
                locale,
              ),
            })}
          </p>
        ) : null}
      </div>

      {/* Tags configured INSIDE a GTM container are loaded by GTM, not by us — this platform
          can only set Consent Mode and trust the container to honour it. Saying so is the
          difference between an operator who configures GTM correctly and one who believes the
          gate covers something it cannot reach. */}
      {view.id === 'gtm' && view.enabled ? (
        <Callout
          tone="warn"
          className="text-xs"
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
        >
          {t('tracking.warnings.gtmOutsideGate')}
        </Callout>
      ) : null}
    </div>
  );
}
