import type { BlogTagCreateRequest, BlogTagItem } from '@sanad/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldConfig, FormMode } from '../../../components/dynamic-form';
import {
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from '../../../components/dynamic-form';
import {
  useCreateBlogTagMutation,
  useUpdateBlogTagMutation,
} from '../api/blog-tags.api';
import {
  BLOG_TAG_TRANSLATABLE_KEYS,
  blogTagFormSchema,
  type BlogTagFormValues,
} from '../schema';

export interface UseBlogTagFormResult {
  fields: FieldConfig<BlogTagFormValues>[];
  schema: typeof blogTagFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: BlogTagFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * Builds the blog-tag create/edit form (U5): the i18n field configs (translatable name), the edit
 * prefill record (entity → translations map), and a submit that pivots form values → the contract
 * upsert body. The DynamicForm owns validation + toasts.
 */
export function useBlogTagForm(
  item: BlogTagItem | undefined,
): UseBlogTagFormResult {
  const { t } = useTranslation('blog');
  const [createTag] = useCreateBlogTagMutation();
  const [updateTag] = useUpdateBlogTagMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<BlogTagFormValues>[]>(
    () => [
      {
        name: 'slug',
        type: 'slug',
        label: t('tagFields.slug'),
        colSpan: 2,
        slugSource: ['translations.en.name', 'translations.ar.name'],
      },
      {
        name: 'name',
        type: 'text',
        label: t('tagFields.name'),
        translatable: true,
        colSpan: 4,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item
        ? toLocalizedFormRecord(item, BLOG_TAG_TRANSLATABLE_KEYS)
        : undefined,
    [item],
  );

  const submit = async (values: BlogTagFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<BlogTagCreateRequest>(values, {
      translatableKeys: BLOG_TAG_TRANSLATABLE_KEYS,
    });
    return item
      ? updateTag({ id: item.id, body }).unwrap()
      : createTag(body).unwrap();
  };

  return {
    fields,
    schema: blogTagFormSchema,
    mode,
    record,
    submit,
    title: item ? t('tagForm.editTitle') : t('tagForm.createTitle'),
    successMessage: item ? t('tagForm.updated') : t('tagForm.created'),
  };
}
