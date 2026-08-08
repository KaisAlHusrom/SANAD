import {
  pickLocalized,
  type BlogCategoryItem,
  type BlogPostCreateRequest,
  type BlogPostItem,
  type BlogTagItem,
  type TeamMemberItem,
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
import { RichTextEditor } from '../../../components/rich-text';
import { ServerSelect } from '../../../components/server-select';
import {
  useGetBlogCategoriesByIdsQuery,
  useSearchBlogCategoryLookupQuery,
} from '../../../data/lookups/blog-category-lookup.api';
import {
  useGetBlogTagsByIdsQuery,
  useSearchBlogTagLookupQuery,
} from '../../../data/lookups/blog-tag-lookup.api';
import {
  useGetTeamMembersByIdsQuery,
  useSearchTeamMemberLookupQuery,
} from '../../../data/lookups/team-member-lookup.api';
import { useDirection } from '../../../providers/direction/use-direction';
import { useCreateBlogMutation, useUpdateBlogMutation } from '../api/blog.api';
import {
  BLOG_NULLABLE_KEYS,
  BLOG_TRANSLATABLE_KEYS,
  blogPostFormSchema,
  type BlogPostFormValues,
} from '../schema';

export interface UseBlogFormResult {
  fields: FieldConfig<BlogPostFormValues>[];
  schema: typeof blogPostFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: BlogPostFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/**
 * Builds the blog-post create/edit form (U5): the i18n field configs (the category + author
 * single `ServerSelect`s and the **multi** tags ServerSelect — each bridged via a W5 lookup — the
 * cover `MediaIdPickerField`, and the translatable rich-text `body`), the edit prefill record
 * (entity → translations map + embedded `category`/`author`/`tags` → flat ids), and a submit that
 * pivots form values → the contract upsert body. The DynamicForm owns validation + toasts.
 */
export function useBlogForm(item: BlogPostItem | undefined): UseBlogFormResult {
  const { t } = useTranslation('blog');
  const { locale } = useDirection();
  const [createBlog] = useCreateBlogMutation();
  const [updateBlog] = useUpdateBlogMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<BlogPostFormValues>[]>(
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
              <ServerSelect<BlogCategoryItem>
                value={
                  typeof field.value === 'string' && field.value
                    ? field.value
                    : undefined
                }
                onChange={(next) =>
                  field.onChange(typeof next === 'string' ? next : '')
                }
                useSearch={useSearchBlogCategoryLookupQuery}
                useResolveByIds={useGetBlogCategoriesByIdsQuery}
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
        name: 'authorTeamMemberId',
        type: 'custom',
        label: t('fields.author'),
        colSpan: 2,
        render: ({ form, name }) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <ServerSelect<TeamMemberItem>
                value={
                  typeof field.value === 'string' && field.value
                    ? field.value
                    : undefined
                }
                onChange={(next) =>
                  field.onChange(typeof next === 'string' ? next : '')
                }
                useSearch={useSearchTeamMemberLookupQuery}
                useResolveByIds={useGetTeamMembersByIdsQuery}
                getOptionValue={(member) => member.id}
                getOptionLabel={(member) => pickLocalized(member.name, locale)}
                placeholder={t('fields.authorPlaceholder')}
              />
            )}
          />
        ),
      },
      {
        name: 'readMinutes',
        type: 'number',
        label: t('fields.readMinutes'),
        colSpan: 2,
      },
      {
        name: 'tagIds',
        type: 'custom',
        label: t('fields.tags'),
        colSpan: 4,
        defaultValue: [],
        render: ({ form, name }) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <ServerSelect<BlogTagItem>
                multiple
                value={Array.isArray(field.value) ? field.value : []}
                onChange={(next) =>
                  field.onChange(Array.isArray(next) ? next : [])
                }
                useSearch={useSearchBlogTagLookupQuery}
                useResolveByIds={useGetBlogTagsByIdsQuery}
                getOptionValue={(tag) => tag.id}
                getOptionLabel={(tag) => pickLocalized(tag.name, locale)}
                placeholder={t('fields.tagsPlaceholder')}
              />
            )}
          />
        ),
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
        name: 'excerpt',
        type: 'textarea',
        label: t('fields.excerpt'),
        translatable: true,
        colSpan: 4,
      },
      {
        name: 'body',
        type: 'custom',
        label: t('fields.body'),
        translatable: true,
        colSpan: 4,
        render: ({ form, name }) => (
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <RichTextEditor
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={field.onChange}
                aria-label={t('fields.body')}
              />
            )}
          />
        ),
      },
    ],
    [t, locale],
  );

  const record = useMemo(
    () =>
      item
        ? {
            ...toLocalizedFormRecord(item, BLOG_TRANSLATABLE_KEYS),
            // The entity embeds `category`/`author` (objects) + `tags` (array); the form binds
            // flat ids.
            categoryId: item.category?.id ?? '',
            authorTeamMemberId: item.author?.id ?? '',
            tagIds: item.tags.map((tag) => tag.id),
          }
        : undefined,
    [item],
  );

  const submit = async (values: BlogPostFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<BlogPostCreateRequest>(values, {
      translatableKeys: BLOG_TRANSLATABLE_KEYS,
      nullableKeys: BLOG_NULLABLE_KEYS,
    });
    return item
      ? updateBlog({ id: item.id, body }).unwrap()
      : createBlog(body).unwrap();
  };

  return {
    fields,
    schema: blogPostFormSchema,
    mode,
    record,
    submit,
    title: item ? t('form.editTitle') : t('form.createTitle'),
    successMessage: item ? t('form.updated') : t('form.created'),
  };
}
