import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/ui/input';
import type { BrandingFormValues } from '../validation/branding-form.zod.types';
import { BrandingField } from './branding-field';

const SOCIAL_FIELDS = [
  'twitter',
  'linkedin',
  'instagram',
  'github',
  'youtube',
] as const;

/** Social profile URLs (each nullable — empty clears it). */
export function BrandingSocialSection() {
  const { t } = useTranslation('settings');
  const { register, formState } = useFormContext<BrandingFormValues>();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">
        {t('sections.social')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_FIELDS.map((key) => (
          <BrandingField
            key={key}
            label={t(`fields.${key}`)}
            error={
              formState.errors.social?.[key]
                ? t(formState.errors.social[key]?.message ?? 'errors.url')
                : undefined
            }
          >
            <Input
              {...register(`social.${key}`)}
              placeholder={t('fields.urlPlaceholder')}
            />
          </BrandingField>
        ))}
      </div>
    </section>
  );
}
