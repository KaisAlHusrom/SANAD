import type { BrandingRecord } from '@sanad/contracts';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { useBrandingForm } from '../hooks/use-branding-form';
import { BrandingColorsSection } from './branding-colors-section';
import { BrandingContactSection } from './branding-contact-section';
import { BrandingIdentitySection } from './branding-identity-section';
import { BrandingSocialSection } from './branding-social-section';
import { BrandingTypographySection } from './branding-typography-section';

/** The branding editor form (presentational — logic in `useBrandingForm`, U5). */
export function BrandingForm({ record }: { record: BrandingRecord }) {
  const { t: tCommon } = useTranslation('common');
  const { form, onSubmit, isSubmitting, isDirty } = useBrandingForm(record);

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-10" noValidate>
        <BrandingIdentitySection />
        <BrandingColorsSection />
        <BrandingTypographySection />
        <BrandingSocialSection />
        <BrandingContactSection />

        {form.formState.errors.root ? (
          <p className="text-sm text-bad" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            {tCommon('actions.save')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
