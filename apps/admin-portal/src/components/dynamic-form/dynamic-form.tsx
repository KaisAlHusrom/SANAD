import type { FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { LocaleTabs } from '../ui/locale-tabs';
import { FieldRenderer } from './field-renderer';
import type { DynamicFormProps } from './dynamic-form.types';
import { useDynamicForm } from './use-dynamic-form';

const COL_SPAN: Record<1 | 2 | 3 | 4, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
};

/**
 * The config-driven CRUD form (presentation; logic in `useDynamicForm`). A 4-column grid
 * of fields by colSpan; translatable fields are grouped under per-locale LocaleTabs (W6,
 * bound to `translations.<locale>.<name>`). Tokens-only, RTL via logical properties.
 * Deeply-nested forms (branding) stay bespoke — this targets flat/standard entities.
 */
export function DynamicForm<TValues extends FieldValues>(
  props: DynamicFormProps<TValues>,
) {
  const { t } = useTranslation('uiKit');
  const { mode, submitLabel, cancelLabel, onCancel } = props;
  const { form, onSubmit, isSubmitting, visibleFields } = useDynamicForm(props);

  const rendered = visibleFields.filter((field) => field.type !== 'hidden');
  const translatable = rendered.filter((field) => field.translatable);
  const plain = rendered.filter((field) => !field.translatable);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {plain.map((field) => (
          <div key={field.name} className={COL_SPAN[field.colSpan ?? 4]}>
            <FieldRenderer
              field={field}
              name={field.name}
              form={form}
              mode={mode}
            />
          </div>
        ))}
      </div>

      {translatable.length > 0 ? (
        <LocaleTabs>
          {(locale) => (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              {translatable.map((field) => (
                <div key={field.name} className={COL_SPAN[field.colSpan ?? 4]}>
                  <FieldRenderer
                    field={field}
                    name={`translations.${locale}.${field.name}`}
                    form={form}
                    mode={mode}
                  />
                </div>
              ))}
            </div>
          )}
        </LocaleTabs>
      ) : null}

      {form.formState.errors.root ? (
        <p className="text-sm text-bad" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel ?? t('form.cancel')}
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel ?? t('form.save')}
        </Button>
      </div>
    </form>
  );
}
