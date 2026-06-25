import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/ui/input';
import type { BrandingFormValues } from '../validation/branding-form.zod.types';
import { BrandingField } from './branding-field';

/** The brand font families (sans + mono). */
export function BrandingTypographySection() {
  const { t } = useTranslation('settings');
  const { register, formState } = useFormContext<BrandingFormValues>();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">
        {t('sections.typography')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <BrandingField
          label={t('fields.fontSans')}
          error={
            formState.errors.fonts?.sans
              ? t(formState.errors.fonts.sans.message ?? 'errors.required')
              : undefined
          }
        >
          <Input {...register('fonts.sans')} />
        </BrandingField>
        <BrandingField
          label={t('fields.fontMono')}
          error={
            formState.errors.fonts?.mono
              ? t(formState.errors.fonts.mono.message ?? 'errors.required')
              : undefined
          }
        >
          <Input {...register('fonts.mono')} />
        </BrandingField>
      </div>
    </section>
  );
}
