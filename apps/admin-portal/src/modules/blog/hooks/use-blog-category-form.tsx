import type {
  BlogCategoryCreateRequest,
  BlogCategoryItem,
} from '@sanad/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import {
  useCreateBlogCategoryMutation,
  useUpdateBlogCategoryMutation,
} from '../api/blog-categories.api';
import {
  BLOG_CATEGORY_TRANSLATABLE_KEYS,
  blogCategoryFormSchema,
  type BlogCategoryFormValues,
} from '../schema';

export interface UseBlogCategoryFormResult {
  fields: FieldConfig<BlogCategoryFormValues>[];
  schema: typeof blogCategoryFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: BlogCategoryFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * Builds the blog-category create/edit form (U5): the i18n field configs (translatable name +
 * description), the edit prefill record (entity → translations map), and a submit that pivots
 * form values → the contract upsert body. The DynamicForm owns validation + toasts.
 */
export function useBlogCategoryForm(
  item: BlogCategoryItem | undefined,
): UseBlogCategoryFormResult {
  const { t } = useTranslation('blog');
  const [createCategory] = useCreateBlogCategoryMutation();
  const [updateCategory] = useUpdateBlogCategoryMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<BlogCategoryFormValues>[]>(
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
      {
        name: 'description',
        type: 'textarea',
        label: t('categoryFields.description'),
        translatable: true,
        colSpan: 4,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item
        ? toLocalizedFormRecord(item, BLOG_CATEGORY_TRANSLATABLE_KEYS)
        : undefined,
    [item],
  );

  const submit = async (values: BlogCategoryFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<BlogCategoryCreateRequest>(values, {
      translatableKeys: BLOG_CATEGORY_TRANSLATABLE_KEYS,
    });
    return item
      ? updateCategory({ id: item.id, body }).unwrap()
      : createCategory(body).unwrap();
  };

  return {
    fields,
    schema: blogCategoryFormSchema,
    mode,
    record,
    submit,
    title: item ? t('categoryForm.editTitle') : t('categoryForm.createTitle'),
    successMessage: item
      ? t('categoryForm.updated')
      : t('categoryForm.created'),
  };
}
