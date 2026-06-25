import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/ui/input';
import { LocaleTabs } from '../../../components/ui/locale-tabs';
import type { BrandingFormValues } from '../validation/branding-form.zod.types';
import { BrandingField } from './branding-field';

/** Contact email/phone + the per-locale address (W6 — nullable, empty clears it). */
export function BrandingContactSection() {
  const { t } = useTranslation('settings');
  const { register, formState } = useFormContext<BrandingFormValues>();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">
        {t('sections.contact')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <BrandingField
          label={t('fields.email')}
          error={
            formState.errors.contact?.email
              ? t(formState.errors.contact.email.message ?? 'errors.email')
              : undefined
          }
        >
          <Input type="email" {...register('contact.email')} />
        </BrandingField>
        <BrandingField label={t('fields.phone')}>
          <Input {...register('contact.phone')} />
        </BrandingField>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-dim">{t('fields.address')}</span>
        <LocaleTabs>
          {(locale) => <Input {...register(`contact.address.${locale}`)} />}
        </LocaleTabs>
      </div>
    </section>
  );
}
