import * as Label from '@radix-ui/react-label';
import {
  CONSENT_SETTING_KEYS,
  POLICY_PATH_PATTERN,
  type SettingField,
} from '@sanad/contracts';
import { AlertTriangle, Info } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../../components/ui/button';
import { Callout } from '../../../../components/ui/callout';
import { Input } from '../../../../components/ui/input';
import { Switch } from '../../../../components/ui/switch';
import { fieldId, type SectionFormValues } from '../../lib/setting-form';
import { policyLinkPreview } from '../../lib/tracking-view';

interface ConsentPolicyCardProps {
  fields: readonly SettingField[];
  form: UseFormReturn<SectionFormValues>;
  policyVersion: number;
  siteUrl: string | null;
  isDirty: boolean;
  disabled: boolean;
  onReask: () => void;
}

const POLICY_LINK_KEYS = [
  CONSENT_SETTING_KEYS.privacyPolicyPath,
  CONSENT_SETTING_KEYS.cookiePolicyPath,
] as const;

/**
 * The consent policy the website's banner obeys: whether to ask, how long to remember, what to
 * link to, and the version that re-asks everyone.
 *
 * The version bump is an **action**, not a number field — it re-asks every visitor on the next
 * page view, which is not something an operator should be able to do by nudging a spinner.
 */
export function ConsentPolicyCard({
  fields,
  form,
  policyVersion,
  siteUrl,
  isDirty,
  disabled,
  onReask,
}: ConsentPolicyCardProps) {
  const { t, i18n } = useTranslation('settings');
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const rememberDays = byKey.get(CONSENT_SETTING_KEYS.rememberDays);
  const values = form.watch();

  const bannerId = fieldId(CONSENT_SETTING_KEYS.bannerEnabled);
  const bannerOn = values[bannerId] === true;

  return (
    <section className="flex flex-col gap-5 rounded-md border border-border bg-surface p-6 shadow-portal">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-text">
          {t('tracking.consent.title')}
        </h2>
        <p className="text-sm text-dim">{t('tracking.consent.subtitle')}</p>
      </header>

      <div className="flex items-start gap-3">
        <Controller
          control={form.control}
          name={bannerId}
          render={({ field }) => (
            <Switch
              id={bannerId}
              checked={field.value === true}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-label={t('tracking.consent.bannerEnabled')}
            />
          )}
        />
        <div className="flex flex-col gap-1">
          <Label.Root htmlFor={bannerId} className="text-sm text-text">
            {t('tracking.consent.bannerEnabled')}
          </Label.Root>
          <p className="text-xs text-dim">
            {t('tracking.consent.bannerEnabledHelp')}
          </p>
        </div>
      </div>

      {/* Switching the banner off does NOT mean "track everyone quietly" — with nothing asked,
          nothing is granted, so no destination loads. Say it, or an operator will read the
          switch as the opposite of what it does. */}
      {!bannerOn ? (
        <Callout
          tone="warn"
          icon={<AlertTriangle className="size-4" aria-hidden="true" />}
        >
          {t('tracking.consent.bannerOffWarning')}
        </Callout>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label.Root
            htmlFor={fieldId(CONSENT_SETTING_KEYS.rememberDays)}
            className="text-sm text-dim"
          >
            {t('tracking.consent.rememberDays')}
          </Label.Root>
          <Input
            id={fieldId(CONSENT_SETTING_KEYS.rememberDays)}
            type="number"
            dir="ltr"
            disabled={disabled}
            min={rememberDays?.min}
            max={rememberDays?.max}
            {...form.register(fieldId(CONSENT_SETTING_KEYS.rememberDays), {
              valueAsNumber: true,
            })}
          />
          <p className="text-xs text-faint">
            {t('tracking.consent.rememberDaysHelp', {
              min: rememberDays?.min ?? 1,
              max: rememberDays?.max ?? 730,
            })}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-1.5 rounded-card border border-border bg-surface-2 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-dim">
              {t('tracking.consent.policyVersion')}
            </span>
            <span dir="ltr" className="font-mono text-lg text-text">
              {policyVersion}
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onReask}
            disabled={disabled || isDirty}
          >
            {t('tracking.consent.reask.action')}
          </Button>
          <p className="text-xs text-faint">
            {isDirty
              ? t('tracking.consent.reask.saveFirst')
              : t('tracking.consent.reask.help')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {POLICY_LINK_KEYS.map((key) => {
          const id = fieldId(key);
          const raw = values[id];
          const path = typeof raw === 'string' ? raw : '';
          const preview = policyLinkPreview(siteUrl, path, locale);
          const error = form.formState.errors[id];
          const message =
            typeof error?.message === 'string' ? error.message : null;
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <Label.Root htmlFor={id} className="text-sm text-dim">
                {t(`tracking.consent.link.${key}`)}
              </Label.Root>
              <Input
                id={id}
                dir="ltr"
                spellCheck={false}
                disabled={disabled}
                placeholder={t(`tracking.consent.linkPlaceholder.${key}`)}
                aria-invalid={message !== null}
                {...form.register(id, {
                  validate: (value) => {
                    const text = typeof value === 'string' ? value.trim() : '';
                    if (text === '') return true;
                    return (
                      new RegExp(POLICY_PATH_PATTERN).test(text) ||
                      t('tracking.consent.link.invalid')
                    );
                  },
                })}
              />
              {message ? (
                <p role="alert" className="text-xs text-bad">
                  {message}
                </p>
              ) : preview ? (
                <p className="truncate text-xs text-faint">
                  {t('tracking.consent.link.opensAt')}{' '}
                  <span dir="ltr">{preview}</span>
                </p>
              ) : (
                <p className="text-xs text-warn">
                  {t('tracking.consent.link.unset')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Callout
        tone="neutral"
        icon={<Info className="size-4" aria-hidden="true" />}
      >
        {t('tracking.consent.categoriesNote')}
      </Callout>
    </section>
  );
}
