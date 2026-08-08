import type {
  PortfolioCategoryCreateRequest,
  PortfolioCategoryItem,
} from '@sanad/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import {
  useCreatePortfolioCategoryMutation,
  useUpdatePortfolioCategoryMutation,
} from '../api/portfolio-categories.api';
import {
  PORTFOLIO_CATEGORY_TRANSLATABLE_KEYS,
  portfolioCategoryFormSchema,
  type PortfolioCategoryFormValues,
} from '../schema';

export interface UsePortfolioCategoryFormResult {
  fields: FieldConfig<PortfolioCategoryFormValues>[];
  schema: typeof portfolioCategoryFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: PortfolioCategoryFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * Builds the portfolio-category create/edit form (U5): the i18n field configs, the edit prefill
 * record (entity → translations map), and a submit that pivots form values → the contract upsert
 * body. The DynamicForm owns validation + toasts.
 */
export function usePortfolioCategoryForm(
  item: PortfolioCategoryItem | undefined,
): UsePortfolioCategoryFormResult {
  const { t } = useTranslation('portfolio');
  const [createCategory] = useCreatePortfolioCategoryMutation();
  const [updateCategory] = useUpdatePortfolioCategoryMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<PortfolioCategoryFormValues>[]>(
    () => [
      {
        name: 'slug',
        type: 'slug',
        label: t('categoryFields.slug'),
        colSpan: 2,
        slugSource: ['translations.en.name', 'translations.ar.name'],
      },
      {
        name: 'name',
        type: 'text',
        label: t('categoryFields.name'),
        translatable: true,
        colSpan: 4,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item
        ? toLocalizedFormRecord(item, PORTFOLIO_CATEGORY_TRANSLATABLE_KEYS)
        : undefined,
    [item],
  );

  const submit = async (
    values: PortfolioCategoryFormValues,
  ): Promise<unknown> => {
    const body = toLocalizedUpsertBody<PortfolioCategoryCreateRequest>(values, {
      translatableKeys: PORTFOLIO_CATEGORY_TRANSLATABLE_KEYS,
    });
    return item
      ? updateCategory({ id: item.id, body }).unwrap()
      : createCategory(body).unwrap();
  };

  return {
    fields,
    schema: portfolioCategoryFormSchema,
    mode,
    record,
    submit,
    title: item ? t('categoryForm.editTitle') : t('categoryForm.createTitle'),
    successMessage: item
      ? t('categoryForm.updated')
      : t('categoryForm.created'),
  };
}
