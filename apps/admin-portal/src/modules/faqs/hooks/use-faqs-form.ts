import type { FaqCreateRequest, FaqItem } from '@sanad/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import { useCreateFaqMutation, useUpdateFaqMutation } from '../api/faqs.api';
import {
  FAQ_NULLABLE_KEYS,
  FAQ_TRANSLATABLE_KEYS,
  faqFormSchema,
  type FaqFormValues,
} from '../schema';

export interface UseFaqFormResult {
  fields: FieldConfig<FaqFormValues>[];
  schema: typeof faqFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: FaqFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/** Builds the FAQs create/edit form (U5) — fields, edit prefill, pivoting submit. */
export function useFaqForm(item: FaqItem | undefined): UseFaqFormResult {
  const { t } = useTranslation('faqs');
  const [createFaq] = useCreateFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<FaqFormValues>[]>(
    () => [
      {
        name: 'category',
        type: 'select',
        label: t('fields.category'),
        placeholder: t('categories.none'),
        colSpan: 2,
        options: [
          { value: 'general', label: t('categories.general') },
          { value: 'pricing', label: t('categories.pricing') },
          { value: 'process', label: t('categories.process') },
          { value: 'support', label: t('categories.support') },
        ],
      },
      {
        name: 'question',
        type: 'textarea',
        label: t('fields.question'),
        translatable: true,
        colSpan: 4,
      },
      {
        name: 'answer',
        type: 'textarea',
        label: t('fields.answer'),
        translatable: true,
        colSpan: 4,
        rows: 6,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item ? toLocalizedFormRecord(item, FAQ_TRANSLATABLE_KEYS) : undefined,
    [item],
  );

  const submit = async (values: FaqFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<FaqCreateRequest>(values, {
      translatableKeys: FAQ_TRANSLATABLE_KEYS,
      nullableKeys: FAQ_NULLABLE_KEYS,
    });
    return item
      ? updateFaq({ id: item.id, body }).unwrap()
      : createFaq(body).unwrap();
  };

  return {
    fields,
    schema: faqFormSchema,
    mode,
    record,
    submit,
    title: item ? t('form.editTitle') : t('form.createTitle'),
    successMessage: item ? t('form.updated') : t('form.created'),
  };
}
