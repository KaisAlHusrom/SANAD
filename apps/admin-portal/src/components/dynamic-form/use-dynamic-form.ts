import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import {
  useForm,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from '../../data/toast';
import type { ApiError } from '../../data/types/api-error.types';
import { buildDefaultValues, emptyForType } from './build-default-values';
import type { DynamicFormProps } from './dynamic-form.types';
import type { FieldConfig } from './field.types';

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

export interface UseDynamicFormResult<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  /** Fields filtered by mode (showInCreate/showInEdit) + `visibleWhen`. */
  visibleFields: FieldConfig<TValues>[];
}

/**
 * The config-driven CRUD form's logic (U5/F6). RHF + the caller's Zod schema (U16);
 * prefill via reactive `values` (a server prefill doesn't mark dirty, F6); cascading
 * resets a dependent when its parent changes; on submit it calls the injected mutation
 * and maps a rejected `ApiError.fields` back to per-field errors (else a root error +
 * toast). Toasts success.
 */
export function useDynamicForm<TValues extends FieldValues>(
  props: DynamicFormProps<TValues>,
): UseDynamicFormResult<TValues> {
  const { fields, schema, mode, record, submit, successMessage, onSuccess } =
    props;
  const { t } = useTranslation('common');

  const values = useMemo(
    () => buildDefaultValues<TValues>({ fields, record }),
    [fields, record],
  );
  const form = useForm<TValues>({ resolver: zodResolver(schema), values });

  // Cascading: a dependent resets to its default when its parent (dependsOn) changes.
  useEffect(() => {
    const subscription = form.watch((_values, { name }) => {
      if (!name) {
        return;
      }
      for (const field of fields) {
        if (field.dependsOn && field.dependsOn === name) {
          const cleared = (field.defaultValue ??
            emptyForType(field.type)) as PathValue<TValues, Path<TValues>>;
          form.setValue(field.name, cleared);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [fields, form]);

  const watched = form.watch();
  const visibleFields = useMemo<FieldConfig<TValues>[]>(
    () =>
      fields.filter((field) => {
        const inMode =
          mode === 'create'
            ? field.showInCreate !== false
            : field.showInEdit !== false;
        if (!inMode) {
          return false;
        }
        return field.visibleWhen ? field.visibleWhen(watched) : true;
      }),
    [fields, mode, watched],
  );

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      await submit(formValues);
      toast.success(successMessage);
      form.reset(mode === 'create' ? values : formValues);
      onSuccess?.();
    } catch (error) {
      if (isApiError(error) && error.fields) {
        for (const [field, message] of Object.entries(error.fields)) {
          form.setError(field as Path<TValues>, { type: 'server', message });
        }
        return;
      }
      const message = isApiError(error) ? error.message : t('states.error');
      form.setError('root', { message });
      toast.error(message);
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
    visibleFields,
  };
}
