import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { LocaleTabs } from '../ui/locale-tabs';
import { FieldRenderer } from './field-renderer';
import type { FieldConfig, FormMode } from './field.types';

const COL_SPAN: Record<1 | 2 | 3 | 4, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
};

export interface DynamicFormFieldsProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  /** The already mode-/visibility-filtered fields (from `useDynamicForm`). */
  fields: FieldConfig<TValues>[];
  mode: FormMode;
}

/**
 * The shared field grid (presentation): a 4-column grid of non-translatable fields plus the
 * translatable fields grouped under per-locale LocaleTabs (W6, bound to
 * `translations.<locale>.<name>`), and the form-level root error. Reused by both the modal
 * `DynamicForm` and the routed blog editor page so field rendering stays single-sourced.
 */
export function DynamicFormFields<TValues extends FieldValues>({
  form,
  fields,
  mode,
}: DynamicFormFieldsProps<TValues>) {
  const rendered = fields.filter((field) => field.type !== 'hidden');
  const translatable = rendered.filter((field) => field.translatable);
  const plain = rendered.filter((field) => !field.translatable);

  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
