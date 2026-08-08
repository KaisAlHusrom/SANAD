import type {
  TestimonialCreateRequest,
  TestimonialItem,
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
import {
  useCreateTestimonialMutation,
  useUpdateTestimonialMutation,
} from '../api/testimonials.api';
import {
  TESTIMONIAL_NULLABLE_KEYS,
  TESTIMONIAL_TRANSLATABLE_KEYS,
  testimonialFormSchema,
  type TestimonialFormValues,
} from '../schema';

export interface UseTestimonialFormResult {
  fields: FieldConfig<TestimonialFormValues>[];
  schema: typeof testimonialFormSchema;
  mode: FormMode;
  record?: Record<string, unknown>;
  submit: (values: TestimonialFormValues) => Promise<unknown>;
  title: string;
  successMessage: string;
}

/** Builds the testimonials create/edit form (U5) — fields, edit prefill, pivoting submit. */
export function useTestimonialForm(
  item: TestimonialItem | undefined,
): UseTestimonialFormResult {
  const { t } = useTranslation('testimonials');
  const [createTestimonial] = useCreateTestimonialMutation();
  const [updateTestimonial] = useUpdateTestimonialMutation();
  const mode: FormMode = item ? 'edit' : 'create';

  const fields = useMemo<FieldConfig<TestimonialFormValues>[]>(
    () => [
      {
        name: 'authorName',
        type: 'text',
        label: t('fields.authorName'),
        colSpan: 2,
      },
      {
        name: 'companyName',
        type: 'text',
        label: t('fields.companyName'),
        colSpan: 2,
      },
      {
        name: 'rating',
        type: 'number',
        label: t('fields.rating'),
        placeholder: t('fields.ratingPlaceholder'),
        colSpan: 2,
      },
      {
        name: 'featured',
        type: 'toggle',
        label: t('fields.featured'),
        colSpan: 2,
      },
      {
        name: 'avatarMediaId',
        type: 'custom',
        label: t('fields.avatar'),
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
        name: 'quote',
        type: 'textarea',
        label: t('fields.quote'),
        translatable: true,
        colSpan: 4,
      },
      {
        name: 'authorRole',
        type: 'text',
        label: t('fields.authorRole'),
        translatable: true,
        colSpan: 2,
      },
      {
        name: 'companyDescriptor',
        type: 'text',
        label: t('fields.companyDescriptor'),
        translatable: true,
        colSpan: 2,
      },
    ],
    [t],
  );

  const record = useMemo(
    () =>
      item
        ? toLocalizedFormRecord(item, TESTIMONIAL_TRANSLATABLE_KEYS)
        : undefined,
    [item],
  );

  const submit = async (values: TestimonialFormValues): Promise<unknown> => {
    const body = toLocalizedUpsertBody<TestimonialCreateRequest>(values, {
      translatableKeys: TESTIMONIAL_TRANSLATABLE_KEYS,
      nullableKeys: TESTIMONIAL_NULLABLE_KEYS,
    });
    return item
      ? updateTestimonial({ id: item.id, body }).unwrap()
      : createTestimonial(body).unwrap();
  };

  return {
    fields,
    schema: testimonialFormSchema,
    mode,
    record,
    submit,
    title: item ? t('form.editTitle') : t('form.createTitle'),
    successMessage: item ? t('form.updated') : t('form.created'),
  };
}
