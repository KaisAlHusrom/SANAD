import type { PageSummary, PageUpsertRequest } from '@sanad/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import { useUpsertPageMutation } from '../api/pages.api';
import {
  PAGE_TRANSLATABLE_KEYS,
  pageFormSchema,
  type PageFormValues,
} from '../schema';

export interface UsePageFormResult {
  fields: FieldConfig<PageFormValues>[];
  schema: typeof pageFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: PageFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * The page-meta create/edit form (U5): slug + status + the translatable title/SEO meta. The
 * submit pivots the form's `translations` map back to the contract's top-level `{ar,en}` and
 * preserves the existing `sortOrder` on edit (ordering is owned by the reorder list, U21).
 */
export function usePageForm(item: PageSummary | undefined): UsePageFormResult {
  const { t } = useTranslation('pages');
  const [upsertPage] = useUpsertPageMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<PageFormValues>[]>(
    () => [
      {
        name: 'slug',
        type: 'slug',
        label: t('fields.slug'),
        colSpan: 2,
        slugSource: ['translations.en.title', 'translations.ar.title'],
      },
      {
        name: 'status',
        type: 'select',
        label: t('fields.status'),
        colSpan: 2,
        defaultValue: 'draft',
        options: [
          { value: 'draft', label: t('status.draft') },
          { value: 'published', label: t('status.published') },
        ],
      },
      {
        name: 'title',
        type: 'text',
        label: t('fields.title'),
        translatable: true,
        colSpan: 4,
      },
      {
        name: 'metaTitle',
        type: 'text',
        label: t('fields.metaTitle'),
        translatable: true,
        colSpan: 4,
      },
      {
        name: 'metaDescription',
        type: 'textarea',
        label: t('fields.metaDescription'),
        translatable: true,
        colSpan: 4,
        rows: 3,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item ? toLocalizedFormRecord(item, PAGE_TRANSLATABLE_KEYS) : undefined,
    [item],
  );

  const submit = async (values: PageFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<PageUpsertRequest>(values, {
      translatableKeys: PAGE_TRANSLATABLE_KEYS,
    });
    return upsertPage({
      ...body,
      ...(item ? { id: item.id, sortOrder: item.sortOrder } : { sortOrder: 0 }),
    }).unwrap();
  };

  return {
    fields,
    schema: pageFormSchema,
    mode,
    record,
    submit,
    title: item ? t('form.editTitle') : t('form.createTitle'),
    successMessage: item ? t('form.updated') : t('form.created'),
  };
}
