import {
  pickLocalized,
  type PortfolioCategoryItem,
  type PortfolioCreateRequest,
  type PortfolioProjectItem,
} from '@sanad/contracts';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import { MediaIdPickerField } from '../../../components/media-picker';
import { ServerSelect } from '../../../components/server-select';
import {
  useGetPortfolioCategoriesByIdsQuery,
  useSearchPortfolioCategoryLookupQuery,
} from '../../../data/lookups/portfolio-category-lookup.api';
import { useDirection } from '../../../providers/direction/use-direction';
import {
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
} from '../api/portfolio.api';
import {
  PORTFOLIO_NULLABLE_KEYS,
  PORTFOLIO_TRANSLATABLE_KEYS,
  portfolioFormSchema,
  type PortfolioFormValues,
} from '../schema';

export interface UsePortfolioFormResult {
  fields: FieldConfig<PortfolioFormValues>[];
  schema: typeof portfolioFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: PortfolioFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * Builds the portfolio-project create/edit form (U5): the i18n field configs (incl. the first
 * content `ServerSelect` — the category picker bridged via the W5 lookup — and the cover
 * `MediaIdPickerField`), the edit prefill record (entity → translations map + `category.id` →
 * `categoryId`), and a submit that pivots form values → the contract upsert body. The
 * DynamicForm owns validation + toasts.
 */
export function usePortfolioForm(
  item: PortfolioProjectItem | undefined,
): UsePortfolioFormResult {
  const { t } = useTranslation('portfolio');
  const { locale } = useDirection();
  const [createPortfolio] = useCreatePortfolioMutation();
  const [updatePortfolio] = useUpdatePortfolioMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<PortfolioFormValues>[]>(
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
        name: 'categoryId',
        type: 'custom',
        label: t('fields.category'),
        colSpan: 2,
        render: ({ form, name }) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <ServerSelect<PortfolioCategoryItem>
                value={
                  typeof field.value === 'string' && field.value
                    ? field.value
                    : undefined
                }
                onChange={(next) =>
                  field.onChange(typeof next === 'string' ? next : '')
                }
                useSearch={useSearchPortfolioCategoryLookupQuery}
                useResolveByIds={useGetPortfolioCategoriesByIdsQuery}
                getOptionValue={(category) => category.id}
                getOptionLabel={(category) =>
                  pickLocalized(category.name, locale)
                }
                placeholder={t('fields.categoryPlaceholder')}
              />
            )}
          />
        ),
      },
      {
        name: 'featured',
        type: 'toggle',
        label: t('fields.featured'),
        colSpan: 2,
      },
      {
        name: 'clientName',
        type: 'text',
        label: t('fields.clientName'),
        colSpan: 2,
      },
      {
        name: 'projectUrl',
        type: 'text',
        label: t('fields.projectUrl'),
        placeholder: t('fields.projectUrlPlaceholder'),
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
        name: 'challenge',
        type: 'textarea',
        label: t('fields.challenge'),
        translatable: true,
        colSpan: 4,
        rows: 4,
      },
      {
        name: 'solution',
        type: 'textarea',
        label: t('fields.solution'),
        translatable: true,
        colSpan: 4,
        rows: 4,
      },
      {
        name: 'result',
        type: 'textarea',
        label: t('fields.result'),
        translatable: true,
        colSpan: 4,
        rows: 4,
      },
    ],
    [t, locale],
  );

  const record = useMemo(
    () =>
      item
        ? {
            ...toLocalizedFormRecord(item, PORTFOLIO_TRANSLATABLE_KEYS),
            // The entity embeds `category` (object); the form binds a flat `categoryId`.
            categoryId: item.category?.id ?? '',
          }
        : undefined,
    [item],
  );

  const submit = async (values: PortfolioFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<PortfolioCreateRequest>(values, {
      translatableKeys: PORTFOLIO_TRANSLATABLE_KEYS,
      nullableKeys: PORTFOLIO_NULLABLE_KEYS,
    });
    return item
      ? updatePortfolio({ id: item.id, body }).unwrap()
      : createPortfolio(body).unwrap();
  };

  return {
    fields,
    schema: portfolioFormSchema,
    mode,
    record,
    submit,
    title: item ? t('form.editTitle') : t('form.createTitle'),
    successMessage: item ? t('form.updated') : t('form.created'),
  };
}
