import { zodResolver } from '@hookform/resolvers/zod';
import {
  brandingUpdateRequestSchema,
  type BrandingRecord,
} from '@sanad/contracts';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { ApiError } from '../../../data/types/api-error.types';
import { useUpdateBrandingMutation } from '../api/settings.api';
import { diffBranding } from '../lib/diff-branding';
import { toFormValues } from '../lib/to-form-values';
import {
  brandingFormSchema,
  type BrandingFormValues,
} from '../validation/branding-form.zod.types';

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

function brandingErrorKey(error: unknown, t: TFunction<'settings'>): string {
  if (isApiError(error)) return error.message;
  return t('errors.unknown');
}

interface UseBrandingFormResult {
  form: UseFormReturn<BrandingFormValues>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  isDirty: boolean;
}

/**
 * Branding edit-form logic (U5/F6). Prefills via RHF `values` (system prefill is NOT dirty),
 * builds a deep-partial diff of only changed leaves (`diffBranding`), validates it against
 * the contract schema (U16), and PUTs — an empty diff is a no-op. The `Branding` tag refetch
 * re-baselines the form from the server.
 */
export function useBrandingForm(record: BrandingRecord): UseBrandingFormResult {
  const { t } = useTranslation('settings');
  const [updateBranding, { isLoading }] = useUpdateBrandingMutation();

  // Stable across renders (only re-syncs when the record reference changes, e.g. after a
  // refetch) so RHF's `values` prop doesn't clobber in-progress edits each render.
  const formValues = useMemo(() => toFormValues(record), [record]);
  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    values: formValues,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const diff = diffBranding(record, values);
    if (Object.keys(diff).length === 0) {
      return; // nothing changed
    }
    try {
      const payload = brandingUpdateRequestSchema.parse(diff);
      await updateBranding(payload).unwrap();
    } catch (error) {
      form.setError('root', { message: brandingErrorKey(error, t) });
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: isLoading,
    isDirty: form.formState.isDirty,
  };
}
