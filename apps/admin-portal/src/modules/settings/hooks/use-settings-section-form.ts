import type { SettingSection } from '@sanad/contracts';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import { isApiError } from '../../../data/api/api-error';
import { useUpdateSettingsMutation } from '../api/settings.api';
import {
  toChangedWrites,
  toSectionFormValues,
  type SectionFormValues,
} from '../lib/setting-form';

function settingsErrorMessage(
  error: unknown,
  t: TFunction<'settings'>,
): string {
  return isApiError(error) ? error.message : t('errors.unknown');
}

interface UseSettingsSectionFormResult {
  form: UseFormReturn<SectionFormValues>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  onReset: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
}

/**
 * One section's edit-form logic (U5/F6). Prefills from the section's resolved values via RHF
 * `values` (a server prefill is NOT dirty), and on Save sends **only the changed keys**
 * (`toChangedWrites`) through the generic `updateSettings` — the `Settings` tag refetch
 * re-baselines the form from the server. Reset reverts to the resolved values.
 */
export function useSettingsSectionForm(
  section: SettingSection,
): UseSettingsSectionFormResult {
  const { t } = useTranslation('settings');
  const [updateSettings, { isLoading }] = useUpdateSettingsMutation();

  const defaults = useMemo(
    () => toSectionFormValues(section.fields),
    [section],
  );
  const form = useForm<SectionFormValues>({ values: defaults });

  const onSubmit = form.handleSubmit(async (values) => {
    const writes = toChangedWrites(section.fields, values);
    if (writes.length === 0) {
      return; // nothing changed
    }
    try {
      await updateSettings({ values: writes }).unwrap();
      toast.success(t('actions.saved'));
    } catch (error) {
      form.setError('root', { message: settingsErrorMessage(error, t) });
    }
  });

  return {
    form,
    onSubmit,
    onReset: () => form.reset(defaults),
    isSubmitting: isLoading,
    isDirty: form.formState.isDirty,
  };
}
