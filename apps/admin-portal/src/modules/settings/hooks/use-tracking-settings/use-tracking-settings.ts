import {
  CONSENT_SETTING_KEYS,
  TRACKING_GROUP,
  TRACKING_SECTION_CONSENT,
  TRACKING_SECTION_DESTINATIONS,
  type SettingField,
} from '@sanad/contracts';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { isApiError } from '../../../../data/api/api-error';
import { useConfirm } from '../../../../data/confirm';
import { toast } from '../../../../data/toast';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from '../../api/settings.api';
import {
  fieldId,
  toChangedWrites,
  toSectionFormValues,
  type SectionFormValues,
} from '../../lib/setting-form';
import {
  isDoubleCounting,
  toDestinationViews,
  type DestinationView,
} from '../../lib/tracking-view';

/** The branding key the policy-link preview borrows to show a real destination url. */
const SITE_URL_KEY = 'branding.seo.siteUrl';

export interface UseTrackingSettingsResult {
  form: UseFormReturn<SectionFormValues>;
  isLoading: boolean;
  isError: boolean;
  /** The group is missing entirely — an older backend, not an empty configuration. */
  isUnavailable: boolean;
  refetch: () => void;
  consentFields: readonly SettingField[];
  destinations: readonly DestinationView[];
  doubleCounting: boolean;
  policyVersion: number;
  siteUrl: string | null;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  onReset: () => void;
  isSubmitting: boolean;
  isDirty: boolean;
  /** Re-ask every visitor by bumping the policy version. Blocked while the form is dirty. */
  bumpPolicyVersion: () => Promise<void>;
}

function errorMessage(error: unknown, t: TFunction<'settings'>): string {
  return isApiError(error) ? error.message : t('errors.unknown');
}

/**
 * The Tracking & consent page's logic (U5). One form over BOTH sections of the `tracking`
 * group so an operator setting up several destinations saves once, diffed through the same
 * `toChangedWrites` the generic settings sections use (F9) — only changed keys are sent.
 *
 * Every read is null-safe to the leaf (F7): a backend that does not yet publish the group
 * yields `isUnavailable` rather than a blank screen of controls bound to nothing.
 */
export function useTrackingSettings(): UseTrackingSettingsResult {
  const { t } = useTranslation('settings');
  const { confirm } = useConfirm();
  const { data, isLoading, isError, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSubmitting }] =
    useUpdateSettingsMutation();

  const group = data?.groups?.find((entry) => entry.group === TRACKING_GROUP);
  const consentFields = useMemo(
    () =>
      group?.sections?.find(
        (section) => section.section === TRACKING_SECTION_CONSENT,
      )?.fields ?? [],
    [group],
  );
  const destinationFields = useMemo(
    () =>
      group?.sections?.find(
        (section) => section.section === TRACKING_SECTION_DESTINATIONS,
      )?.fields ?? [],
    [group],
  );
  const allFields = useMemo(
    () => [...consentFields, ...destinationFields],
    [consentFields, destinationFields],
  );

  const defaults = useMemo(() => toSectionFormValues(allFields), [allFields]);
  // `values` (not `defaultValues`) — a server prefill must not mark the form dirty (F6).
  const form = useForm<SectionFormValues>({ values: defaults });

  // Watched, so a status chip and the double-count warning answer for what the operator is
  // looking at right now — not for what was last saved.
  const live = useWatch({ control: form.control }) as SectionFormValues;
  const destinations = useMemo(() => toDestinationViews(live ?? {}), [live]);

  const policyVersionValue =
    live?.[fieldId(CONSENT_SETTING_KEYS.policyVersion)];
  const policyVersion =
    typeof policyVersionValue === 'number' ? policyVersionValue : 1;

  const siteUrlField = data?.groups
    ?.flatMap((entry) => entry.sections ?? [])
    ?.flatMap((section) => section.fields ?? [])
    ?.find((field) => field.key === SITE_URL_KEY);
  const siteUrl =
    typeof siteUrlField?.value === 'string' && siteUrlField.value !== ''
      ? siteUrlField.value
      : null;

  const onSubmit = form.handleSubmit(
    async (values) => {
      const writes = toChangedWrites(allFields, values);
      if (writes.length === 0) return;
      try {
        await updateSettings({ values: writes }).unwrap();
        toast.success(t('actions.saved'));
      } catch (error) {
        const message = errorMessage(error, t);
        form.setError('root', { message });
        toast.error(message);
      }
    },
    // U22: a blocked submit is NEVER a silent no-op. An invalid vendor id attaches its error
    // to a field that may be scrolled out of view, so say so where the action was taken too.
    () => {
      const message = t('tracking.errors.fixFieldsFirst');
      form.setError('root', { message });
      toast.error(message);
    },
  );

  const bumpPolicyVersion = async (): Promise<void> => {
    await confirm({
      title: t('tracking.consent.reask.title'),
      message: t('tracking.consent.reask.message'),
      confirmLabel: t('tracking.consent.reask.confirm'),
      onConfirm: async () => {
        try {
          await updateSettings({
            values: [
              {
                key: CONSENT_SETTING_KEYS.policyVersion,
                value: policyVersion + 1,
              },
            ],
          }).unwrap();
          toast.success(t('tracking.consent.reask.done'));
        } catch (error) {
          const message = errorMessage(error, t);
          toast.error(message);
          throw new Error(message);
        }
      },
    });
  };

  return {
    form,
    isLoading,
    isError,
    isUnavailable: !isLoading && !isError && group === undefined,
    refetch: () => void refetch(),
    consentFields,
    destinations,
    doubleCounting: isDoubleCounting(destinations),
    policyVersion,
    siteUrl,
    onSubmit,
    onReset: () => form.reset(defaults),
    isSubmitting,
    isDirty: form.formState.isDirty,
    bumpPolicyVersion,
  };
}
