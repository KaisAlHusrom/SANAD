import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MediaPickerField } from '../../../components/media-picker';
import { Input } from '../../../components/ui/input';
import { LocaleTabs } from '../../../components/ui/locale-tabs';
import type { BrandingFormValues } from '../validation/branding-form.zod.types';
import { BrandingField } from './branding-field';

/** Logo/favicon + brand name/tagline/short-desc (per-locale, W6). */
export function BrandingIdentitySection() {
  const { t } = useTranslation('settings');
  const { control, register, formState } = useFormContext<BrandingFormValues>();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">
        {t('sections.identity')}
      </h2>

      <BrandingField
        label={t('fields.logoUrl')}
        error={
          formState.errors.logoUrl
            ? t(formState.errors.logoUrl.message ?? 'errors.url')
            : undefined
        }
      >
        <Controller
          control={control}
          name="logoUrl"
          render={({ field }) => (
            <MediaPickerField
              value={field.value}
              onChange={field.onChange}
              placeholder={t('fields.urlPlaceholder')}
            />
          )}
        />
      </BrandingField>

      <BrandingField
        label={t('fields.faviconUrl')}
        error={
          formState.errors.faviconUrl
            ? t(formState.errors.faviconUrl.message ?? 'errors.url')
            : undefined
        }
      >
        <Controller
          control={control}
          name="faviconUrl"
          render={({ field }) => (
            <MediaPickerField
              value={field.value}
              onChange={field.onChange}
              placeholder={t('fields.urlPlaceholder')}
            />
          )}
        />
      </BrandingField>

      <LocaleTabs>
        {(locale) => (
          <div className="flex flex-col gap-4">
            <BrandingField label={t('fields.brandName')}>
              <Input {...register(`brand.name.${locale}`)} />
            </BrandingField>
            <BrandingField label={t('fields.tagline')}>
              <Input {...register(`brand.tagline.${locale}`)} />
            </BrandingField>
            <BrandingField label={t('fields.shortDesc')}>
              <Input {...register(`brand.shortDesc.${locale}`)} />
            </BrandingField>
          </div>
        )}
      </LocaleTabs>
    </section>
  );
}
