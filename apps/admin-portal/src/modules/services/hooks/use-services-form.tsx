import type { ServiceCreateRequest, ServiceItem } from '@sanad/contracts';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import { MediaIdPickerField } from '../../../components/media-picker';
import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
} from '../api/services.api';
import {
  SERVICE_NULLABLE_KEYS,
  SERVICE_TRANSLATABLE_KEYS,
  serviceFormSchema,
  type ServiceFormValues,
} from '../schema';

export interface UseServiceFormResult {
  fields: FieldConfig<ServiceFormValues>[];
  schema: typeof serviceFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: ServiceFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * Builds the services create/edit form (U5): the i18n field configs, the edit prefill
 * record (entity → translations map), and a submit that pivots form values → the contract
 * upsert body and calls the right mutation. The DynamicForm owns validation + toasts.
 */
export function useServiceForm(
  item: ServiceItem | undefined,
): UseServiceFormResult {
  const { t } = useTranslation('services');
  const [createService] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<ServiceFormValues>[]>(
    () => [
      {
        name: 'slug',
        type: 'slug',
        label: t('fields.slug'),
        colSpan: 2,
        slugSource: ['translations.en.title', 'translations.ar.title'],
      },
      {
        name: 'category',
        type: 'select',
        label: t('fields.category'),
        colSpan: 2,
        options: [
          { value: 'core', label: t('categories.core') },
          { value: 'support', label: t('categories.support') },
        ],
      },
      {
        name: 'iconKey',
        type: 'text',
        label: t('fields.iconKey'),
        placeholder: t('fields.iconKeyPlaceholder'),
        colSpan: 2,
      },
      {
        name: 'coverMediaId',
        type: 'custom',
        label: t('fields.cover'),
        colSpan: 4,
        render: ({ form, name }) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <MediaIdPickerField
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={field.onChange}
              />
            )}
          />
        ),
      },
      {
        name: 'title',
        type: 'text',
        label: t('fields.title'),
        translatable: true,
        colSpan: 4,
      },
      {
        name: 'summary',
        type: 'textarea',
        label: t('fields.summary'),
        translatable: true,
        colSpan: 4,
      },
      {
        name: 'detailBody',
        type: 'textarea',
        label: t('fields.detailBody'),
        translatable: true,
        colSpan: 4,
        rows: 6,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item ? toLocalizedFormRecord(item, SERVICE_TRANSLATABLE_KEYS) : undefined,
    [item],
  );

  const submit = async (values: ServiceFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<ServiceCreateRequest>(values, {
      translatableKeys: SERVICE_TRANSLATABLE_KEYS,
      nullableKeys: SERVICE_NULLABLE_KEYS,
    });
    return item
      ? updateService({ id: item.id, body }).unwrap()
      : createService(body).unwrap();
  };

  return {
    fields,
    schema: serviceFormSchema,
    mode,
    record,
    submit,
    title: item ? t('form.editTitle') : t('form.createTitle'),
    successMessage: item ? t('form.updated') : t('form.created'),
  };
}
